"""
Tests for authentication dependencies.
"""
import uuid

import pytest
from fastapi import HTTPException
from sqlmodel import Session

from app.api.deps import get_current_active_superuser, get_current_user
from app.core.security import create_access_token
from app.models import User


class TestGetCurrentUser:
    """Test get_current_user dependency."""

    def test_get_current_user_valid_token(
        self, session: Session, normal_user: User
    ):
        """Test getting current user with valid token."""
        token = create_access_token(str(normal_user.id))

        # Get current user
        user = get_current_user(session, token)

        assert user.id == normal_user.id
        assert user.email == normal_user.email
        assert user.is_active is True

    def test_get_current_user_superuser(
        self, session: Session, superuser: User
    ):
        """Test getting current user when user is superuser."""
        token = create_access_token(str(superuser.id))

        user = get_current_user(session, token)

        assert user.id == superuser.id
        assert user.is_superuser is True

    def test_get_current_user_invalid_token(self, session: Session):
        """Test getting current user with invalid token."""
        invalid_token = "invalid.token.string"

        with pytest.raises(HTTPException) as exc_info:
            get_current_user(session, invalid_token)

        assert exc_info.value.status_code == 403
        assert "Could not validate credentials" in exc_info.value.detail

    def test_get_current_user_nonexistent_user(self, session: Session):
        """Test getting current user when user doesn't exist in database."""
        # Create token for non-existent user
        fake_user_id = str(uuid.uuid4())
        token = create_access_token(fake_user_id)

        with pytest.raises(HTTPException) as exc_info:
            get_current_user(session, token)

        assert exc_info.value.status_code == 404
        assert "User not found" in exc_info.value.detail

    def test_get_current_user_inactive_user(self, session: Session):
        """Test getting current user when user is inactive."""
        # Create inactive user
        inactive_user = User(
            email="inactive@example.com",
            hashed_password="hashed",
            is_active=False,
        )
        session.add(inactive_user)
        session.commit()
        session.refresh(inactive_user)

        token = create_access_token(str(inactive_user.id))

        with pytest.raises(HTTPException) as exc_info:
            get_current_user(session, token)

        assert exc_info.value.status_code == 400
        assert "Inactive user" in exc_info.value.detail

    def test_get_current_user_expired_token(self, session: Session, normal_user: User):
        """Test getting current user with expired token."""
        from datetime import timedelta

        # Create token that expires immediately
        token = create_access_token(
            str(normal_user.id),
            expires_delta=timedelta(seconds=-1)
        )

        with pytest.raises(HTTPException) as exc_info:
            get_current_user(session, token)

        assert exc_info.value.status_code == 403
        assert "Could not validate credentials" in exc_info.value.detail


class TestGetCurrentActiveSuperuser:
    """Test get_current_active_superuser dependency."""

    def test_get_superuser_with_superuser(self, superuser: User):
        """Test getting superuser with superuser account."""
        # Should return the superuser without raising exception
        result = get_current_active_superuser(superuser)
        assert result.id == superuser.id
        assert result.is_superuser is True

    def test_get_superuser_with_normal_user(self, normal_user: User):
        """Test getting superuser with normal user account."""
        with pytest.raises(HTTPException) as exc_info:
            get_current_active_superuser(normal_user)

        assert exc_info.value.status_code == 403
        assert "doesn't have enough privileges" in exc_info.value.detail

    def test_get_superuser_privileges_check(self, session: Session):
        """Test that superuser check specifically validates is_superuser flag."""
        # Create user with is_superuser=False explicitly
        non_super_user = User(
            email="notsuper@example.com",
            hashed_password="hashed",
            is_active=True,
            is_superuser=False,
        )
        session.add(non_super_user)
        session.commit()

        with pytest.raises(HTTPException) as exc_info:
            get_current_active_superuser(non_super_user)

        assert exc_info.value.status_code == 403
