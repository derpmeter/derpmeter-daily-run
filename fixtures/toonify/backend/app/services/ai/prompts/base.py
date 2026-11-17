"""
공통 프롬프트 유틸리티

언어별 지시문, 컨텍스트 포맷팅 등 공통 기능
"""
import json
from typing import Dict, List, Any, Optional


# ============================================================================
# 언어별 지시문
# ============================================================================

KOREAN_INSTRUCTION = """
## Language: Korean (한국어)

### 기본 규칙
- All output text MUST be in Korean Hangul (한글).
- Use natural Korean expressions - avoid translated-sounding text.

### 이름 규칙
- 성+이름 형식 (예: 김수현, 박지민, 이하늘)
- 2-4 음절 권장
- 캐릭터 성격과 어울리는 의미/운율 고려
- 외국 캐릭터는 한글 음역 (예: 알렉스 → 알렉스)

### 대사 규칙
- **말풍선 길이 제한**: 한 버블당 최대 15-20자
- **존댓말('~요'/~습니다') vs 반말('~다'/~해)**:
  - 연상, 선생님, 처음 만난 사이 → 존댓말
  - 친구, 연하, 친밀한 관계 → 반말
  - 캐릭터 개성 반영 (까칠한 캐릭터는 반말 선호 등)
- **호칭 사용**:
  - 형/오빠/누나/언니 - 나이/친밀도 기반
  - 선배/후배 - 학교/직장 맥락
  - ~씨 - 공식적/거리감

### 웹툰 특화 표현
- **의성어/의태어**: 쾅!, 두근두근, 휘청~, 번쩍!, 울컥
- **감정 강조**: ㅋㅋㅋ, ㅠㅠ, ;;, ㄷㄷ (캐릭터/상황에 맞게)
- **말줄임**: ..., 흐으음, 아니 그게...

### 피해야 할 것
- 번역투 문장 (영어 직역체)
- 과도한 Konglish (캐릭터 특성이 아닌 경우)
- 너무 격식체인 묘사 (웹툰은 visual-first)
"""

ENGLISH_INSTRUCTION = """
## Language: English

### General Rules
- All output text should be in natural, fluent English.
- Avoid overly formal or academic language unless character calls for it.

### Naming Conventions
- Creative but pronounceable names
- Consider the story's cultural setting
- Avoid overly complicated spellings

### Dialogue Rules
- **Speech Bubble Length**: Keep concise, 10-15 words max per bubble
- Vary vocabulary and sentence structure
- Consider character education level and background
- Use contractions naturally (I'm, don't, we'll)

### Style Notes
- Show emotion through word choice and rhythm
- Match dialogue formality to relationships
- Use slang/colloquialisms appropriately by character
"""

JAPANESE_INSTRUCTION = """
## Language: Japanese (日本語)

### 基本ルール
- All output text MUST be in Japanese.
- Names should follow Japanese conventions (姓+名).

### 敬語・スピーチレベル
- Use appropriate honorifics (さん、くん、ちゃん、様) based on relationships.
- Consider keigo levels for formal/informal situations.
- Match speech patterns to character personality.

### 対話ルール
- Consider masculine/feminine speech patterns
- Age-appropriate language (若者言葉 for youth)
- Balance visual detail with brevity
"""


def get_language_instruction(language: str) -> str:
    """
    언어별 상세 지시문 반환
    
    Args:
        language: 언어 코드 (예: "ko", "en", "ja")
        
    Returns:
        해당 언어에 맞는 상세 지시문
    """
    if not language:
        return ENGLISH_INSTRUCTION
        
    lang_lower = language.lower()
    
    if lang_lower.startswith('ko'):
        return KOREAN_INSTRUCTION
    elif lang_lower.startswith('ja'):
        return JAPANESE_INSTRUCTION
    else:
        return ENGLISH_INSTRUCTION


# ============================================================================
# 컨텍스트 포맷팅
# ============================================================================

def build_context_string(context: Dict[str, Any]) -> str:
    """
    컨텍스트 딕셔너리를 프롬프트용 문자열로 변환
    
    Args:
        context: 컨텍스트 딕셔너리
        
    Returns:
        포맷된 문자열
    """
    if not context:
        return "None specified"
    
    lines = []
    for key, value in context.items():
        if value is None:
            continue
        if isinstance(value, list):
            value = ", ".join(str(v) for v in value)
        elif isinstance(value, dict):
            value = json.dumps(value, ensure_ascii=False, indent=2)
        lines.append(f"- {key}: {value}")
    
    return "\n".join(lines) if lines else "None specified"


def format_character_list(characters: List[Dict]) -> str:
    """
    캐릭터 목록을 프롬프트용 문자열로 포맷
    
    Args:
        characters: 캐릭터 정보 리스트
        
    Returns:
        포맷된 문자열
    """
    if not characters:
        return "None specified"
    
    lines = []
    for char in characters:
        parts = [f"- Name: {char.get('name', 'Unknown')}"]
        
        if char.get('id'):
            parts.append(f"  ID: {char['id']}")
        if char.get('role'):
            parts.append(f"  Role: {char['role']}")
        if char.get('personality'):
            parts.append(f"  Personality: {char['personality']}")
        if char.get('appearance'):
            app = char['appearance']
            if isinstance(app, list):
                app = ", ".join(app)
            parts.append(f"  Appearance: {app}")
        if char.get('visual_keywords'):
            vk = char['visual_keywords']
            if isinstance(vk, list):
                vk = ", ".join(vk)
            parts.append(f"  Visual Keywords: {vk}")
        if char.get('description'):
            parts.append(f"  Description: {char['description']}")
            
        lines.append("\n".join(parts))
    
    return "\n\n".join(lines)


def format_constraints(constraints: List[str]) -> str:
    """
    제약 조건 리스트를 프롬프트용 문자열로 포맷
    
    Args:
        constraints: 제약 조건 리스트
        
    Returns:
        포맷된 문자열
    """
    if not constraints:
        return "None"
    return "\n".join(f"- {c}" for c in constraints)
