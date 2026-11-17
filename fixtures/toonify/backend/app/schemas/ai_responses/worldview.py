"""
세계관 AI 응답 스키마

Gemini API response_schema와 함께 사용
"""
from pydantic import BaseModel, Field
from typing import List


class WorldviewOption(BaseModel):
    """세계관 확장 옵션"""
    id: str = Field(..., description="옵션 ID (option_1, option_2, option_3)")
    title: str = Field(..., description="방향성 제목")
    tone: List[str] = Field(..., description="톤 키워드 리스트")
    key_features: List[str] = Field(
        ..., 
        min_length=3,
        description="핵심 특징 3개 이상"
    )
    description: str = Field(..., description="간단 요약 (1-2문장)")
    content: str = Field(..., description="상세 세계관 설명 (3-5 문단)")


class WorldviewAugmentResponse(BaseModel):
    """세계관 확장 응답"""
    options: List[WorldviewOption] = Field(
        ..., 
        min_length=3, 
        max_length=3,
        description="3개의 세계관 방향 옵션"
    )
