# 🔧 기술 구현 상세 가이드

> Phase 1-2 구현을 위한 구체적인 코드 패턴 및 템플릿

## 📁 파일 구조 변경 사항

### Before (현재)

```
backend/app/services/ai/
├── __init__.py
├── base.py
├── text/
│   ├── character.py    ← 인라인 프롬프트
│   ├── episode.py      ← 일부만 시스템 프롬프트
│   ├── style.py        ← 인라인 프롬프트
│   └── worldview.py    ← 인라인 프롬프트
└── generation/
    ├── image_service.py
    └── panel_service.py  ← 시스템 프롬프트 있음
```

### After (목표)

```
backend/app/services/ai/
├── __init__.py
├── base.py
├── prompts/                       ← NEW
│   ├── __init__.py
│   ├── base.py                   ← 공통 유틸리티
│   ├── constants.py              ← Enum 동적 주입
│   ├── language.py               ← 언어별 지시문
│   ├── genre.py                  ← 장르별 수정자
│   ├── character.py              ← 캐릭터 시스템 프롬프트
│   ├── episode.py                ← 에피소드 시스템 프롬프트
│   ├── style.py                  ← 스타일 시스템 프롬프트
│   ├── worldview.py              ← 세계관 시스템 프롬프트
│   └── image.py                  ← 이미지 생성 프롬프트
├── text/
│   ├── character.py    ← prompts 모듈 import
│   ├── episode.py      ← prompts 모듈 import
│   ├── style.py        ← prompts 모듈 import
│   └── worldview.py    ← prompts 모듈 import
└── generation/
    ├── image_service.py
    └── panel_service.py  ← prompts 모듈 import

backend/app/schemas/
├── __init__.py
├── ai_responses/                  ← NEW
│   ├── __init__.py
│   ├── character.py              ← 캐릭터 응답 스키마
│   ├── episode.py                ← 에피소드 응답 스키마
│   ├── style.py                  ← 스타일 응답 스키마
│   └── worldview.py              ← 세계관 응답 스키마
```

---

## 🔑 핵심 패턴 #1: response_schema 적용

### 변경 전 (현재 코드)

```python
# text/character.py - 현재 방식
response = self.client.models.generate_content(
    model=self.model_config["worldview"],
    contents=prompt,
    config=types.GenerateContentConfig(
        response_mime_type="application/json"
        # ← 구조 강제 없음!
    )
)
cleaned_text = self._clean_json_text(response.text)
return json.loads(cleaned_text)  # ← 파싱 실패 가능
```

### 변경 후 (권장 방식)

```python
# schemas/ai_responses/character.py
from pydantic import BaseModel
from typing import List, Optional

class CharacterStats(BaseModel):
    strength: int
    intelligence: int
    charisma: int
    luck: int
    empathy: int
    leadership: int

class CharacterSuggestion(BaseModel):
    name: str
    age: str
    role: str
    recommended_role: str  # Enum에서 동적 주입
    visual_keywords: List[str]
    personality: str
    personality_tags: List[str]
    theme_color: str
    bio: str
    stats: CharacterStats

class CharacterBatchResponse(BaseModel):
    suggestions: List[CharacterSuggestion]
```

```python
# text/character.py - 개선된 방식
from app.schemas.ai_responses.character import CharacterBatchResponse

response = self.client.models.generate_content(
    model=self.model_config["worldview"],
    contents=prompt,
    config=types.GenerateContentConfig(
        system_instruction=CHARACTER_SYSTEM_PROMPT,
        response_mime_type="application/json",
        response_schema=CharacterBatchResponse.model_json_schema()
        # ↑ 스키마 레벨에서 구조 강제!
    )
)
# 파싱이 보장됨
return CharacterBatchResponse.model_validate_json(response.text)
```

---

## 🔑 핵심 패턴 #2: Enum 동적 주입

### 변경 전 (하드코딩)

```python
# 04-prompt-templates.md 현재 방식
prompt = """
Return ONLY a JSON object:
{
    "recommended_role": "protagonist|antagonist|second_lead|scene_stealer"
}
"""
# ← 백엔드 Enum 변경 시 프롬프트와 불일치!
```

### 변경 후 (동적 주입)

```python
# prompts/constants.py
from enum import Enum
from typing import Type

class CharacterRole(str, Enum):
    PROTAGONIST = "protagonist"
    ANTAGONIST = "antagonist"
    SECOND_LEAD = "second_lead"
    SCENE_STEALER = "scene_stealer"
    # 새 역할 추가 시 여기만 수정하면 자동 반영

class PersonalityTag(str, Enum):
    CHEERFUL = "Cheerful"
    SERIOUS = "Serious"
    COLD = "Cold"
    TSUNDERE = "Tsundere"
    MYSTERIOUS = "Mysterious"
    MELANCHOLIC = "Melancholic"
    PURE = "Pure"
    MADNESS = "Madness"

def enum_to_prompt_options(enum_class: Type[Enum]) -> str:
    """Enum을 프롬프트용 옵션 문자열로 변환"""
    return "|".join([e.value for e in enum_class])

def enum_to_prompt_list(enum_class: Type[Enum]) -> str:
    """Enum을 프롬프트용 리스트 문자열로 변환"""
    return ", ".join([f'"{e.value}"' for e in enum_class])
```

```python
# 프롬프트 템플릿에서 사용
from app.services.ai.prompts.constants import (
    CharacterRole, PersonalityTag,
    enum_to_prompt_options, enum_to_prompt_list
)

prompt = f"""
## Required Fields for Each Character
- recommended_role: One of [{enum_to_prompt_options(CharacterRole)}]
- personality_tags: 1-3 from [{enum_to_prompt_list(PersonalityTag)}]
"""
```

---

## 🔑 핵심 패턴 #3: 장르 충돌 해결

### 현재 문제

```python
# 단순 연결 - 충돌 발생
modifiers = []
for genre in genres:
    modifiers.append(GENRE_MODIFIERS[genre])
return "\n\n".join(modifiers)  # ← Romance + Thriller 충돌!
```

### 해결 방안

```python
# prompts/genre.py
from typing import List, Optional

GENRE_MODIFIERS = {
    "fantasy": {
        "priority": 1,
        "pacing": "fast",
        "emphasis": "action_and_world",
        "content": """## Genre Focus: Fantasy
- Power systems should have clear rules and limitations...
"""
    },
    "romance": {
        "priority": 2,
        "pacing": "slow",
        "emphasis": "emotion_and_chemistry",
        "content": """## Genre Focus: Romance
- Emotional beats are paramount...
"""
    },
    "thriller": {
        "priority": 1,
        "pacing": "varied",
        "emphasis": "tension_and_mystery",
        "content": """## Genre Focus: Thriller
- Information control is everything...
"""
    }
}

CONFLICT_RESOLUTION = {
    ("romance", "thriller"): """
## Genre Fusion: Romance-Thriller
- Primary: Build romantic tension within suspenseful narrative
- Conflict Resolution: Thriller pacing takes precedence for plot beats,
  but allocate 2-3 panels per chapter for pure romantic moments
- Style: Keep romantic scenes intimate but always with underlying tension
""",
    ("fantasy", "romance"): """
## Genre Fusion: Fantasy-Romance
- Primary: Use fantasy world-building to enable unique romantic dynamics
- Conflict Resolution: Fantasy world rules create obstacles for romance
- Style: Epic scope with intimate character moments
"""
}

def get_genre_modifier(
    genres: List[str],
    primary_genre: Optional[str] = None
) -> str:
    """장르 수정자 반환 (충돌 해결 포함)"""
    if not genres:
        return ""

    # 정규화
    genres_lower = [g.lower() for g in genres]

    # 단일 장르
    if len(genres_lower) == 1:
        genre = genres_lower[0]
        if genre in GENRE_MODIFIERS:
            return GENRE_MODIFIERS[genre]["content"]
        return ""

    # 복합 장르 - 충돌 해결 규칙 확인
    genre_pair = tuple(sorted(genres_lower[:2]))
    if genre_pair in CONFLICT_RESOLUTION:
        return CONFLICT_RESOLUTION[genre_pair]

    # 기본: Primary genre 우선
    primary = primary_genre or genres_lower[0]
    secondary = genres_lower[1] if len(genres_lower) > 1 else None

    result = []
    if primary in GENRE_MODIFIERS:
        result.append(GENRE_MODIFIERS[primary]["content"])

    if secondary and secondary in GENRE_MODIFIERS:
        result.append(f"""
## Secondary Genre: {secondary.title()}
(Apply these elements where they don't conflict with {primary} priorities)
{GENRE_MODIFIERS[secondary]["content"]}
""")

    return "\n".join(result)
```

---

## 🔑 핵심 패턴 #4: 개선된 한국어 지시문

```python
# prompts/language.py

KOREAN_INSTRUCTION_DETAILED = """
## Language: Korean (한국어)

### 1. 기본 규칙
- All output text MUST be in Korean Hangul (한글).
- Use natural Korean expressions - avoid translated-sounding text.

### 2. 이름 규칙
- 성+이름 형식 (예: 김수현, 박지민, 이하늘)
- 2-4 음절 권장
- 캐릭터 성격과 어울리는 의미/운율 고려
- 외국 캐릭터는 한글 음역 (예: 알렉스 → 알렉스)

### 3. 대사 규칙
- **말풍선 길이 제한**: 한 버블당 최대 15-20자
- **존댓말('~요'/~습니다') vs 반말('~다'/~해)**:
  - 연상, 선생님, 처음 만난 사이 → 존댓말
  - 친구, 연하, 친밀한 관계 → 반말
  - 캐릭터 개성 반영 (까칠한 캐릭터는 반말 선호 등)
- **호칭 사용**:
  - 형/오빠/누나/언니 - 나이/친밀도 기반
  - 선배/후배 - 학교/직장 맥락
  - ~씨 - 공식적/거리감

### 4. 웹툰 특화 표현
- **의성어/의태어**: 쾅!, 두근두근, 휘청~, 번쩍!, 울컥
- **감정 강조**: ㅋㅋㅋ, ㅠㅠ, ;;, ㄷㄷ (캐릭터/상황에 맞게)
- **말줄임**: ..., 흐으음, 아니 그게...

### 5. 피해야 할 것
- 번역투 문장 (영어 직역체)
- 과도한 Konglish (캐릭터 특성이 아닌 경우)
- 너무 격식체인 묘사 (웹툰은 visual-first)
"""

ENGLISH_INSTRUCTION_DETAILED = """
## Language: English

### 1. General Rules
- All output text should be in natural, fluent English.
- Avoid overly formal or academic language unless character calls for it.

### 2. Naming Conventions
- Creative but pronounceable names
- Consider the story's cultural setting
- Avoid overly complicated spellings

### 3. Dialogue Rules
- **Speech Bubble Length**: Keep concise, 10-15 words max per bubble
- Vary vocabulary and sentence structure
- Consider character education level and background
- Use contractions naturally (I'm, don't, we'll)

### 4. Style Notes
- Show emotion through word choice and rhythm
- Match dialogue formality to relationships
- Use slang/colloquialisms appropriately by character
"""

def get_language_instruction(language: str) -> str:
    """언어별 상세 지시문 반환"""
    if language.startswith('ko'):
        return KOREAN_INSTRUCTION_DETAILED
    elif language.startswith('ja'):
        return JAPANESE_INSTRUCTION_DETAILED
    else:
        return ENGLISH_INSTRUCTION_DETAILED
```

---

## 🔑 핵심 패턴 #5: 시스템 프롬프트 적용

### 적용 예시: CharacterAIService

```python
# text/character.py - 개선된 구현

from google.genai import types
import json
from typing import List, Optional

from app.services.ai.base import BaseAIService
from app.services.ai.prompts import (
    CHARACTER_SYSTEM_PROMPT,
    get_language_instruction,
    get_genre_modifier,
)
from app.services.ai.prompts.constants import (
    CharacterRole,
    PersonalityTag,
    enum_to_prompt_options,
    enum_to_prompt_list,
)
from app.schemas.ai_responses.character import CharacterBatchResponse


class CharacterAIService(BaseAIService):
    """캐릭터 관련 AI 기능"""

    def generate_character_batch_suggestions(
        self,
        project_context: str,
        genres: List[str] = None,
        count: int = 10,
        language: str = "en",
        include_protagonist: bool = False
    ) -> CharacterBatchResponse:
        """배치 캐릭터 제안 생성 - 개선된 버전"""
        self._ensure_client()

        # 장르별 수정자 (충돌 해결 로직 포함)
        genre_modifier = get_genre_modifier(genres) if genres else ""

        # 프롬프트 구성
        protagonist_instruction = """
IMPORTANT: The FIRST character in the list MUST be a compelling Protagonist.
""" if include_protagonist else "These are potential additional cast members."

        prompt = f"""
Create {count} distinct, interesting character concepts for this webtoon project.

## Project Context
{project_context}

{genre_modifier}

## Instructions
{protagonist_instruction}
- Characters should vary in age, role, personality, and appearance.
- Each character must fill a unique narrative role.

{get_language_instruction(language)}

## Required Fields for Each Character
- name: Character name
- age: Age (e.g. "19", "Early 20s")
- role: Role title in the story
- recommended_role: One of [{enum_to_prompt_options(CharacterRole)}]
- visual_keywords: List of 3-5 visual appearance tags
- personality: Short personality summary
- personality_tags: 1-3 from [{enum_to_prompt_list(PersonalityTag)}]
- theme_color: Hex color code
- bio: Brief background (2-3 sentences)
- stats: Object with strength, intelligence, charisma, luck, empathy, leadership (0-100)
"""

        try:
            response = self.client.models.generate_content(
                model=self.model_config["worldview"],
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=CHARACTER_SYSTEM_PROMPT,
                    response_mime_type="application/json",
                    response_schema=CharacterBatchResponse.model_json_schema()
                )
            )
            return CharacterBatchResponse.model_validate_json(response.text)
        except Exception as e:
            self.logger.error(f"Batch Suggestion Error: {e}")
            raise
```

---

## 📊 테스트 체크포인트

각 Phase 완료 후 확인:

### Phase 1 완료 체크

- [ ] `prompts/` 디렉토리 구조 생성됨
- [ ] `response_schema` 적용된 스키마 최소 1개 동작 확인
- [ ] Enum 동적 주입 헬퍼 함수 테스트

### Phase 2 완료 체크

- [ ] 모든 시스템 프롬프트 파일 생성됨
- [ ] `character.py` 4개 함수 모두 시스템 프롬프트 적용
- [ ] `episode.py` 4개 함수 모두 시스템 프롬프트 적용
- [ ] 스타일, 세계관 서비스 적용

### Phase 3 완료 체크

- [ ] 복합 장르 (Fantasy+Romance) 테스트 통과
- [ ] 한국어 캐릭터 생성 시 이름/대사 품질 개선 확인
- [ ] 영어 출력 품질 유지 확인

---

_Next: [03-testing-strategy.md](./03-testing-strategy.md)_
