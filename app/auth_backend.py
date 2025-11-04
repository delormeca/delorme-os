from starlette.authentication import (AuthCredentials, AuthenticationBackend,
                                      UnauthenticatedUser)

from app.config import JWT_COOKIE_NAME
from app.services.users_service import UserService


class JWTAuthenticationBackend(AuthenticationBackend):
    async def authenticate(self, request):
        jwt_token = request.cookies.get(JWT_COOKIE_NAME)
        if jwt_token is None:
            return AuthCredentials(["unauthenticated"]), UnauthenticatedUser()

        user = UserService.get_user_from_cookie(jwt_token)
        if user and user.email:
            return AuthCredentials(["authenticated"]), user
        else:
            return AuthCredentials(["unauthenticated"]), UnauthenticatedUser()
