"""
프롬프트 상수 및 Enum 정의

프롬프트 템플릿에서 하드코딩을 피하고 동적 주입을 위해 사용
"""
from enum import Enum
from typing import Type


class CharacterRole(str, Enum):
    """캐릭터 역할 유형"""
    PROTAGONIST = "protagonist"
    ANTAGONIST = "antagonist"
    SECOND_LEAD = "second_lead"
    SCENE_STEALER = "scene_stealer"


class PersonalityTag(str, Enum):
    """캐릭터 성격 태그"""
    CHEERFUL = "Cheerful"
    SERIOUS = "Serious"
    COLD = "Cold"
    TSUNDERE = "Tsundere"
    MYSTERIOUS = "Mysterious"
    MELANCHOLIC = "Melancholic"
    PURE = "Pure"
    MADNESS = "Madness"
    GENTLE = "Gentle"
    REBELLIOUS = "Rebellious"


class PanelType(str, Enum):
    """패널 타입 (비율)"""
    WIDE = "Wide"
    SQUARE = "Square"
    VERTICAL = "Vertical"
    CLOSEUP = "Closeup"
    FULL_PAGE = "FullPage"


class DialogueType(str, Enum):
    """대사 유형"""
    SPEECH = "speech"
    THOUGHT = "thought"
    SHOUT = "shout"
    WHISPER = "whisper"
    NARRATION = "narration"


class TimeOfDay(str, Enum):
    """시간대"""
    MORNING = "Morning"
    AFTERNOON = "Afternoon"
    EVENING = "Evening"
    NIGHT = "Night"
    DAWN = "Dawn"
    DUSK = "Dusk"


# ============================================================================
# Enum 유틸리티 함수
# ============================================================================

def enum_to_prompt_options(enum_class: Type[Enum]) -> str:
    """
    Enum을 프롬프트용 옵션 문자열로 변환 (pipe 구분)
    
    Example:
        CharacterRole -> "protagonist|antagonist|second_lead|scene_stealer"
    """
    return "|".join([e.value for e in enum_class])


def enum_to_prompt_list(enum_class: Type[Enum]) -> str:
    """
    Enum을 프롬프트용 리스트 문자열로 변환 (따옴표 포함)
    
    Example:
        PersonalityTag -> '"Cheerful", "Serious", "Cold", ...'
    """
    return ", ".join([f'"{e.value}"' for e in enum_class])


def enum_values_list(enum_class: Type[Enum]) -> list:
    """
    Enum의 모든 값을 리스트로 반환
    
    Example:
        CharacterRole -> ["protagonist", "antagonist", "second_lead", "scene_stealer"]
    """
    return [e.value for e in enum_class]


# ============================================================================
# 역할 설명 (프롬프트에서 사용)
# ============================================================================

CHARACTER_ROLE_DESCRIPTIONS = {
    CharacterRole.PROTAGONIST: "Center of story, determined, relatable, growth-oriented",
    CharacterRole.ANTAGONIST: "Opposing force, ambitious, understandable motivations",
    CharacterRole.SECOND_LEAD: "Devoted support/rival, potential romantic interest, complex feelings",
    CharacterRole.SCENE_STEALER: "Comic relief/wildcard, distinct personality, memorable moments",
}


def get_role_descriptions_prompt() -> str:
    """역할 설명을 프롬프트용 문자열로 반환"""
    lines = ["## Available Roles"]
    for role, desc in CHARACTER_ROLE_DESCRIPTIONS.items():
        lines.append(f'- "{role.value}": {desc}')
    return "\n".join(lines)
