from datetime import timedelta
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import select

from app.api.deps import CurrentUser, SessionDep
from app.core.config import settings
from app.core.security import create_access_token, verify_password
from app.models import Message, Token, User

router = APIRouter(prefix="/login", tags=["login"])


@router.post("/access-token")
def login_access_token(
    session: SessionDep, form_data: Annotated[OAuth2PasswordRequestForm, Depends()]
) -> Token:
    """
    OAuth2 compatible token login, get an access token for future requests.

    Uses username field for email address to comply with OAuth2 specification.
    """
    user = session.exec(
        select(User).where(User.email == form_data.username)
    ).first()

    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    elif not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return Token(
        access_token=create_access_token(
            str(user.id), expires_delta=access_token_expires
        )
    )


@router.post("/test-token", response_model=User)
def test_token(current_user: CurrentUser) -> Any:
    """
    Test access token by returning the current user.

    Use this endpoint to verify that a token is valid.
    """
    return current_user
