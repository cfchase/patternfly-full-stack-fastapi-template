import uuid
from collections.abc import Generator
from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from jose.exceptions import JWTError
from pydantic import EmailStr, ValidationError
from sqlmodel import Session, select

from app.core.config import settings
from app.core.db import engine
from app.core.security import ALGORITHM
from app.models import TokenPayload, User, UserCreateFromOAuth


reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/login/access-token"
)


def get_db() -> Generator[Session, None, None]:
    """Get database session"""
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_db)]
TokenDep = Annotated[str, Depends(reusable_oauth2)]


def get_current_user(session: SessionDep, token: TokenDep) -> User:
    """
    Get current authenticated user from JWT token.

    Args:
        session: Database session
        token: JWT token from request header

    Returns:
        Current authenticated user

    Raises:
        HTTPException: If token is invalid or user not found
    """
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    # Convert string UUID to UUID object
    user_id = uuid.UUID(token_data.sub) if token_data.sub else None
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user


def get_current_user_from_headers(request: Request, session: SessionDep) -> User:
    """
    Get current authenticated user from OAuth2-proxy headers.

    This function extracts user information from headers set by oauth2-proxy
    and auto-creates the user in the database if they don't exist.

    Args:
        request: FastAPI request object containing headers
        session: Database session

    Returns:
        Current authenticated user

    Raises:
        HTTPException: If required headers are missing
    """
    email_header = settings.OAUTH2_PROXY_EMAIL_HEADER
    user_header = settings.OAUTH2_PROXY_USER_HEADER
    preferred_username_header = settings.OAUTH2_PROXY_PREFERRED_USERNAME_HEADER

    # Extract email from headers
    email = request.headers.get(email_header)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Missing {email_header} header from OAuth2-proxy",
        )

    # Get additional user info from headers
    username = request.headers.get(user_header) or email
    preferred_username = request.headers.get(preferred_username_header)
    full_name = preferred_username or username

    # Try to find existing user by email
    user = session.exec(select(User).where(User.email == email)).first()

    if not user:
        # Auto-create user from OAuth headers
        # Determine provider from email domain or header
        oauth_provider = "oauth2-proxy"  # Generic, could be enhanced

        user = User(
            email=EmailStr(email),
            full_name=full_name,
            oauth_provider=oauth_provider,
            external_id=username,
            hashed_password=None,  # OAuth users don't have passwords
            is_active=True,
            is_superuser=False,
        )
        session.add(user)
        session.commit()
        session.refresh(user)

    # Check if user is active
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    return user


def get_current_user_hybrid(
    request: Request, session: SessionDep, token: TokenDep | None = None
) -> User:
    """
    Get current user supporting both JWT and OAuth2-proxy authentication.

    Tries OAuth headers first, falls back to JWT if headers not present.

    Args:
        request: FastAPI request object
        session: Database session
        token: Optional JWT token

    Returns:
        Current authenticated user
    """
    # Try OAuth2-proxy headers first
    email_header = settings.OAUTH2_PROXY_EMAIL_HEADER
    if request.headers.get(email_header):
        return get_current_user_from_headers(request, session)

    # Fall back to JWT authentication
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No authentication credentials provided",
        )
    return get_current_user(session, token)


# Select the appropriate authentication dependency based on AUTH_MODE
if settings.AUTH_MODE == "oauth2-proxy":
    CurrentUser = Annotated[User, Depends(get_current_user_from_headers)]
elif settings.AUTH_MODE == "hybrid":
    CurrentUser = Annotated[User, Depends(get_current_user_hybrid)]
else:  # jwt mode (default)
    CurrentUser = Annotated[User, Depends(get_current_user)]


def get_current_active_superuser(current_user: CurrentUser) -> User:
    """
    Get current authenticated superuser.

    Args:
        current_user: Current authenticated user

    Returns:
        Current user if they are a superuser

    Raises:
        HTTPException: If user is not a superuser
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403, detail="The user doesn't have enough privileges"
        )
    return current_user
