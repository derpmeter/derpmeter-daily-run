"""
Centralized Pydantic schema exports.

All schemas are defined in domain-specific modules and re-exported here for convenient imports.
Usage: from app.schemas import CharacterCreate, EpisodeOut, ProjectOut
"""

# Base
from app.schemas.base import FullUrlMixin, OrmConfig

# Common
from app.schemas.common import SuccessResponse, ErrorResponse, PaginatedResponse

# Character schemas
from app.schemas.character import (
    CharacterCreate,
    CharacterUpdate,
    CharacterAugmentRequest,
    CharacterOut,
    CharacterOption,
    CharacterAugmentResponse,
    SuggestionRequest,
    CharacterAnalysisRequest,
    BatchSuggestionRequest,
    SuggestionUseRequest,
)

# Episode schemas
from app.schemas.episode import (
    EpisodeCreate,
    EpisodeUpdate,
    EpisodeOut,
    EpisodeSuggestionOut,
    GenerateCutsRequest,
    GenerateImageRequest,
    BatchRegenerateRequest,
)

# Project schemas
from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectOut,
    ProjectDetailOut,
    WorldviewAugmentRequest,
    StyleRecommendRequest,
)


__all__ = [
    # Base
    "FullUrlMixin",
    "OrmConfig",
    # Common
    "SuccessResponse",
    "ErrorResponse",
    "PaginatedResponse",
    # Character
    "CharacterCreate",
    "CharacterUpdate",
    "CharacterAugmentRequest",
    "CharacterOut",
    "CharacterOption",
    "CharacterAugmentResponse",
    "SuggestionRequest",
    "CharacterAnalysisRequest",
    "BatchSuggestionRequest",
    "SuggestionUseRequest",
    # Episode
    "EpisodeCreate",
    "EpisodeUpdate",
    "EpisodeOut",
    "EpisodeSuggestionOut",
    "GenerateCutsRequest",
    "GenerateImageRequest",
    "BatchRegenerateRequest",
    # Project
    "ProjectCreate",
    "ProjectUpdate",
    "ProjectOut",
    "ProjectDetailOut",
    "WorldviewAugmentRequest",
    "StyleRecommendRequest",
]
