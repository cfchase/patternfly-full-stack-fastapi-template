from sqlmodel import Session, SQLModel, create_engine

from app.core.config import settings

# Create database engine
engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))

# make sure all SQLModel models are imported (app.models) before initializing DB
# otherwise, SQLModel might fail to initialize relationships properly
# for more details: https://github.com/fastapi/full-stack-fastapi-template/issues/28
from app.models import Item, User  # noqa: F401


def init_db(engine_arg=None) -> None:
    """
    Initialize database tables.

    Args:
        engine_arg: Optional engine to use (for testing). Uses default engine if None.
    """
    db_engine = engine_arg if engine_arg is not None else engine
    SQLModel.metadata.create_all(db_engine)
