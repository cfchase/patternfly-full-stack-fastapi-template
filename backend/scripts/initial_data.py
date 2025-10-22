"""
Create initial data in the database (first superuser).

This script creates the first superuser based on configuration settings.
It should be run after database migrations to initialize the system.
"""
import logging

from sqlmodel import Session, select

from app.core.config import settings
from app.core.db import engine
from app.core.security import get_password_hash
from app.models import User

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_first_superuser() -> None:
    """Create the first superuser if it doesn't exist."""
    with Session(engine) as session:
        # Check if first superuser already exists
        user = session.exec(
            select(User).where(User.email == settings.FIRST_SUPERUSER)
        ).first()

        if not user:
            user = User(
                email=settings.FIRST_SUPERUSER,
                hashed_password=get_password_hash(settings.FIRST_SUPERUSER_PASSWORD),
                is_superuser=True,
                is_active=True,
                full_name="Admin User",
            )
            session.add(user)
            session.commit()
            session.refresh(user)
            logger.info(f"✅ Created first superuser: {user.email}")
        else:
            logger.info(f"First superuser already exists: {user.email}")


def main() -> None:
    """Main function to create initial data."""
    logger.info("Creating initial data")
    create_first_superuser()
    logger.info("Initial data created successfully")


if __name__ == "__main__":
    main()
