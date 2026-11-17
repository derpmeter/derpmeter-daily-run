"""
스타일 AI 응답 스키마

Gemini API response_schema와 함께 사용
"""
from pydantic import BaseModel, Field
from typing import List, Optional


class StyleRecommendation(BaseModel):
    """스타일 추천 아이템"""
    id: str = Field(..., description="스타일 ID")
    label: str = Field(..., description="스타일 이름 (예: 'Clean Line Romance')")
    description: str = Field(..., description="스토리에 맞는 이유 (2-3문장)")
    technical_notes: str = Field(..., description="기술적 특징: 라인워크, 채색, 음영 방식")
    reference_works: List[str] = Field(..., description="참고 웹툰/만화 예시")


class StyleRecommendResponse(BaseModel):
    """스타일 추천 응답"""
    options: List[StyleRecommendation] = Field(
        ..., 
        min_length=3, 
        max_length=3,
        description="3개의 스타일 추천"
    )


class StyleAugmentResponse(BaseModel):
    """스타일 프롬프트 확장 응답"""
    expanded_prompt: str = Field(
        ..., 
        description="확장된 스타일 프롬프트 (이미지 생성용)"
    )
    color_palette: List[str] = Field(
        ..., 
        description="추천 컬러 팔레트 (Hex 코드)"
    )
    mood_keywords: List[str] = Field(
        ..., 
        description="분위기 키워드"
    )
    technical_style: str = Field(
        ..., 
        description="기술적 스타일 설명"
    )
