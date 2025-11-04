from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, field_validator


class CurrentUserResponse(BaseModel):
    email: EmailStr
    full_name: str
    user_id: UUID

    @field_validator('user_id', mode='before')
    @classmethod
    def convert_user_id_to_uuid(cls, v):
        """Convert string user_id to UUID if needed."""
        if isinstance(v, str):
            return UUID(v)
        return v


class LoginForm(BaseModel):
    email: EmailStr
    password: str


class SignupForm(BaseModel):
    email: Optional[EmailStr] = None
    password: str
    full_name: str


class LoginResponse(BaseModel):
    access_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    password: str


class ForgotPasswordResponse(BaseModel):
    message: str
