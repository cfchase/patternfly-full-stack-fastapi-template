"""Seed database with test data for development."""
import logging
import uuid

from sqlmodel import Session, select

from app.core.config import settings
from app.core.db import engine
from app.core.security import get_password_hash
from app.models import Item, User

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Default password for all test users (for development only)
TEST_USER_PASSWORD = "testpassword123"


def seed_test_data() -> None:
    """Create test users and items for development."""
    with Session(engine) as session:
        # First, ensure the first superuser exists (from initial_data.py)
        first_superuser = session.exec(
            select(User).where(User.email == settings.FIRST_SUPERUSER)
        ).first()

        if not first_superuser:
            logger.warning(f"First superuser {settings.FIRST_SUPERUSER} not found. Creating...")
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
            logger.info(f"✅ Created first superuser: {first_superuser.email}")

        # Create additional test users with real password hashes
        test_users = [
            User(
                id=uuid.UUID("00000000-0000-0000-0000-000000000001"),
                email="john.smith@example.com",
                hashed_password=get_password_hash(TEST_USER_PASSWORD),
                full_name="John Smith",
                is_active=True,
                is_superuser=False,
            ),
            User(
                id=uuid.UUID("00000000-0000-0000-0000-000000000002"),
                email="sarah.johnson@example.com",
                hashed_password=get_password_hash(TEST_USER_PASSWORD),
                full_name="Sarah Johnson",
                is_active=True,
                is_superuser=False,
            ),
            User(
                id=uuid.UUID("00000000-0000-0000-0000-000000000003"),
                email="mike.chen@example.com",
                hashed_password=get_password_hash(TEST_USER_PASSWORD),
                full_name="Mike Chen",
                is_active=True,
                is_superuser=True,
            ),
        ]

        users_created = 0
        for user in test_users:
            existing_user = session.exec(
                select(User).where(User.email == user.email)
            ).first()
            if not existing_user:
                session.add(user)
                users_created += 1

        session.commit()
        logger.info(f"✅ Created {users_created} test users (password: {TEST_USER_PASSWORD})")

        # Create test items
        test_items = [
            Item(
                title="Data Processing Pipeline",
                description="Automated data processing pipeline for customer analytics. Handles ingestion, transformation, and storage of customer data.",
                owner_id=uuid.UUID("00000000-0000-0000-0000-000000000001"),
            ),
            Item(
                title="User Authentication Service",
                description="Centralized authentication service supporting OAuth 2.0, SAML, and multi-factor authentication.",
                owner_id=uuid.UUID("00000000-0000-0000-0000-000000000002"),
            ),
            Item(
                title="Notification Engine",
                description="Real-time notification system supporting email, SMS, and push notifications.",
                owner_id=uuid.UUID("00000000-0000-0000-0000-000000000003"),
            ),
            Item(
                title="Analytics Dashboard",
                description="Interactive dashboard for business intelligence and data visualization.",
                owner_id=uuid.UUID("00000000-0000-0000-0000-000000000001"),
            ),
            Item(
                title="API Gateway",
                description="Central API gateway for routing, rate limiting, and authentication of all API requests.",
                owner_id=uuid.UUID("00000000-0000-0000-0000-000000000001"),
            ),
            Item(
                title="File Storage Service",
                description="Distributed file storage service with encryption and redundancy.",
                owner_id=uuid.UUID("00000000-0000-0000-0000-000000000002"),
            ),
            Item(
                title="Machine Learning Model",
                description="Customer churn prediction model using ensemble learning techniques.",
                owner_id=uuid.UUID("00000000-0000-0000-0000-000000000003"),
            ),
            Item(
                title="Backup System",
                description="Automated backup system with incremental backups and disaster recovery capabilities.",
                owner_id=uuid.UUID("00000000-0000-0000-0000-000000000002"),
            ),
        ]

        # Check if items already exist (by title)
        items_created = 0
        for item_data in test_items:
            existing_item = session.exec(
                select(Item).where(Item.title == item_data.title)
            ).first()
            if not existing_item:
                session.add(item_data)
                items_created += 1

        session.commit()
        logger.info(f"✅ Created {items_created} test items")


if __name__ == "__main__":
    seed_test_data()
