"""
Tests for items endpoints with authentication.
"""
import uuid

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.models import Item, User


class TestReadItems:
    """Test read items endpoint."""

    def test_read_items_normal_user(
        self, client: TestClient, normal_user_token_headers: dict, session: Session, normal_user: User
    ):
        """Test reading items as normal user (only sees own items)."""
        # Create items for normal user
        item1 = Item(title="User Item 1", description="Test", owner_id=normal_user.id)
        item2 = Item(title="User Item 2", description="Test", owner_id=normal_user.id)
        session.add(item1)
        session.add(item2)
        session.commit()

        response = client.get(
            "/api/v1/items/",
            headers=normal_user_token_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 2
        assert len(data["data"]) == 2

    def test_read_items_superuser_sees_all(
        self,
        client: TestClient,
        superuser_token_headers: dict,
        session: Session,
        normal_user: User,
        superuser: User,
    ):
        """Test that superuser sees all items."""
        # Create items for different users
        item1 = Item(title="User Item", description="Test", owner_id=normal_user.id)
        item2 = Item(title="Admin Item", description="Test", owner_id=superuser.id)
        session.add(item1)
        session.add(item2)
        session.commit()

        response = client.get(
            "/api/v1/items/",
            headers=superuser_token_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["count"] >= 2  # At least the two created items

    def test_read_items_no_auth(self, client: TestClient):
        """Test that unauthenticated users cannot read items."""
        response = client.get("/api/v1/items/")

        assert response.status_code == 401

    def test_read_items_pagination(
        self, client: TestClient, normal_user_token_headers: dict, session: Session, normal_user: User
    ):
        """Test items pagination."""
        # Create multiple items
        for i in range(5):
            item = Item(title=f"Item {i}", description="Test", owner_id=normal_user.id)
            session.add(item)
        session.commit()

        response = client.get(
            "/api/v1/items/?skip=0&limit=3",
            headers=normal_user_token_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 5
        assert len(data["data"]) == 3


class TestReadItem:
    """Test read item by ID endpoint."""

    def test_read_item_own(
        self, client: TestClient, normal_user_token_headers: dict, session: Session, normal_user: User
    ):
        """Test reading own item."""
        item = Item(title="Test Item", description="Test", owner_id=normal_user.id)
        session.add(item)
        session.commit()
        session.refresh(item)

        response = client.get(
            f"/api/v1/items/{item.id}",
            headers=normal_user_token_headers,
        )

        assert response.status_code == 200
        item_data = response.json()
        assert item_data["title"] == "Test Item"
        assert item_data["id"] == str(item.id)

    def test_read_item_other_user(
        self, client: TestClient, normal_user_token_headers: dict, session: Session, superuser: User
    ):
        """Test that normal user cannot read other user's item."""
        item = Item(title="Admin Item", description="Test", owner_id=superuser.id)
        session.add(item)
        session.commit()
        session.refresh(item)

        response = client.get(
            f"/api/v1/items/{item.id}",
            headers=normal_user_token_headers,
        )

        assert response.status_code == 403

    def test_read_item_superuser_any(
        self, client: TestClient, superuser_token_headers: dict, session: Session, normal_user: User
    ):
        """Test that superuser can read any item."""
        item = Item(title="User Item", description="Test", owner_id=normal_user.id)
        session.add(item)
        session.commit()
        session.refresh(item)

        response = client.get(
            f"/api/v1/items/{item.id}",
            headers=superuser_token_headers,
        )

        assert response.status_code == 200
        item_data = response.json()
        assert item_data["title"] == "User Item"

    def test_read_item_not_found(
        self, client: TestClient, normal_user_token_headers: dict
    ):
        """Test reading non-existent item."""
        fake_id = uuid.uuid4()
        response = client.get(
            f"/api/v1/items/{fake_id}",
            headers=normal_user_token_headers,
        )

        assert response.status_code == 404


class TestCreateItem:
    """Test create item endpoint."""

    def test_create_item(
        self, client: TestClient, normal_user_token_headers: dict, normal_user: User
    ):
        """Test creating item."""
        item_data = {
            "title": "New Item",
            "description": "A new test item",
        }
        response = client.post(
            "/api/v1/items/",
            headers=normal_user_token_headers,
            json=item_data,
        )

        assert response.status_code == 200
        created_item = response.json()
        assert created_item["title"] == "New Item"
        assert created_item["description"] == "A new test item"
        assert created_item["owner_id"] == str(normal_user.id)

    def test_create_item_no_auth(self, client: TestClient):
        """Test that unauthenticated users cannot create items."""
        item_data = {
            "title": "New Item",
            "description": "Test",
        }
        response = client.post("/api/v1/items/", json=item_data)

        assert response.status_code == 401

    def test_create_item_minimal(
        self, client: TestClient, normal_user_token_headers: dict
    ):
        """Test creating item with minimal data."""
        item_data = {
            "title": "Minimal Item",
        }
        response = client.post(
            "/api/v1/items/",
            headers=normal_user_token_headers,
            json=item_data,
        )

        assert response.status_code == 200
        created_item = response.json()
        assert created_item["title"] == "Minimal Item"
        assert created_item["description"] is None


class TestUpdateItem:
    """Test update item endpoint."""

    def test_update_item_own(
        self, client: TestClient, normal_user_token_headers: dict, session: Session, normal_user: User
    ):
        """Test updating own item."""
        item = Item(title="Old Title", description="Old", owner_id=normal_user.id)
        session.add(item)
        session.commit()
        session.refresh(item)

        update_data = {
            "title": "New Title",
            "description": "Updated description",
        }
        response = client.put(
            f"/api/v1/items/{item.id}",
            headers=normal_user_token_headers,
            json=update_data,
        )

        assert response.status_code == 200
        updated_item = response.json()
        assert updated_item["title"] == "New Title"
        assert updated_item["description"] == "Updated description"

    def test_update_item_other_user(
        self, client: TestClient, normal_user_token_headers: dict, session: Session, superuser: User
    ):
        """Test that normal user cannot update other user's item."""
        item = Item(title="Admin Item", description="Test", owner_id=superuser.id)
        session.add(item)
        session.commit()
        session.refresh(item)

        update_data = {"title": "Hacked"}
        response = client.put(
            f"/api/v1/items/{item.id}",
            headers=normal_user_token_headers,
            json=update_data,
        )

        assert response.status_code == 403

    def test_update_item_superuser_any(
        self, client: TestClient, superuser_token_headers: dict, session: Session, normal_user: User
    ):
        """Test that superuser can update any item."""
        item = Item(title="User Item", description="Test", owner_id=normal_user.id)
        session.add(item)
        session.commit()
        session.refresh(item)

        update_data = {"title": "Admin Updated"}
        response = client.put(
            f"/api/v1/items/{item.id}",
            headers=superuser_token_headers,
            json=update_data,
        )

        assert response.status_code == 200
        updated_item = response.json()
        assert updated_item["title"] == "Admin Updated"

    def test_update_item_not_found(
        self, client: TestClient, normal_user_token_headers: dict
    ):
        """Test updating non-existent item."""
        fake_id = uuid.uuid4()
        update_data = {"title": "Updated"}
        response = client.put(
            f"/api/v1/items/{fake_id}",
            headers=normal_user_token_headers,
            json=update_data,
        )

        assert response.status_code == 404


class TestDeleteItem:
    """Test delete item endpoint."""

    def test_delete_item_own(
        self, client: TestClient, normal_user_token_headers: dict, session: Session, normal_user: User
    ):
        """Test deleting own item."""
        item = Item(title="To Delete", description="Test", owner_id=normal_user.id)
        session.add(item)
        session.commit()
        session.refresh(item)

        response = client.delete(
            f"/api/v1/items/{item.id}",
            headers=normal_user_token_headers,
        )

        assert response.status_code == 200
        assert "deleted successfully" in response.json()["message"]

    def test_delete_item_other_user(
        self, client: TestClient, normal_user_token_headers: dict, session: Session, superuser: User
    ):
        """Test that normal user cannot delete other user's item."""
        item = Item(title="Admin Item", description="Test", owner_id=superuser.id)
        session.add(item)
        session.commit()
        session.refresh(item)

        response = client.delete(
            f"/api/v1/items/{item.id}",
            headers=normal_user_token_headers,
        )

        assert response.status_code == 403

    def test_delete_item_superuser_any(
        self, client: TestClient, superuser_token_headers: dict, session: Session, normal_user: User
    ):
        """Test that superuser can delete any item."""
        item = Item(title="User Item", description="Test", owner_id=normal_user.id)
        session.add(item)
        session.commit()
        session.refresh(item)

        response = client.delete(
            f"/api/v1/items/{item.id}",
            headers=superuser_token_headers,
        )

        assert response.status_code == 200

    def test_delete_item_not_found(
        self, client: TestClient, normal_user_token_headers: dict
    ):
        """Test deleting non-existent item."""
        fake_id = uuid.uuid4()
        response = client.delete(
            f"/api/v1/items/{fake_id}",
            headers=normal_user_token_headers,
        )

        assert response.status_code == 404
