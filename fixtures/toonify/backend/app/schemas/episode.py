"""
Episode-related Pydantic schemas.
"""
from typing import Any, List, Optional
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID


# ========== Request Schemas ==========

class EpisodeCreate(BaseModel):
    """Schema for creating a new episode."""
    title: str
    project_id: UUID
    episode_order: int
    story_summary: str = ""


class EpisodeUpdate(BaseModel):
    """Schema for updating an existing episode."""
    title: Optional[str] = None
    story_summary: Optional[str] = None
    background_info: Optional[str] = None
    character_outfits: Optional[dict] = None


class GenerateCutsRequest(BaseModel):
    """Schema for generating episode cuts."""
    project_id: UUID
    episode_title: str
    episode_summary: str
    style: Optional[str] = None
    num_cuts: int = 6


class GenerateImageRequest(BaseModel):
    """Schema for generating cut image."""
    prompt_override: Optional[str] = None
    use_previous_context: bool = True


class BatchRegenerateRequest(BaseModel):
    """Schema for regenerating multiple cuts."""
    cut_ids: List[UUID]


# ========== Response Schemas ==========

class EpisodeOut(BaseModel):
    """Schema for episode output/response."""
    id: Any
    title: str
    episode_order: int
    project_id: Any
    story_summary: str = ""
    status: str
    created_at: datetime
    
    # Context
    background_info: Optional[str] = None
    character_outfits: Optional[dict] = None
    
    # First cut thumbnail
    first_cut_image: Optional[str] = None

    class Config:
        from_attributes = True


class EpisodeSuggestionOut(BaseModel):
    """Schema for episode suggestion output."""
    id: UUID
    title: str
    summary: str
    reason: Optional[str] = None
    user_instruction: Optional[str] = None
    is_used: bool
    created_at: datetime

    class Config:
        from_attributes = True
