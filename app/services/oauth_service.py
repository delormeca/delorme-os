import os
from urllib.parse import urlparse

from fastapi import Depends, Request
from requests_oauthlib import OAuth2Session
from sqlalchemy.ext.asyncio import AsyncSession

from app import config
from app.db import get_async_db_session


class OAuthService:
    """
    OAuthService class to handle OAuth2 login with Google
    """

    def __init__(self, db: AsyncSession, request: Request):
        self.db = db
        self.request = request
        self.client_id = config.GOOGLE_OAUTH2_CLIENT_ID
        self.client_secret = config.GOOGLE_OAUTH2_SECRET
        
        # Use configured redirect URI
        # This must match exactly what's configured in Google Cloud Console
        self.redirect_uri = self._get_redirect_uri()

        self.scope = [
            "https://www.googleapis.com/auth/userinfo.email",
            "openid",
            "https://www.googleapis.com/auth/userinfo.profile",
        ]
        self.google = OAuth2Session(
            self.client_id, redirect_uri=self.redirect_uri, scope=self.scope
        )
        self.token_url = "https://www.googleapis.com/oauth2/v4/token"
        
        # Only allow insecure transport in development
        if config.config.is_development():
            os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

    def google_login(self):
        """
        Redirect the user to the OAuth provider
        """
        authorization_base_url = "https://accounts.google.com/o/oauth2/v2/auth"
        authorization_url, _ = self.google.authorization_url(
            authorization_base_url, access_type="offline"
        )
        return authorization_url

    def google_callback(self):
        """
        Retrieve an access token + user data
        """
        parsed_url = urlparse(str(self.request.url))
        authorization_response = parsed_url._replace(
            scheme=self.scheme_to_use()
        ).geturl()
        self.google.fetch_token(
            self.token_url,
            client_secret=self.client_secret,
            authorization_response=authorization_response,
        )
        return self.google.get("https://www.googleapis.com/userinfo/v2/me").json()

    def _get_redirect_uri(self):
        """
        Get the configured redirect URI for OAuth callback.
        Must match exactly what's configured in Google Cloud Console.
        """
        # Use configured redirect URI from settings
        if hasattr(config.config, 'google_oauth2_redirect_uri') and config.config.google_oauth2_redirect_uri:
            return config.config.google_oauth2_redirect_uri
        
        # Fallback: construct from domain (for backward compatibility)
        domain = config.config.domain
        if domain.startswith('http'):
            return f"{domain}/api/auth/google_callback"
        else:
            # Default to HTTPS for production
            scheme = "https" if not config.config.is_development() else "http"
            return f"{scheme}://{domain}/api/auth/google_callback"

    def scheme_to_use(self):
        if self.request.headers.get("X-Forwarded-Proto", "http") == "https":
            return "https"
        else:
            return "http"


def get_oauth_service(
    db_session: AsyncSession = Depends(get_async_db_session),
    request: Request = None,
):
    return OAuthService(db_session, request)
