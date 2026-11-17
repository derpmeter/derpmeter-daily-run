> Model: Claude Opus 4.5

# 🔧 구현 가이드

> 시스템 프롬프트 적용을 위한 기술적 구현 방안

## 📁 권장 디렉토리 구조

```
backend/app/services/ai/
├── __init__.py              # AIService Facade
├── base.py                  # BaseAIService
├── prompts/                 # [NEW] 프롬프트 중앙 관리
│   ├── __init__.py
│   ├── base.py              # 공통 유틸리티
│   ├── character.py         # 캐릭터 시스템 프롬프트
│   ├── episode.py           # 에피소드 시스템 프롬프트
│   ├── style.py             # 스타일 시스템 프롬프트
│   ├── worldview.py         # 세계관 시스템 프롬프트
│   └── image.py             # 이미지 생성 프롬프트
├── text/
│   ├── character.py
│   ├── episode.py
│   ├── style.py
│   └── worldview.py
└── generation/
    ├── image_service.py
    └── panel_service.py
```

---

## 🛠️ 구현 단계

### Step 1: 프롬프트 모듈 생성

#### `prompts/__init__.py`

```python
"""
AI Service System Prompts - 중앙화된 프롬프트 관리
"""

from .character import CHARACTER_SYSTEM_PROMPT
from .episode import EPISODE_SYSTEM_PROMPT
from .worldview import WORLDVIEW_SYSTEM_PROMPT
from .style import STYLE_SYSTEM_PROMPT
from .image import PANEL_IMAGE_SYSTEM_PROMPT
from .base import get_language_instruction, build_standard_prompt

__all__ = [
    "CHARACTER_SYSTEM_PROMPT",
    "EPISODE_SYSTEM_PROMPT",
    "WORLDVIEW_SYSTEM_PROMPT",
    "STYLE_SYSTEM_PROMPT",
    "PANEL_IMAGE_SYSTEM_PROMPT",
    "get_language_instruction",
    "build_standard_prompt",
]
```

#### `prompts/base.py`

```python
"""
공통 프롬프트 유틸리티
"""
import json
from typing import Dict, List, Any, Optional


def get_language_instruction(language: str) -> str:
    """
    언어별 표준 지시문 반환

    Args:
        language: 언어 코드 (예: "ko", "en", "ja")

    Returns:
        해당 언어에 맞는 상세 지시문
    """
    if language.startswith('ko'):
        return """
## Language: Korean (한국어)
- All output text (names, descriptions, dialogues) MUST be in Korean Hangul.
- Use natural Korean expressions, not translated-sounding text.
- Names should follow Korean naming conventions (성+이름, typically 2-4 syllables).
- Use appropriate speech levels (존댓말/반말) based on character relationships and context.
- For dialogue: use natural colloquial Korean, not formal written style.
- Avoid Konglish unless it's a character trait or modern slang usage.
"""
    elif language.startswith('ja'):
        return """
## Language: Japanese (日本語)
- All output text MUST be in Japanese.
- Use appropriate honorifics (さん、くん、様) based on character relationships.
- Names should follow Japanese naming conventions (姓+名).
- Consider keigo levels for formal/informal situations.
"""
    else:  # Default to English
        return """
## Language: English
- All output text should be in natural, fluent English.
- Names can be creative but should be pronounceable.
- Use varied sentence structures to avoid monotony.
- Dialogue should feel natural and character-appropriate.
"""


def build_standard_prompt(
    task_description: str,
    context: Dict[str, Any],
    constraints: List[str],
    output_format: Dict[str, Any],
    language: str = "en"
) -> str:
    """
    표준화된 프롬프트 빌더

    Args:
        task_description: 작업 설명
        context: 컨텍스트 딕셔너리 (프로젝트 정보, 캐릭터 정보 등)
        constraints: 제약 조건 리스트
        output_format: 출력 JSON 형식 정의
        language: 출력 언어

    Returns:
        완성된 프롬프트 문자열
    """
    # Context formatting
    context_lines = []
    for key, value in context.items():
        if isinstance(value, list):
            value = ", ".join(str(v) for v in value)
        elif isinstance(value, dict):
            value = json.dumps(value, ensure_ascii=False, indent=2)
        context_lines.append(f"- {key}: {value}")
    context_str = "\n".join(context_lines) if context_lines else "None"

    # Constraints formatting
    constraints_str = "\n".join(f"- {c}" for c in constraints) if constraints else "None"

    prompt = f"""
## Task
{task_description}

## Context
{context_str}

## Constraints
{constraints_str}

{get_language_instruction(language)}

## Output Format
Return ONLY a valid JSON object with this exact structure (no markdown code blocks):
{json.dumps(output_format, indent=2, ensure_ascii=False)}
"""
    return prompt.strip()


def format_character_list(characters: List[Dict]) -> str:
    """캐릭터 목록을 프롬프트용 문자열로 포맷"""
    if not characters:
        return "None specified"

    lines = []
    for char in characters:
        parts = [f"- Name: {char.get('name', 'Unknown')}"]
        if char.get('id'):
            parts.append(f"  ID: {char['id']}")
        if char.get('personality'):
            parts.append(f"  Personality: {char['personality']}")
        if char.get('appearance'):
            app = char['appearance']
            if isinstance(app, list):
                app = ", ".join(app)
            parts.append(f"  Appearance: {app}")
        if char.get('description'):
            parts.append(f"  Description: {char['description']}")
        lines.append("\n".join(parts))

    return "\n\n".join(lines)


def format_worldview(worldview: Dict) -> str:
    """세계관 정보를 프롬프트용 문자열로 포맷"""
    if not worldview:
        return "Not specified"

    return "\n".join(f"- {k}: {v}" for k, v in worldview.items())
```

---

### Step 2: 기존 서비스에 시스템 프롬프트 적용

#### 수정 예시: `text/character.py`

```python
"""
Character AI Service - 캐릭터 생성 및 분석
"""
from google.genai import types
import json
from typing import List, Optional

from app.services.ai.base import BaseAIService
from app.services.ai.prompts import (
    CHARACTER_SYSTEM_PROMPT,
    get_language_instruction,
)


class CharacterAIService(BaseAIService):
    """캐릭터 관련 AI 기능"""

    def generate_character_batch_suggestions(
        self,
        project_context: str,
        count: int = 10,
        language: str = "en",
        include_protagonist: bool = False
    ) -> dict:
        """배치 캐릭터 제안 생성"""
        self._ensure_client()

        # 프롬프트 구성
        if include_protagonist:
            protagonist_instruction = """
IMPORTANT: The FIRST character in the list MUST be a compelling Protagonist.
Design a main character who:
- Has clear motivations and goals tied to the worldview
- Has relatable personality traits with both strengths and flaws
- Serves as the central figure of the story
The remaining characters should be diverse supporting cast members.
"""
        else:
            protagonist_instruction = "These are potential additional cast members (protagonist already exists)."

        prompt = f"""
Create {count} distinct, interesting character concepts for this webtoon project.

## Project Context
{project_context}

## Instructions
{protagonist_instruction}
- Characters should vary in age, role, personality, and appearance.
- Each character must fill a unique narrative niche.

{get_language_instruction(language)}

## Required Fields for Each Character
- name: Character name
- age: Age (e.g. "19", "Early 20s")
- role: Role title in the story (e.g. "Rival", "Best Friend")
- recommended_role: One of ["protagonist", "antagonist", "second_lead", "scene_stealer"]
- visual_keywords: List of 3-5 visual appearance tags
- personality: Short personality summary (1-2 sentences)
- personality_tags: 1-3 from ["Cheerful", "Serious", "Cold", "Tsundere", "Mysterious", "Melancholic", "Pure", "Madness"]
- theme_color: Hex color code (e.g. "#ef4444")
- bio: Brief background (2-3 sentences)
- stats: Object with strength, intelligence, charisma, luck, empathy, leadership (0-100 each)

Return ONLY a JSON object:
{{
    "suggestions": [...]
}}
"""

        try:
            response = self.client.models.generate_content(
                model=self.model_config["worldview"],
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=CHARACTER_SYSTEM_PROMPT,  # ← 시스템 프롬프트 적용
                    response_mime_type="application/json"
                )
            )
            cleaned_text = self._clean_json_text(response.text)
            return json.loads(cleaned_text)
        except Exception as e:
            print(f"Batch Suggestion Error: {e}")
            raise e
```

---

### Step 3: 장르별 프롬프트 변형 지원

```python
# prompts/genre.py

GENRE_MODIFIERS = {
    "fantasy": """
## Genre Focus: Fantasy
- Power systems should have clear rules and limitations
- World-building should feel immersive but not overwhelming
- Balance magic/adventure with character moments
- Consider classic tropes but add fresh twists
""",

    "romance": """
## Genre Focus: Romance
- Emotional beats are paramount - readers want to feel butterflies
- "Slow burn" tension should build gradually
- Supporting characters should aid the ship, not distract
- Consider reader demographics (age, preferences)
""",

    "action": """
## Genre Focus: Action
- Fight choreography must be readable in vertical scroll
- Power scaling needs to be consistent and fair
- Stakes should escalate progressively
- Cool moments > realistic physics
""",

    "thriller": """
## Genre Focus: Thriller
- Information control is everything
- Red herrings should be fair (clues hidden in plain sight)
- Tension curves need valleys, not just peaks
- Protagonist vulnerability creates investment
""",

    "comedy": """
## Genre Focus: Comedy
- Timing is visual in webtoons - panel size matters
- Running gags should evolve, not just repeat
- Character-based humor > situation-based humor
- Allow serious moments to make comedy hit harder
"""
}


def get_genre_modifier(genres: List[str]) -> str:
    """장르에 맞는 프롬프트 수정자 반환"""
    modifiers = []
    for genre in genres:
        genre_lower = genre.lower()
        if genre_lower in GENRE_MODIFIERS:
            modifiers.append(GENRE_MODIFIERS[genre_lower])

    return "\n\n".join(modifiers) if modifiers else ""
```

---

## 📊 적용 체크리스트

| 서비스    | 함수                                   | 시스템 프롬프트 | 언어 지시 | 장르 지원 |
| --------- | -------------------------------------- | --------------- | --------- | --------- |
| Character | `augment_character_text`               | ⬜              | ⬜        | ⬜        |
| Character | `get_character_suggestion`             | ⬜              | ⬜        | ⬜        |
| Character | `generate_character_batch_suggestions` | ⬜              | ⬜        | ⬜        |
| Character | `analyze_character_concept`            | ⬜              | ⬜        | ⬜        |
| Episode   | `generate_direction_options`           | ⬜              | ⬜        | ⬜        |
| Episode   | `generate_episode_ideas`               | ⬜              | ⬜        | ⬜        |
| Episode   | `generate_prologue_ideas`              | ✅              | ⬜        | ⬜        |
| Episode   | `generate_initial_cuts`                | ⬜              | ⬜        | ⬜        |
| Style     | `recommend_style`                      | ⬜              | ⬜        | ⬜        |
| Style     | `augment_style_description`            | ⬜              | ⬜        | ⬜        |
| Worldview | `augment_worldview`                    | ⬜              | ⬜        | ⬜        |
| Panel     | `generate_panel_image`                 | ✅              | ⬜        | N/A       |

---

## 🧪 테스트 전략

### A/B 테스트 프레임워크

```python
# prompts/ab_testing.py

import random
from typing import Dict, Any


class PromptVariant:
    """프롬프트 변형 관리"""

    def __init__(self, name: str, prompt: str, weight: float = 0.5):
        self.name = name
        self.prompt = prompt
        self.weight = weight


class PromptABTest:
    """A/B 테스트 매니저"""

    def __init__(self, variants: list[PromptVariant]):
        self.variants = variants
        self._normalize_weights()

    def _normalize_weights(self):
        total = sum(v.weight for v in self.variants)
        for v in self.variants:
            v.weight /= total

    def select_variant(self, user_id: str = None) -> PromptVariant:
        """
        변형 선택 (user_id가 주어지면 일관된 선택, 없으면 랜덤)
        """
        if user_id:
            # 사용자별 일관된 변형 선택 (해시 기반)
            hash_val = hash(user_id) % 100 / 100
            cumulative = 0
            for v in self.variants:
                cumulative += v.weight
                if hash_val < cumulative:
                    return v

        # 랜덤 선택
        return random.choices(
            self.variants,
            weights=[v.weight for v in self.variants]
        )[0]
```

### 품질 평가 메트릭

1. **일관성 점수**: 동일 입력에 대한 출력 변동성
2. **완성도 점수**: 요청된 모든 필드 포함 여부
3. **언어 품질**: 자연스러움, 문법 오류
4. **창의성 점수**: 독창성, 클리셰 회피
5. **적합성 점수**: 컨텍스트와의 부합도

---

_다음 문서: [04-prompt-templates.md](./04-prompt-templates.md)_
