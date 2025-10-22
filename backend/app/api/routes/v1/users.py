import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import col, delete, func, select

from app.api.deps import CurrentUser, SessionDep, get_current_active_superuser
from app.core.security import get_password_hash, verify_password
from app.models import (
    Message,
    UpdatePassword,
    User,
    UserCreate,
    UserPublic,
    UserRegister,
    UsersPublic,
    UserUpdate,
    UserUpdateMe,
)

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", dependencies=[Depends(get_current_active_superuser)], response_model=UsersPublic)
def read_users(session: SessionDep, skip: int = 0, limit: int = 100) -> Any:
    """
    Retrieve users (superuser only).
    """
    count_statement = select(func.count()).select_from(User)
    count = session.exec(count_statement).one()

    statement = select(User).offset(skip).limit(limit)
    users = session.exec(statement).all()

    return UsersPublic(data=users, count=count)


@router.post("/", dependencies=[Depends(get_current_active_superuser)], response_model=UserPublic)
def create_user(*, session: SessionDep, user_in: UserCreate) -> Any:
    """
    Create new user (superuser only).
    """
    user = session.exec(
        select(User).where(User.email == user_in.email)
    ).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="A user with this email already exists in the system.",
        )

    user = User.model_validate(
        user_in, update={"hashed_password": get_password_hash(user_in.password)}
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@router.patch("/me", response_model=UserPublic)
def update_user_me(
    *, session: SessionDep, user_in: UserUpdateMe, current_user: CurrentUser
) -> Any:
    """
    Update own user profile.
    """
    if user_in.email:
        existing_user = session.exec(
            select(User).where(User.email == user_in.email)
        ).first()
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(
                status_code=409, detail="User with this email already exists"
            )

    user_data = user_in.model_dump(exclude_unset=True)
    current_user.sqlmodel_update(user_data)
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return current_user


@router.patch("/me/password", response_model=Message)
def update_password_me(
    *, session: SessionDep, body: UpdatePassword, current_user: CurrentUser
) -> Any:
    """
    Update own password.
    """
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect password")
    if body.current_password == body.new_password:
        raise HTTPException(
            status_code=400, detail="New password cannot be the same as the current one"
        )
    hashed_password = get_password_hash(body.new_password)
    current_user.hashed_password = hashed_password
    session.add(current_user)
    session.commit()
    return Message(message="Password updated successfully")


@router.get("/me", response_model=UserPublic)
def read_user_me(current_user: CurrentUser) -> Any:
    """
    Get current user.
    """
    return current_user


@router.delete("/me", response_model=Message)
def delete_user_me(session: SessionDep, current_user: CurrentUser) -> Any:
    """
    Delete own user account.
    """
    if current_user.is_superuser:
        raise HTTPException(
            status_code=403, detail="Super users are not allowed to delete themselves"
        )
    session.delete(current_user)
    session.commit()
    return Message(message="User deleted successfully")


@router.post("/signup", response_model=UserPublic)
def register_user(session: SessionDep, user_in: UserRegister) -> Any:
    """
    Create new user without requiring authentication (public signup).
    """
    user = session.exec(
        select(User).where(User.email == user_in.email)
    ).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="A user with this email already exists in the system",
        )
    user_create = UserCreate.model_validate(user_in)
    user = User.model_validate(
        user_create, update={"hashed_password": get_password_hash(user_create.password)}
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@router.get("/{user_id}", dependencies=[Depends(get_current_active_superuser)], response_model=UserPublic)
def read_user_by_id(user_id: uuid.UUID, session: SessionDep) -> Any:
    """
    Get a specific user by ID (superuser only).
    """
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this ID does not exist in the system",
        )
    return user


@router.patch("/{user_id}", dependencies=[Depends(get_current_active_superuser)], response_model=UserPublic)
def update_user(
    *,
    session: SessionDep,
    user_id: uuid.UUID,
    user_in: UserUpdate,
) -> Any:
    """
    Update a user (superuser only).
    """
    db_user = session.get(User, user_id)
    if not db_user:
        raise HTTPException(
            status_code=404,
            detail="The user with this ID does not exist in the system",
        )
    if user_in.email:
        existing_user = session.exec(
            select(User).where(User.email == user_in.email)
        ).first()
        if existing_user and existing_user.id != user_id:
            raise HTTPException(
                status_code=409, detail="User with this email already exists"
            )

    update_dict = user_in.model_dump(exclude_unset=True)
    if user_in.password:
        update_dict["hashed_password"] = get_password_hash(user_in.password)
        del update_dict["password"]

    db_user.sqlmodel_update(update_dict)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


@router.delete("/{user_id}", dependencies=[Depends(get_current_active_superuser)])
def delete_user(
    session: SessionDep, current_user: CurrentUser, user_id: uuid.UUID
) -> Message:
    """
    Delete a user (superuser only).
    """
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this ID does not exist in the system",
        )
    if user == current_user:
        raise HTTPException(
            status_code=403, detail="Super users are not allowed to delete themselves"
        )
    session.delete(user)
    session.commit()
    return Message(message="User deleted successfully")
