from datetime import datetime, timedelta
from typing import Optional, Union, cast

from fastapi import Depends, HTTPException, Request, status
from jose import jwt
from passlib.context import CryptContext
from sqlalchemy import insert, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import (ACCESS_TOKEN_EXPIRE_MINUTES, ALGORITHM,
                        JWT_COOKIE_NAME, RESET_TOKEN_EXPIRE_HOURS, SECRET_KEY)
from app.db import get_async_db_session
from app.models import User
from app.schemas.auth import CurrentUserResponse, SignupForm
from app.schemas.user import UserUpdate
from app.services.oauth_service import OAuthService
from app.utils.send_email import send_password_reset_email

OAUTH_SERVICES = ["GOOGLE_OAUTH2"]


class UserService:
    def __init__(
        self,
        db: AsyncSession,
        current_user: Optional[CurrentUserResponse],
        request: Request,
    ):
        self.db = db
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self.current_user = current_user
        self.request = request
        self.oauth_service = OAuthService(db, request)

    async def get_user_by_id(self, user_id: str) -> User:
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        return user

    async def get_user_by_email(self, email: str) -> User:
        result = await self.db.execute(select(User).where(User.email == email.lower()))
        return result.scalar()

    async def get_user_by_stripe_customer_id(self, stripe_customer_id: str) -> User:
        result = await self.db.execute(
            select(User).where(User.stripe_customer_id == stripe_customer_id)
        )
        return result.scalar()

    async def get_user(self) -> User:
        return await self.get_user_by_id(self.current_user.user_id)

    async def login(self, email: str, password: str) -> dict:
        user = await self.authenticate_user(email, password)
        return self.create_access_token_from_user(user)

    async def login_oauth(self, oauth_service: str) -> dict:
        if oauth_service not in OAUTH_SERVICES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid OAuth service",
            )
        user_data = self.oauth_service.google_callback()
        user = await self.get_user_by_email(user_data["email"])
        if not user:
            user = await self.create_oauth_user(user_data)
        return self.create_access_token_from_user(user)

    def create_access_token_from_user(self, user: User):
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = self.create_access_token(
            data={
                "sub": user.email,
                "user_id": str(user.id),
                "full_name": user.full_name,
            },
            expires_delta=access_token_expires,
        )
        return {"access_token": access_token, "token_type": "bearer"}

    async def create_user(
        self,
        data: SignupForm,
    ) -> User:

        hashed_password = self.get_password_hash(data.password)
        stmt = (
            insert(User)
            .values(
                email=data.email.lower(),
                password_hash=hashed_password,
                full_name=data.full_name,
            )
            .returning(User)
        )

        try:
            result = await self.db.execute(stmt)
            await self.db.commit()
            new_user = result.fetchone()
            # token = self.generate_verification_token(new_user.email, SECRET_KEY, SALT)
            # await send_confirmation_email(new_user.email, new_user.full_name, token)
            return cast(User, new_user)
        except IntegrityError:
            await self.db.rollback()  # Rollback in case of an integrity error
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Email already registered."
            )

    async def create_oauth_user(self, user_data: dict) -> User:
        stmt = (
            insert(User)
            .values(
                email=user_data["email"].strip().lower(),
                full_name=user_data["name"].strip(),
                verified=True,
                last_login=datetime.utcnow(),
            )
            .returning(User)
        )

        try:
            result = await self.db.execute(stmt)
            await self.db.commit()
            new_user = result.scalar_one()
            return new_user
        except IntegrityError:
            await self.db.rollback()
            # User already exists, fetch and return existing user
            return await self.get_user_by_email(user_data["email"])

    @staticmethod
    def get_user_from_cookie(jwt_token: str) -> Optional[CurrentUserResponse]:
        try:
            payload = jwt.decode(jwt_token, SECRET_KEY, algorithms=[ALGORITHM])
            return CurrentUserResponse(
                user_id=payload.get("user_id"),
                email=payload.get("sub"),
                full_name=payload.get("full_name"),
            )

        except Exception:
            return None

    @staticmethod
    def create_access_token(
        data: dict, expires_delta: Union[timedelta, None] = None
    ) -> str:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=15)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return self.pwd_context.verify(plain_password, hashed_password)

    def get_password_hash(self, password: str) -> str:
        return self.pwd_context.hash(password)

    async def authenticate_user(self, email: str, password: str) -> User:
        user = await self.get_user_by_email(email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if not self.verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user

    async def update_profile(self, user_update: UserUpdate) -> User:
        user = await self.db.get(User, self.current_user.user_id)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        # Update user fields if provided
        if user_update.full_name:
            user.full_name = user_update.full_name
        if user_update.email:
            user.email = user_update.email

        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)

        return user

    def generate_reset_token(self, user_id: str) -> str:
        """Generate a signed JWT token for password reset"""
        expires_at = datetime.utcnow() + timedelta(hours=RESET_TOKEN_EXPIRE_HOURS)

        reset_data = {
            "user_id": user_id,
            "purpose": "password_reset",
            "exp": expires_at,
            "iat": datetime.utcnow(),
        }

        return jwt.encode(reset_data, SECRET_KEY, algorithm=ALGORITHM)

    def verify_reset_token(self, token: str) -> Optional[str]:
        """Verify reset token and return user_id if valid"""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

            # Check if token is for password reset
            if payload.get("purpose") != "password_reset":
                return None

            # JWT automatically checks expiration
            return payload.get("user_id")

        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None

    async def forgot_password(self, email: str) -> bool:
        """Generate reset token and send password reset email"""
        user = await self.get_user_by_email(email)
        if not user:
            # Don't reveal if user exists for security
            return True

        # Generate signed JWT token
        reset_token = self.generate_reset_token(str(user.id))
        # You can print the token to the console for debugging
        # Use /reset-password?token= for testing
        # print('reset_token', reset_token)

        # Send reset email
        try:
            await send_password_reset_email(user.email, user.full_name, reset_token)
        except Exception as e:
            # Log error but don't expose to user
            print(f"Failed to send password reset email: {e}")
            # Still return True to not reveal user existence

        return True

    async def reset_password(self, token: str, new_password: str) -> bool:
        """Reset password using token"""
        # Verify and decode the token
        user_id = self.verify_reset_token(token)
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token",
            )

        # Get the user
        user = await self.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid reset token"
            )

        # Hash new password and update user
        hashed_password = self.get_password_hash(new_password)
        user.password_hash = hashed_password
        user.last_login = datetime.utcnow()

        self.db.add(user)
        await self.db.commit()

        return True


def get_current_user(request: Request) -> Optional[CurrentUserResponse]:
    res = UserService.get_user_from_cookie(request.cookies.get(JWT_COOKIE_NAME))
    if res is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not logged in",
        )

    return res


def get_current_user_optional(
    request: Request,
) -> Optional[CurrentUserResponse]:
    return UserService.get_user_from_cookie(request.cookies.get(JWT_COOKIE_NAME))


def get_user_service(
    db_session: AsyncSession = Depends(get_async_db_session),
    current_user: Optional[CurrentUserResponse] = Depends(get_current_user_optional),
    request: Request = None,
):
    return UserService(db_session, current_user, request)
