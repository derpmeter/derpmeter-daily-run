from typing import Any, List
from fastapi import APIRouter, Body, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from pydantic.networks import EmailStr
from sqlmodel import Session, select

from app.api import deps
from app.core.config import settings
from app.models import User, UserRead, UserUpdate

router = APIRouter()

@router.get("/me", response_model=UserRead)
def read_user_me(
    session: Session = Depends(deps.get_session),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get current user.
    """
    return current_user

@router.put("/me", response_model=UserRead)
def update_user_me(
    *,
    session: Session = Depends(deps.get_session),
    user_in: UserUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update own user.
    """
    if user_in.email:
         existing_user = session.exec(select(User).where(User.email == user_in.email)).first()
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
