from typing import Union

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse, RedirectResponse
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.config import JWT_COOKIE_NAME, REDIRECT_AFTER_LOGIN
from app.schemas.auth import (CurrentUserResponse, ForgotPasswordRequest,
                              ForgotPasswordResponse, LoginForm, LoginResponse,
                              ResetPasswordRequest, SignupForm)
from app.schemas.user import UserUpdate
from app.services.oauth_service import OAuthService, get_oauth_service
from app.services.users_service import UserService, get_user_service

auth_router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@auth_router.get("/current", response_model=CurrentUserResponse)
async def current_user(
    request: Request,
    user_service: UserService = Depends(get_user_service),
) -> Union[CurrentUserResponse, JSONResponse]:
    res = user_service.get_user_from_cookie(request.cookies.get(JWT_COOKIE_NAME))
    if res is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not logged in",
        )
    return res


@auth_router.post("/login", response_model=LoginResponse)
@limiter.limit("5/minute")
async def login(
    request: Request,
    form_data: LoginForm,
    user_service: UserService = Depends(get_user_service)
) -> JSONResponse:
    res = await user_service.login(form_data.email, form_data.password)
    response = JSONResponse(
        LoginResponse(access_token=res["access_token"]).model_dump()
    )
    response.set_cookie(key=JWT_COOKIE_NAME, value=res["access_token"], httponly=True)
    return response


@auth_router.get("/logout")
async def logout() -> JSONResponse:
    response = JSONResponse({"success": True})
    response.delete_cookie(JWT_COOKIE_NAME)
    return response


@auth_router.post("/signup", response_model=LoginResponse)
@limiter.limit("3/minute")
async def signup(
    request: Request,
    form_data: SignupForm,
    user_service: UserService = Depends(get_user_service),
) -> JSONResponse:
    res = await user_service.create_user(form_data)
    if not res:
        raise Exception("failed creating user and student")

    res = await user_service.login(form_data.email, form_data.password)
    response = JSONResponse(
        LoginResponse(access_token=res["access_token"]).model_dump()
    )
    response.set_cookie(key=JWT_COOKIE_NAME, value=res["access_token"], httponly=True)
    return response


@auth_router.get("/google_callback", response_model=LoginResponse)
async def google_callback(
    user_service: UserService = Depends(get_user_service),
) -> JSONResponse:
    res = await user_service.login_oauth("GOOGLE_OAUTH2")
    response = RedirectResponse(url=REDIRECT_AFTER_LOGIN)
    response.set_cookie(key=JWT_COOKIE_NAME, value=res["access_token"], httponly=True)
    return response


@auth_router.get("/google/authorize")
async def google_authorize(
    oauth_service: OAuthService = Depends(get_oauth_service),
) -> RedirectResponse:
    authorization_url = oauth_service.google_login()
    return RedirectResponse(authorization_url)


@auth_router.put("/profile", response_model=UserUpdate, status_code=status.HTTP_200_OK)
async def update_user_profile(
    user_update: UserUpdate,
    user_service: UserService = Depends(get_user_service),
):
    user = await user_service.update_profile(user_update)
    res = user_service.create_access_token_from_user(user)
    response = JSONResponse(
        LoginResponse(access_token=res["access_token"]).model_dump()
    )
    response.set_cookie(key=JWT_COOKIE_NAME, value=res["access_token"], httponly=True)
    return response


@auth_router.post("/forgot-password", response_model=ForgotPasswordResponse)
@limiter.limit("3/minute")
async def forgot_password(
    request: Request,
    request_data: ForgotPasswordRequest,
    user_service: UserService = Depends(get_user_service),
) -> ForgotPasswordResponse:
    """Request password reset email"""
    await user_service.forgot_password(request_data.email)
    return ForgotPasswordResponse(
        message="If the email exists in our system, you will receive password reset instructions."
    )


@auth_router.post("/reset-password", response_model=ForgotPasswordResponse)
@limiter.limit("5/minute")
async def reset_password(
    request: Request,
    request_data: ResetPasswordRequest,
    user_service: UserService = Depends(get_user_service),
) -> ForgotPasswordResponse:
    """Reset password using token"""
    await user_service.reset_password(request_data.token, request_data.password)
    return ForgotPasswordResponse(
        message="Password has been reset successfully. You can now sign in with your new password."
    )
