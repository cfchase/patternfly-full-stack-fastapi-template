"""
Tests for login endpoints.
"""
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.security import create_access_token
from app.models import User


class TestLoginAccessToken:
    """Test login access token endpoint."""

    def test_login_access_token(self, client: TestClient, normal_user: User):
        """Test successful login with valid credentials."""
        login_data = {
            "username": normal_user.email,  # OAuth2 uses 'username' field
            "password": "testpassword123",
        }
        response = client.post("/api/v1/login/access-token", data=login_data)

        assert response.status_code == 200
        token_data = response.json()
        assert "access_token" in token_data
        assert token_data["token_type"] == "bearer"
        assert isinstance(token_data["access_token"], str)
        assert len(token_data["access_token"]) > 0

    def test_login_access_token_incorrect_password(
        self, client: TestClient, normal_user: User
    ):
        """Test login with incorrect password."""
        login_data = {
            "username": normal_user.email,
            "password": "wrongpassword",
        }
        response = client.post("/api/v1/login/access-token", data=login_data)

        assert response.status_code == 400
        assert "Incorrect email or password" in response.json()["detail"]

    def test_login_access_token_nonexistent_user(self, client: TestClient):
        """Test login with non-existent email."""
        login_data = {
            "username": "nonexistent@example.com",
            "password": "somepassword",
        }
        response = client.post("/api/v1/login/access-token", data=login_data)

        assert response.status_code == 400
        assert "Incorrect email or password" in response.json()["detail"]

    def test_login_access_token_inactive_user(
        self, client: TestClient, session: Session
    ):
        """Test login with inactive user account."""
        from app.core.security import get_password_hash

        # Create inactive user
        inactive_user = User(
            email="inactive@example.com",
            hashed_password=get_password_hash("testpassword123"),
            is_active=False,
        )
        session.add(inactive_user)
        session.commit()

        login_data = {
            "username": "inactive@example.com",
            "password": "testpassword123",
        }
        response = client.post("/api/v1/login/access-token", data=login_data)

        assert response.status_code == 400
        assert "Inactive user" in response.json()["detail"]

    def test_login_access_token_missing_credentials(self, client: TestClient):
        """Test login with missing credentials."""
        response = client.post("/api/v1/login/access-token", data={})

        assert response.status_code == 422  # Validation error

    def test_login_access_token_empty_password(
        self, client: TestClient, normal_user: User
    ):
        """Test login with empty password."""
        login_data = {
            "username": normal_user.email,
            "password": "",
        }
        response = client.post("/api/v1/login/access-token", data=login_data)

        assert response.status_code == 400


class TestTestToken:
    """Test token validation endpoint."""

    def test_test_token_valid(
        self, client: TestClient, normal_user_token_headers: dict
    ):
        """Test token validation with valid token."""
        response = client.post(
            "/api/v1/login/test-token",
            headers=normal_user_token_headers,
        )

        assert response.status_code == 200
        user_data = response.json()
        assert user_data["email"] == "user@example.com"
        assert "id" in user_data

    def test_test_token_invalid(self, client: TestClient):
        """Test token validation with invalid token."""
        response = client.post(
            "/api/v1/login/test-token",
            headers={"Authorization": "Bearer invalid_token"},
        )

        assert response.status_code == 403

    def test_test_token_missing(self, client: TestClient):
        """Test token validation without token."""
        response = client.post("/api/v1/login/test-token")

        assert response.status_code == 401  # Unauthorized

    def test_test_token_expired(
        self, client: TestClient, session: Session, normal_user: User
    ):
        """Test token validation with expired token."""
        from datetime import timedelta

        # Create expired token
        expired_token = create_access_token(
            str(normal_user.id),
            expires_delta=timedelta(seconds=-1)
        )

        response = client.post(
            "/api/v1/login/test-token",
            headers={"Authorization": f"Bearer {expired_token}"},
        )

        assert response.status_code == 403

    def test_test_token_superuser(
        self, client: TestClient, superuser_token_headers: dict
    ):
        """Test token validation for superuser."""
        response = client.post(
            "/api/v1/login/test-token",
            headers=superuser_token_headers,
        )

        assert response.status_code == 200
        user_data = response.json()
        assert user_data["is_superuser"] is True
