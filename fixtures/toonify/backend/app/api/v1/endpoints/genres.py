from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

from app.api import deps
from app.models import Genre, User
from app.core import security

router = APIRouter()

class GenreCreate(BaseModel):
    name: str
    description: str | None = None
    is_active: bool = True

class GenreOut(BaseModel):
    id: UUID
    name: str
    description: str | None
    is_active: bool
    created_at: datetime

@router.get("", response_model=List[GenreOut])
def list_genres(
    session: Session = Depends(deps.get_session),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    List all genres.
    """
    statement = select(Genre).where(Genre.is_active == True).offset(skip).limit(limit)
    genres = session.exec(statement).all()
    return genres

@router.post("/", response_model=GenreOut)
def create_genre(
    *,
    session: Session = Depends(deps.get_session),
    genre_in: GenreCreate,
    current_user_id: str = Depends(deps.get_current_user_id),
) -> Any:
    """
    Create a new genre.
    """
    # Check if genre exists
    existing = session.exec(select(Genre).where(Genre.name == genre_in.name)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Genre with this name already exists")

    genre = Genre(
        name=genre_in.name,
        description=genre_in.description,
        is_active=genre_in.is_active
    )
    session.add(genre)
    session.commit()
    session.refresh(genre)
    return genre
