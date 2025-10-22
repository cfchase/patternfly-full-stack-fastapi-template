"""
Tests for users endpoints.
"""
import uuid

from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.core.security import verify_password
from app.models import User


class TestReadUsers:
    """Test read users endpoint (superuser only)."""

    def test_read_users_superuser(
        self, client: TestClient, superuser_token_headers: dict, normal_user: User
    ):
        """Test reading users as superuser."""
        response = client.get(
            "/api/v1/users/",
            headers=superuser_token_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "count" in data
        assert data["count"] >= 2  # At least superuser and normal_user

    def test_read_users_normal_user(
        self, client: TestClient, normal_user_token_headers: dict
    ):
        """Test that normal users cannot read all users."""
        response = client.get(
            "/api/v1/users/",
            headers=normal_user_token_headers,
        )

        assert response.status_code == 403

    def test_read_users_no_auth(self, client: TestClient):
        """Test that unauthenticated users cannot read users."""
        response = client.get("/api/v1/users/")

        assert response.status_code == 401


class TestCreateUser:
    """Test create user endpoint (superuser only)."""

    def test_create_user_superuser(
        self, client: TestClient, superuser_token_headers: dict
    ):
        """Test creating user as superuser."""
        user_data = {
            "email": "newuser@example.com",
            "password": "newpassword123",
            "full_name": "New User",
        }
        response = client.post(
            "/api/v1/users/",
            headers=superuser_token_headers,
            json=user_data,
        )

        assert response.status_code == 200
        created_user = response.json()
        assert created_user["email"] == "newuser@example.com"
        assert created_user["full_name"] == "New User"
        assert "hashed_password" not in created_user
        assert "id" in created_user

    def test_create_user_duplicate_email(
        self, client: TestClient, superuser_token_headers: dict, normal_user: User
    ):
        """Test creating user with duplicate email."""
        user_data = {
            "email": normal_user.email,
            "password": "newpassword123",
        }
        response = client.post(
            "/api/v1/users/",
            headers=superuser_token_headers,
            json=user_data,
        )

        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]

    def test_create_user_normal_user(
        self, client: TestClient, normal_user_token_headers: dict
    ):
        """Test that normal users cannot create users."""
        user_data = {
            "email": "newuser@example.com",
            "password": "newpassword123",
        }
        response = client.post(
            "/api/v1/users/",
            headers=normal_user_token_headers,
            json=user_data,
        )

        assert response.status_code == 403


class TestReadUserMe:
    """Test read current user endpoint."""

    def test_read_user_me(
        self, client: TestClient, normal_user_token_headers: dict
    ):
        """Test reading own user profile."""
        response = client.get(
            "/api/v1/users/me",
            headers=normal_user_token_headers,
        )

        assert response.status_code == 200
        user_data = response.json()
        assert user_data["email"] == "user@example.com"
        assert "id" in user_data
        assert "hashed_password" not in user_data

    def test_read_user_me_no_auth(self, client: TestClient):
        """Test reading own profile without authentication."""
        response = client.get("/api/v1/users/me")

        assert response.status_code == 401


class TestUpdateUserMe:
    """Test update current user endpoint."""

    def test_update_user_me(
        self, client: TestClient, normal_user_token_headers: dict, session: Session
    ):
        """Test updating own user profile."""
        update_data = {
            "full_name": "Updated Name",
        }
        response = client.patch(
            "/api/v1/users/me",
            headers=normal_user_token_headers,
            json=update_data,
        )

        assert response.status_code == 200
        updated_user = response.json()
        assert updated_user["full_name"] == "Updated Name"

    def test_update_user_me_email(
        self, client: TestClient, normal_user_token_headers: dict
    ):
        """Test updating own email."""
        update_data = {
            "email": "newemail@example.com",
        }
        response = client.patch(
            "/api/v1/users/me",
            headers=normal_user_token_headers,
            json=update_data,
        )

        assert response.status_code == 200
        updated_user = response.json()
        assert updated_user["email"] == "newemail@example.com"

    def test_update_user_me_duplicate_email(
        self,
        client: TestClient,
        normal_user_token_headers: dict,
        superuser: User,
    ):
        """Test updating email to one that already exists."""
        update_data = {
            "email": superuser.email,
        }
        response = client.patch(
            "/api/v1/users/me",
            headers=normal_user_token_headers,
            json=update_data,
        )

        assert response.status_code == 409
        assert "already exists" in response.json()["detail"]


class TestUpdatePasswordMe:
    """Test update password endpoint."""

    def test_update_password_me(
        self, client: TestClient, normal_user_token_headers: dict, session: Session, normal_user: User
    ):
        """Test updating own password."""
        password_data = {
            "current_password": "testpassword123",
            "new_password": "newpassword456",
        }
        response = client.patch(
            "/api/v1/users/me/password",
            headers=normal_user_token_headers,
            json=password_data,
        )

        assert response.status_code == 200
        assert "updated successfully" in response.json()["message"]

        # Verify password was actually changed
        session.refresh(normal_user)
        assert verify_password("newpassword456", normal_user.hashed_password)

    def test_update_password_me_incorrect_current(
        self, client: TestClient, normal_user_token_headers: dict
    ):
        """Test updating password with incorrect current password."""
        password_data = {
            "current_password": "wrongpassword",
            "new_password": "newpassword456",
        }
        response = client.patch(
            "/api/v1/users/me/password",
            headers=normal_user_token_headers,
            json=password_data,
        )

        assert response.status_code == 400
        assert "Incorrect password" in response.json()["detail"]

    def test_update_password_me_same_password(
        self, client: TestClient, normal_user_token_headers: dict
    ):
        """Test updating password to same password."""
        password_data = {
            "current_password": "testpassword123",
            "new_password": "testpassword123",
        }
        response = client.patch(
            "/api/v1/users/me/password",
            headers=normal_user_token_headers,
            json=password_data,
        )

        assert response.status_code == 400
        assert "cannot be the same" in response.json()["detail"]


class TestDeleteUserMe:
    """Test delete current user endpoint."""

    def test_delete_user_me(
        self, client: TestClient, normal_user_token_headers: dict, session: Session
    ):
        """Test deleting own user account."""
        response = client.delete(
            "/api/v1/users/me",
            headers=normal_user_token_headers,
        )

        assert response.status_code == 200
        assert "deleted successfully" in response.json()["message"]

    def test_delete_user_me_superuser(
        self, client: TestClient, superuser_token_headers: dict
    ):
        """Test that superusers cannot delete themselves."""
        response = client.delete(
            "/api/v1/users/me",
            headers=superuser_token_headers,
        )

        assert response.status_code == 403
        assert "not allowed to delete themselves" in response.json()["detail"]


class TestRegisterUser:
    """Test public user registration endpoint."""

    def test_register_user(self, client: TestClient, session: Session):
        """Test public user registration."""
        user_data = {
            "email": "registered@example.com",
            "password": "registeredpass123",
            "full_name": "Registered User",
        }
        response = client.post("/api/v1/users/signup", json=user_data)

        assert response.status_code == 200
        created_user = response.json()
        assert created_user["email"] == "registered@example.com"
        assert created_user["full_name"] == "Registered User"
        assert created_user["is_superuser"] is False

    def test_register_user_duplicate_email(
        self, client: TestClient, normal_user: User
    ):
        """Test registering with duplicate email."""
        user_data = {
            "email": normal_user.email,
            "password": "somepassword123",
        }
        response = client.post("/api/v1/users/signup", json=user_data)

        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]


class TestReadUserById:
    """Test read user by ID endpoint (superuser only)."""

    def test_read_user_by_id(
        self, client: TestClient, superuser_token_headers: dict, normal_user: User
    ):
        """Test reading user by ID as superuser."""
        response = client.get(
            f"/api/v1/users/{normal_user.id}",
            headers=superuser_token_headers,
        )

        assert response.status_code == 200
        user_data = response.json()
        assert user_data["email"] == normal_user.email
        assert user_data["id"] == str(normal_user.id)

    def test_read_user_by_id_not_found(
        self, client: TestClient, superuser_token_headers: dict
    ):
        """Test reading non-existent user."""
        fake_id = uuid.uuid4()
        response = client.get(
            f"/api/v1/users/{fake_id}",
            headers=superuser_token_headers,
        )

        assert response.status_code == 404

    def test_read_user_by_id_normal_user(
        self, client: TestClient, normal_user_token_headers: dict, superuser: User
    ):
        """Test that normal users cannot read other users."""
        response = client.get(
            f"/api/v1/users/{superuser.id}",
            headers=normal_user_token_headers,
        )

        assert response.status_code == 403


class TestUpdateUser:
    """Test update user by ID endpoint (superuser only)."""

    def test_update_user(
        self, client: TestClient, superuser_token_headers: dict, normal_user: User
    ):
        """Test updating user as superuser."""
        update_data = {
            "full_name": "Admin Updated Name",
        }
        response = client.patch(
            f"/api/v1/users/{normal_user.id}",
            headers=superuser_token_headers,
            json=update_data,
        )

        assert response.status_code == 200
        updated_user = response.json()
        assert updated_user["full_name"] == "Admin Updated Name"

    def test_update_user_not_found(
        self, client: TestClient, superuser_token_headers: dict
    ):
        """Test updating non-existent user."""
        fake_id = uuid.uuid4()
        update_data = {"full_name": "Updated"}
        response = client.patch(
            f"/api/v1/users/{fake_id}",
            headers=superuser_token_headers,
            json=update_data,
        )

        assert response.status_code == 404

    def test_update_user_normal_user(
        self, client: TestClient, normal_user_token_headers: dict, superuser: User
    ):
        """Test that normal users cannot update other users."""
        update_data = {"full_name": "Hacked"}
        response = client.patch(
            f"/api/v1/users/{superuser.id}",
            headers=normal_user_token_headers,
            json=update_data,
        )

        assert response.status_code == 403


class TestDeleteUser:
    """Test delete user by ID endpoint (superuser only)."""

    def test_delete_user(
        self, client: TestClient, superuser_token_headers: dict, session: Session
    ):
        """Test deleting user as superuser."""
        # Create a user to delete
        from app.core.security import get_password_hash
        test_user = User(
            email="todelete@example.com",
            hashed_password=get_password_hash("password123"),
        )
        session.add(test_user)
        session.commit()
        session.refresh(test_user)

        response = client.delete(
            f"/api/v1/users/{test_user.id}",
            headers=superuser_token_headers,
        )

        assert response.status_code == 200
        assert "deleted successfully" in response.json()["message"]

    def test_delete_user_self(
        self, client: TestClient, superuser_token_headers: dict, superuser: User
    ):
        """Test that superuser cannot delete themselves."""
        response = client.delete(
            f"/api/v1/users/{superuser.id}",
            headers=superuser_token_headers,
        )

        assert response.status_code == 403
        assert "not allowed to delete themselves" in response.json()["detail"]

    def test_delete_user_not_found(
        self, client: TestClient, superuser_token_headers: dict
    ):
        """Test deleting non-existent user."""
        fake_id = uuid.uuid4()
        response = client.delete(
            f"/api/v1/users/{fake_id}",
            headers=superuser_token_headers,
        )

        assert response.status_code == 404

    def test_delete_user_normal_user(
        self, client: TestClient, normal_user_token_headers: dict, superuser: User
    ):
        """Test that normal users cannot delete other users."""
        response = client.delete(
            f"/api/v1/users/{superuser.id}",
            headers=normal_user_token_headers,
        )

        assert response.status_code == 403
