# 🎨 Toonify AI 프롬프트 가이드

> AI 서비스 시스템 프롬프트 설정 및 개선 방안

## ✅ 구현 완료 (2025-12-28)

프롬프트 개선 작업이 완료되었습니다. 아래의 새로운 프롬프트 인프라가 적용되었습니다.

### 🆕 적용된 변경 사항

| 항목            | 상태 | 설명                                        |
| --------------- | ---- | ------------------------------------------- |
| 시스템 프롬프트 | ✅   | 모든 AI 서비스에 전문가 페르소나 적용       |
| 언어 지시문     | ✅   | 한국어 웹툰 특화 (말풍선 길이, 존댓말/반말) |
| 동적 Enum 주입  | ✅   | 하드코딩 제거, 코드-프롬프트 동기화         |
| 장르 수정자     | ✅   | 8개 장르 + 6개 복합장르 충돌 해결           |
| 구조화 로깅     | ✅   | print() → logger 전환                       |
| 응답 스키마     | 🟡   | Pydantic 모델 정의 완료, 선택적 적용        |

---

## 📁 프롬프트 구조

### 소스 코드 (`backend/app/services/ai/prompts/`)

```
prompts/
├── __init__.py          # 중앙 export
├── base.py              # 언어 지시문, 컨텍스트 포맷팅
├── constants.py         # Enum 정의 (CharacterRole, PanelType 등)
├── character.py         # 캐릭터 시스템 프롬프트
├── episode.py           # 에피소드 시스템 프롬프트
├── worldview.py         # 세계관 시스템 프롬프트
├── style.py             # 스타일 시스템 프롬프트
├── image.py             # 이미지 생성 시스템 프롬프트
└── genre.py             # 장르별 수정자 및 충돌 해결
```

### 응답 스키마 (`backend/app/schemas/ai_responses/`)

```
ai_responses/
├── __init__.py          # 중앙 export
├── character.py         # CharacterSuggestion, CharacterBatchResponse 등
├── episode.py           # EpisodeIdea, CutsGenerationResponse 등
├── worldview.py         # WorldviewOption, WorldviewAugmentResponse
└── style.py             # StyleRecommendation, StyleAugmentResponse
```

---

## 🔧 사용 예시

### 기본 사용법

```python
from app.services.ai.prompts import (
    CHARACTER_SYSTEM_PROMPT,
    get_language_instruction,
    get_genre_modifier,
    CharacterRole,
    enum_to_prompt_options,
)

# 시스템 프롬프트 적용
config = types.GenerateContentConfig(
    system_instruction=CHARACTER_SYSTEM_PROMPT,
    response_mime_type="application/json"
)

# 언어별 지시문
lang_instruction = get_language_instruction("ko")  # 한국어 웹툰 특화 지시

# 장르 수정자 (복합 장르 충돌 해결 포함)
genre_modifier = get_genre_modifier(["fantasy", "romance"])

# 동적 Enum 주입
role_options = enum_to_prompt_options(CharacterRole)
# -> "protagonist|antagonist|second_lead|scene_stealer"
```

### response_schema 사용법 (선택적)

```python
from app.schemas.ai_responses import CharacterBatchResponse

config = types.GenerateContentConfig(
    system_instruction=CHARACTER_SYSTEM_PROMPT,
    response_mime_type="application/json",
    response_schema=CharacterBatchResponse.model_json_schema()
)
```

---

## 📁 문서 구조

```
docs/ai-prompts/
├── README.md                              # 이 파일
├── 01-draft/                              # Claude Opus 4.5 초안 문서
│   ├── 01-current-analysis.md             # 현재 프롬프트 분석
│   ├── 02-system-prompts.md               # 권장 시스템 프롬프트
│   ├── 03-implementation-guide.md         # 구현 가이드
│   └── 04-prompt-templates.md             # 프롬프트 템플릿
├── 02-draft-review/                       # AI 리뷰 문서
│   ├── 01-review-gemini-3-pro.md          # Gemini 3 Pro 리뷰
│   └── 02-review-claude-opus-4-5.md       # Claude Opus 4.5 리뷰
└── 03-execution-plans/                    # 실행 계획 문서
    ├── 01-implementation-checklist.md     # 구현 체크리스트 ✅
    └── 02-technical-implementation.md     # 기술 구현 상세
```

---

## 📊 AI 서비스 적용 현황

| 서비스             | 시스템 프롬프트 | 언어 지시 | 동적 Enum | 장르 수정자 |
| ------------------ | --------------- | --------- | --------- | ----------- |
| CharacterAIService | ✅              | ✅        | ✅        | -           |
| EpisodeAIService   | ✅              | ✅        | ✅        | -           |
| StyleAIService     | ✅              | ✅        | -         | -           |
| WorldviewAIService | ✅              | ✅        | -         | ✅          |
| PanelAIService     | ✅              | -         | -         | -           |
| ImageAIService     | -               | -         | -         | -           |

---

## 🎯 설계 원칙

1. **일관성 확보**: 모든 AI 기능에 표준화된 시스템 프롬프트 적용
2. **품질 향상**: 웹툰 업계 전문성이 반영된 프롬프트 설계
3. **유지보수성**: 중앙화된 프롬프트 관리로 쉬운 개선
4. **다국어 지원**: 한국어/영어/일본어 일관된 언어 지시 체계
5. **동적 동기화**: Enum 값을 프롬프트에 동적 주입하여 불일치 방지

---

## 🔗 관련 문서

- [AI 모델 설정](../AI_MODELS.md)
- [캐릭터 일관성 솔루션](../character-consistency-solution-ko.md)
- [개발자 가이드](../DEVELOPER_GUIDE.md)

---

_Last Updated: 2025-12-28_
