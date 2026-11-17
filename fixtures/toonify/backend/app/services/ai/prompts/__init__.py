"""
AI Service System Prompts - 중앙화된 프롬프트 관리

Usage:
    from app.services.ai.prompts import (
        CHARACTER_SYSTEM_PROMPT,
        EPISODE_SYSTEM_PROMPT,
        get_language_instruction,
    )
"""

from .base import (
    get_language_instruction,
    build_context_string,
    format_character_list,
)
from .constants import (
    CharacterRole,
    PersonalityTag,
    PanelType,
    DialogueType,
    enum_to_prompt_options,
    enum_to_prompt_list,
    get_role_descriptions_prompt,
)
from .character import CHARACTER_SYSTEM_PROMPT
from .episode import EPISODE_SYSTEM_PROMPT
from .worldview import WORLDVIEW_SYSTEM_PROMPT
from .style import STYLE_SYSTEM_PROMPT
from .image import PANEL_IMAGE_SYSTEM_PROMPT
from .genre import get_genre_modifier, GENRE_MODIFIERS

__all__ = [
    # System Prompts
    "CHARACTER_SYSTEM_PROMPT",
    "EPISODE_SYSTEM_PROMPT",
    "WORLDVIEW_SYSTEM_PROMPT",
    "STYLE_SYSTEM_PROMPT",
    "PANEL_IMAGE_SYSTEM_PROMPT",
    # Utilities
    "get_language_instruction",
    "build_context_string",
    "format_character_list",
    "get_genre_modifier",
    "get_role_descriptions_prompt",
    # Constants/Enums
    "CharacterRole",
    "PersonalityTag",
    "PanelType",
    "DialogueType",
    "enum_to_prompt_options",
    "enum_to_prompt_list",
    "GENRE_MODIFIERS",
]
