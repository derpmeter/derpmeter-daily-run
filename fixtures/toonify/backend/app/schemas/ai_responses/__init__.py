"""
AI 응답 스키마 - 중앙 export

Gemini API의 response_schema 기능과 함께 사용
"""

from .character import (
    CharacterStats,
    CharacterSuggestion,
    CharacterBatchResponse,
    CharacterAugmentOption,
    CharacterAugmentResponse,
    CharacterAnalysisResponse,
)
from .episode import (
    EpisodeIdea,
    EpisodeIdeasResponse,
    DirectionOption,
    DirectionOptionsResponse,
    DialogueItem,
    AppearingCharacter,
    CutScript,
    CutsGenerationResponse,
)
from .worldview import (
    WorldviewOption,
    WorldviewAugmentResponse,
)
from .style import (
    StyleRecommendation,
    StyleRecommendResponse,
    StyleAugmentResponse,
)

__all__ = [
    # Character
    "CharacterStats",
    "CharacterSuggestion",
    "CharacterBatchResponse",
    "CharacterAugmentOption",
    "CharacterAugmentResponse",
    "CharacterAnalysisResponse",
    # Episode
    "EpisodeIdea",
    "EpisodeIdeasResponse",
    "DirectionOption",
    "DirectionOptionsResponse",
    "DialogueItem",
    "AppearingCharacter",
    "CutScript",
    "CutsGenerationResponse",
    # Worldview
    "WorldviewOption",
    "WorldviewAugmentResponse",
    # Style
    "StyleRecommendation",
    "StyleRecommendResponse",
    "StyleAugmentResponse",
]
