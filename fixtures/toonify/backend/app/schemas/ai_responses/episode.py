"""
에피소드 AI 응답 스키마

Gemini API response_schema와 함께 사용
"""
from pydantic import BaseModel, Field
from typing import List, Optional


class EpisodeIdea(BaseModel):
    """에피소드 아이디어"""
    title: str = Field(..., description="에피소드 제목")
    summary: str = Field(..., description="에피소드 요약 (3-5문장)")
    reason: str = Field(..., description="이전 플롯과의 연결 및 스토리 진행 이유")


class EpisodeIdeasResponse(BaseModel):
    """에피소드 아이디어 응답"""
    options: List[EpisodeIdea] = Field(
        ..., 
        min_length=3, 
        max_length=3,
        description="3개의 에피소드 아이디어"
    )


class DirectionOption(BaseModel):
    """연출 옵션"""
    id: str = Field(..., description="옵션 ID")
    title: str = Field(..., description="연출 방향 제목")
    description: str = Field(..., description="연출 설명")
    mood: str = Field(..., description="분위기/톤")
    camera_style: str = Field(..., description="카메라 스타일/구도")


class DirectionOptionsResponse(BaseModel):
    """연출 옵션 응답"""
    options: List[DirectionOption] = Field(
        ..., 
        min_length=3, 
        max_length=3,
        description="3개의 연출 옵션"
    )


class DialogueItem(BaseModel):
    """대사 아이템"""
    speaker: str = Field(..., description="화자 이름")
    type: str = Field(
        ..., 
        description="대사 유형: speech, thought, shout, whisper, narration 중 하나"
    )
    text: str = Field(..., description="대사 내용")


class AppearingCharacter(BaseModel):
    """등장 캐릭터"""
    id: Optional[str] = Field(None, description="캐릭터 ID (있는 경우)")
    name: str = Field(..., description="캐릭터 이름")
    clothing: str = Field(..., description="의상 설명")


class CutScript(BaseModel):
    """컷 스크립트"""
    cut_order: int = Field(..., ge=1, description="컷 순서 (1부터 시작)")
    script: str = Field(..., description="시각적 장면 설명")
    location: str = Field(..., description="장소 이름")
    time_of_day: str = Field(..., description="시간대 (Morning, Afternoon, Evening, Night 등)")
    dialogues: List[DialogueItem] = Field(default_factory=list, description="대사 리스트")
    appearing_characters: List[AppearingCharacter] = Field(
        default_factory=list, 
        description="등장 캐릭터 리스트"
    )
    panel_type: str = Field(
        ..., 
        description="패널 타입: Wide, Square, Vertical, Closeup, FullPage 중 하나"
    )
    refer_prev_cut: bool = Field(
        False, 
        description="이전 컷과 같은 장소/시간인 경우 True"
    )
    transition_ref: Optional[str] = Field(
        None, 
        description="패널 전환 참고 노트"
    )


class CutsGenerationResponse(BaseModel):
    """컷 스크립트 생성 응답"""
    background_info: str = Field(..., description="전체 배경 설명")
    character_outfits: dict = Field(
        ..., 
        description="캐릭터별 의상 정보 {'캐릭터이름': '의상설명'}"
    )
    cuts: List[CutScript] = Field(..., description="컷 스크립트 리스트")
