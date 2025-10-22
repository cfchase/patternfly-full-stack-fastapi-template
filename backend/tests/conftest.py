"""
Pytest configuration and fixtures for testing.
"""
import uuid
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine, delete
from sqlmodel.pool import StaticPool

from app.core.config import settings
from app.core.db import init_db
from app.core.security import get_password_hash
from app.main import app
from app.models import Item, User


# Test database engine with in-memory SQLite
@pytest.fixture(name="engine")
def engine_fixture():
    """Create test database engine."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    init_db(engine)
    return engine


@pytest.fixture(name="session")
def session_fixture(engine) -> Generator[Session, None, None]:
    """Create test database session."""
    with Session(engine) as session:
        yield session
        # Cleanup after each test
        session.exec(delete(Item))
        session.exec(delete(User))
        session.commit()


@pytest.fixture(name="client")
def client_fixture(session: Session) -> Generator[TestClient, None, None]:
    """Create test client."""
    def get_session_override():
        return session

    from app.api.deps import get_db
    app.dependency_overrides[get_db] = get_session_override

    with TestClient(app) as client:
        yield client

    app.dependency_overrides.clear()


@pytest.fixture(name="superuser")
def superuser_fixture(session: Session) -> User:
    """Create a test superuser."""
    user = User(
        email="admin@example.com",
        hashed_password=get_password_hash("testpassword123"),
        full_name="Test Admin",
        is_superuser=True,
        is_active=True,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@pytest.fixture(name="normal_user")
def normal_user_fixture(session: Session) -> User:
    """Create a test normal user."""
    user = User(
        email="user@example.com",
        hashed_password=get_password_hash("testpassword123"),
        full_name="Test User",
        is_superuser=False,
        is_active=True,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@pytest.fixture(name="superuser_token_headers")
def superuser_token_headers_fixture(client: TestClient, superuser: User) -> dict[str, str]:
    """Get authentication headers for superuser."""
    from app.core.security import create_access_token

    access_token = create_access_token(str(superuser.id))
    return {"Authorization": f"Bearer {access_token}"}


@pytest.fixture(name="normal_user_token_headers")
def normal_user_token_headers_fixture(client: TestClient, normal_user: User) -> dict[str, str]:
    """Get authentication headers for normal user."""
    from app.core.security import create_access_token

    access_token = create_access_token(str(normal_user.id))
    return {"Authorization": f"Bearer {access_token}"}
