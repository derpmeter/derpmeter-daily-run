"""
Project-related Pydantic schemas.
"""
from typing import Any, List, Optional
from pydantic import BaseModel, root_validator, validator
from datetime import datetime
from uuid import UUID

from app.core.config import settings


# ========== Request Schemas ==========

class ProjectCreate(BaseModel):
    """Schema for creating a new project."""
    title: str
    subtitle: str | None = None
    genre_ids: List[UUID] = []
    worldview: dict | str | None = None
    style_preset: str = "anime_webtoon"  # Default
    style_reference_url: str | None = None
    language: str | None = None


class ProjectUpdate(BaseModel):
    """Schema for updating an existing project."""
    title: str | None = None
    subtitle: str | None = None
    genre_ids: List[UUID] | None = None
    worldview: dict | str | None = None
    style_preset: str | None = None
    style_reference_url: str | None = None
    description: str | None = None
    language: str | None = None


class WorldviewAugmentRequest(BaseModel):
    """Schema for worldview augmentation request."""
    title: str
    description: str
    subtitle: str | None = None
    genres: List[str] = []
    language: str | None = None


class StyleRecommendRequest(BaseModel):
    """Schema for style recommendation request."""
    description: str


# ========== Response Schemas ==========

class ProjectOut(BaseModel):
    """Schema for project output/response."""
    id: Any
    title: str
    subtitle: str | None
    genres: List[str] = []
    genre_ids: List[UUID] = []
    worldview: dict | str | None
    style_preset: str
    style_reference_url: str | None = None
    language: str = "en"
    thumbnail_url: str | None = None
    cover_image_status: str | None = None
    created_at: datetime
    workspace_id: Any

    @root_validator(pre=True)
    def resolve_fields(cls, values):
        # Flatten genres if they exist in ORM object
        if hasattr(values, "genres") and values.genres:
            pass
        return values
    
    @validator("thumbnail_url", pre=True, always=True)
    def make_full_url(cls, v: str | None) -> str | None:
        if v and not v.startswith("http"):
            return f"{settings.STORAGE_HOST}/{v}"
        return v
        
    class Config:
        from_attributes = True


class ProjectDetailOut(ProjectOut):
    """Schema for detailed project output including characters."""
    characters: List[dict] = []
