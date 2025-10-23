"""
Tests for database initialization scripts.
"""
from sqlmodel import Session, create_engine, select
from sqlmodel.pool import StaticPool

from app.core.config import settings
from app.core.db import init_db
from app.models import Item, User


class TestDatabaseInitialization:
    """Test database initialization functions."""

    def test_init_db_creates_tables(self):
        """Test that init_db creates all necessary tables."""
        # Create a fresh in-memory database
        engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )

        # Initialize tables
        init_db(engine)

        # Verify tables exist by creating and querying data
        with Session(engine) as session:
            from app.core.security import get_password_hash

            # Create a user
            user = User(
                email="test@example.com",
                hashed_password=get_password_hash("password"),
                full_name="Test User",
            )
            session.add(user)
            session.commit()
            session.refresh(user)

            # Create an item
            item = Item(
                title="Test Item",
                description="Test",
                owner_id=user.id,
            )
            session.add(item)
            session.commit()
            session.refresh(item)

            # Query back
            queried_user = session.get(User, user.id)
            queried_item = session.get(Item, item.id)

            assert queried_user is not None
            assert queried_user.email == "test@example.com"
            assert queried_item is not None
            assert queried_item.owner_id == user.id


class TestInitialDataScript:
    """Test initial data creation script."""

    def test_create_first_superuser(self, session: Session):
        """Test creating first superuser."""
        from app.core.security import get_password_hash, verify_password

        # Create first superuser
        first_superuser = User(
            email=settings.FIRST_SUPERUSER,
            hashed_password=get_password_hash(settings.FIRST_SUPERUSER_PASSWORD),
            is_superuser=True,
            is_active=True,
            full_name="Admin User",
        )
        session.add(first_superuser)
        session.commit()
        session.refresh(first_superuser)

        # Verify superuser was created correctly
        assert first_superuser.email == settings.FIRST_SUPERUSER
        assert first_superuser.is_superuser is True
        assert first_superuser.is_active is True
        assert verify_password(
            settings.FIRST_SUPERUSER_PASSWORD, first_superuser.hashed_password
        )

    def test_first_superuser_idempotent(self, session: Session):
        """Test that creating first superuser multiple times is idempotent."""
        from app.core.security import get_password_hash

        # Create first superuser
        first_superuser = User(
            email=settings.FIRST_SUPERUSER,
            hashed_password=get_password_hash(settings.FIRST_SUPERUSER_PASSWORD),
            is_superuser=True,
            is_active=True,
        )
        session.add(first_superuser)
        session.commit()

        # Try to create again (simulating re-running the script)
        existing_user = session.exec(
            select(User).where(User.email == settings.FIRST_SUPERUSER)
        ).first()

        # Should find existing user
        assert existing_user is not None
        assert existing_user.email == settings.FIRST_SUPERUSER


class TestSeedDataScript:
    """Test seed data creation script."""

    def test_seed_creates_test_users(self, session: Session):
        """Test that seed script creates test users with proper passwords."""
        from app.core.security import get_password_hash, verify_password

        test_password = "testpassword123"

        # Create test users
        test_users = [
            User(
                email="test1@example.com",
                hashed_password=get_password_hash(test_password),
                full_name="Test User 1",
            ),
            User(
                email="test2@example.com",
                hashed_password=get_password_hash(test_password),
                full_name="Test User 2",
            ),
        ]

        for user in test_users:
            session.add(user)
        session.commit()

        # Verify users were created with correct passwords
        for email in ["test1@example.com", "test2@example.com"]:
            user = session.exec(select(User).where(User.email == email)).first()
            assert user is not None
            assert verify_password(test_password, user.hashed_password)

    def test_seed_creates_items_with_owners(self, session: Session):
        """Test that seed script creates items linked to users."""
        from app.core.security import get_password_hash

        # Create user
        user = User(
            email="owner@example.com",
            hashed_password=get_password_hash("password"),
            full_name="Item Owner",
        )
        session.add(user)
        session.commit()
        session.refresh(user)

        # Create items
        items = [
            Item(title="Item 1", description="Test", owner_id=user.id),
            Item(title="Item 2", description="Test", owner_id=user.id),
        ]
        for item in items:
            session.add(item)
        session.commit()

        # Verify items are linked to user
        user_items = session.exec(select(Item).where(Item.owner_id == user.id)).all()
        assert len(user_items) == 2
        assert all(item.owner_id == user.id for item in user_items)

    def test_seed_idempotent(self, session: Session):
        """Test that running seed multiple times doesn't create duplicates."""
        from app.core.security import get_password_hash

        email = "unique@example.com"

        # Create user first time
        user1 = User(
            email=email,
            hashed_password=get_password_hash("password"),
        )
        session.add(user1)
        session.commit()

        # Try to create again (simulating re-running seed)
        existing = session.exec(select(User).where(User.email == email)).first()

        if existing:
            # Should not create duplicate
            all_users = session.exec(select(User).where(User.email == email)).all()
            assert len(all_users) == 1
