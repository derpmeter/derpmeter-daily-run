"""
캐릭터 AI 응답 스키마

Gemini API response_schema와 함께 사용
"""
from pydantic import BaseModel, Field
from typing import List, Optional


class CharacterStats(BaseModel):
    """캐릭터 스탯"""
    strength: int = Field(..., ge=0, le=100, description="힘 (0-100)")
    intelligence: int = Field(..., ge=0, le=100, description="지능 (0-100)")
    charisma: int = Field(..., ge=0, le=100, description="매력 (0-100)")
    luck: int = Field(..., ge=0, le=100, description="행운 (0-100)")
    empathy: int = Field(..., ge=0, le=100, description="공감 능력 (0-100)")
    leadership: int = Field(..., ge=0, le=100, description="리더십 (0-100)")


class CharacterSuggestion(BaseModel):
    """배치 캐릭터 제안 아이템"""
    name: str = Field(..., description="캐릭터 이름")
    age: str = Field(..., description="나이 (예: '19', 'Early 20s')")
    role: str = Field(..., description="스토리 내 역할 (예: 'Rival', 'Best Friend')")
    recommended_role: str = Field(
        ..., 
        description="권장 역할: protagonist, antagonist, second_lead, scene_stealer 중 하나"
    )
    visual_keywords: List[str] = Field(
        ..., 
        min_length=3, 
        max_length=5,
        description="시각적 외모 태그 3-5개"
    )
    personality: str = Field(..., description="성격 요약 (1-2문장)")
    personality_tags: List[str] = Field(
        ..., 
        min_length=1, 
        max_length=3,
        description="성격 태그 1-3개"
    )
    theme_color: str = Field(..., description="테마 컬러 (Hex, 예: '#ef4444')")
    bio: str = Field(..., description="간단한 배경 (2-3문장)")
    stats: CharacterStats = Field(..., description="캐릭터 스탯")


class CharacterBatchResponse(BaseModel):
    """배치 캐릭터 제안 응답"""
    suggestions: List[CharacterSuggestion] = Field(..., description="캐릭터 제안 리스트")


class CharacterAugmentOption(BaseModel):
    """캐릭터 컨셉 확장 옵션"""
    id: str = Field(..., description="옵션 ID (option_1, option_2, option_3)")
    title: str = Field(..., description="옵션 제목")
    description: str = Field(..., description="간단한 설명")
    detailed_description: str = Field(..., description="상세 캐릭터 설명")
    visual_keywords: List[str] = Field(..., description="시각적 키워드")
    personality_traits: List[str] = Field(..., description="성격 특성")
    background_hint: str = Field(..., description="배경 힌트")


class CharacterAugmentResponse(BaseModel):
    """캐릭터 컨셉 확장 응답"""
    options: List[CharacterAugmentOption] = Field(
        ..., 
        min_length=3, 
        max_length=3,
        description="3개의 캐릭터 컨셉 옵션"
    )


class CharacterAnalysisResponse(BaseModel):
    """캐릭터 컨셉 분석 응답"""
    recommended_role: str = Field(
        ..., 
        description="권장 역할: protagonist, antagonist, second_lead, scene_stealer 중 하나"
    )
    analysis: str = Field(..., description="역할 선정 이유 (1-2문장)")
    lore: str = Field(..., description="캐릭터 배경 스토리 (2-3문장)")
    stats: CharacterStats = Field(..., description="캐릭터 스탯")
