"""
Character-related Pydantic schemas.
"""
from typing import Any, List, Optional
from pydantic import BaseModel, validator
from datetime import datetime
from uuid import UUID

from app.core.config import settings


# ========== Request Schemas ==========

class CharacterCreate(BaseModel):
    """Schema for creating a new character."""
    name: str
    project_id: UUID
    appearance_tags: List[str] = []
    default_mood: List[str] = []
    description: Optional[str] = None
    profile: Optional[dict] = {}


class CharacterUpdate(BaseModel):
    """Schema for updating an existing character."""
    name: Optional[str] = None
    appearance_tags: Optional[List[str]] = None
    default_mood: Optional[List[str]] = None
    profile_image_url: Optional[str] = None
    description: Optional[str] = None
    profile: Optional[dict] = None


class CharacterAugmentRequest(BaseModel):
    """Schema for character augmentation request."""
    name: str
    tags: List[str]
    mood: List[str]
    project_id: UUID
    language: Optional[str] = "en"


class SuggestionRequest(BaseModel):
    """Schema for character suggestion request."""
    project_id: UUID
    type: str  # "name", "visuals", "lore"
    current_name: Optional[str] = None
    age: Optional[str] = None
    role: Optional[str] = None
    visual_keywords: Optional[List[str]] = []
    personality: Optional[str] = None
    language: Optional[str] = "en"


class CharacterAnalysisRequest(BaseModel):
    """Schema for character analysis request."""
    project_id: UUID
    name: str
    age: str
    visual_keywords: List[str]
    personality: str
    language: Optional[str] = "en"


class BatchSuggestionRequest(BaseModel):
    """Schema for batch character suggestions request."""
    project_id: UUID
    language: Optional[str] = "en"


class SuggestionUseRequest(BaseModel):
    """Schema for marking a suggestion as used."""
    suggestion_id: UUID


# ========== Response Schemas ==========

class CharacterOut(BaseModel):
    """Schema for character output/response."""
    id: Any
    name: str
    project_id: Any
    appearance_tags: List[str] = []
    default_mood: Any = []  # Handle list or json string
    profile_image_url: Optional[str] = None
    description: Optional[str] = None
    profile: Optional[dict] = {}
    sheet_status: Optional[str] = "pending"
    created_at: datetime

    @validator("profile_image_url", pre=True, always=True)
    def make_full_url(cls, v: str | None) -> str | None:
        if v and not v.startswith("http"):
            return f"{settings.STORAGE_HOST}/{v}"
        return v

    class Config:
        from_attributes = True


class CharacterOption(BaseModel):
    """Schema for a single character augmentation option."""
    name: str
    age: str
    personality: str
    features: List[str]
    pros: List[str]
    cons: List[str]
    visual_description: str
    reason: Optional[str] = None


class CharacterAugmentResponse(BaseModel):
    """Schema for character augmentation response."""
    options: List[CharacterOption]
