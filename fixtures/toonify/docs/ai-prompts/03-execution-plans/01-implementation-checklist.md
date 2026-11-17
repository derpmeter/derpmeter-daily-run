# 📋 AI 프롬프트 개선 실행 계획

> 01-draft 문서 및 02-draft-review 피드백을 종합한 구체적 구현 체크리스트

## 📊 개요

| 항목           | 상태                                           |
| -------------- | ---------------------------------------------- |
| 총 Phase       | 5                                              |
| 예상 소요 시간 | 3-5일                                          |
| 우선순위 기준  | 리뷰어 피드백 (Gemini 3 Pro + Claude Opus 4.5) |

---

## 🚨 Phase 1: Critical - 기반 인프라 구축 (Day 1) ✅ COMPLETED

### 1.1 프롬프트 모듈 디렉토리 생성

- [x] `backend/app/services/ai/prompts/` 디렉토리 생성
- [x] `__init__.py` - 중앙 export
- [x] `base.py` - 공통 유틸리티

### 1.2 response_schema 패턴 표준화 (Critical Issue #1)

> 리뷰 피드백: 텍스트 기반 JSON 지시보다 **Pydantic 모델 + response_schema** 필수

- [x] `backend/app/schemas/ai_responses/` 디렉토리 생성
- [x] 캐릭터 응답 스키마 정의
  - [x] `CharacterSuggestion` 모델
  - [x] `CharacterBatchResponse` 모델
  - [x] `CharacterAnalysisResponse` 모델
- [x] 에피소드 응답 스키마 정의
  - [x] `EpisodeIdea` 모델
  - [x] `CutsGenerationResponse` 모델
  - [x] `DirectionOptionsResponse` 모델
- [x] 세계관 응답 스키마 정의
  - [x] `WorldviewOption` 모델
  - [x] `WorldviewAugmentResponse` 모델
- [x] 스타일 응답 스키마 정의
  - [x] `StyleRecommendation` 모델
  - [x] `StyleAugmentResponse` 모델

### 1.3 Enum 동적 주입 패턴 (Critical Issue #3)

> 리뷰 피드백: 하드코딩된 `protagonist|antagonist|...` 제거

- [x] `prompts/constants.py` 생성
- [x] Enum 정의 및 통합
  - [x] `CharacterRole` enum
  - [x] `PanelType` enum
  - [x] `PersonalityTag` enum
  - [x] `DialogueType` enum
  - [x] `TimeOfDay` enum
- [x] `enum_to_prompt_options()` 헬퍼 함수 구현
- [x] `enum_to_prompt_list()` 헬퍼 함수 구현
- [x] `get_role_descriptions_prompt()` 역할 설명 함수 구현

---

## ⚡ Phase 2: High Priority - 시스템 프롬프트 구현 (Day 2) ✅ COMPLETED

### 2.1 캐릭터 시스템 프롬프트

- [x] `prompts/character.py` 생성
- [x] `CHARACTER_SYSTEM_PROMPT` 상수 정의
- [x] 적용 대상 함수: (Phase 4에서 완료)
  - [x] `augment_character_text()` - 시스템 프롬프트 추가
  - [x] `get_character_suggestion()` - 시스템 프롬프트 추가
  - [x] `generate_character_batch_suggestions()` - 시스템 프롬프트 추가
  - [x] `analyze_character_concept()` - 시스템 프롬프트 추가

### 2.2 에피소드 시스템 프롬프트

- [x] `prompts/episode.py` 생성
- [x] `EPISODE_SYSTEM_PROMPT` 상수 정의
- [x] 적용 대상 함수: (Phase 4에서 완료)
  - [x] `generate_direction_options()` - 시스템 프롬프트 추가
  - [x] `generate_episode_ideas()` - 시스템 프롬프트 추가
  - [x] `generate_prologue_ideas()` - 시스템 프롬프트 업그레이드
  - [x] `generate_initial_cuts()` - 시스템 프롬프트 추가

### 2.3 세계관 시스템 프롬프트

- [x] `prompts/worldview.py` 생성
- [x] `WORLDVIEW_SYSTEM_PROMPT` 상수 정의
- [x] 적용 대상 함수: (Phase 4에서 완료)
  - [x] `augment_worldview()` - 시스템 프롬프트 추가

### 2.4 스타일 시스템 프롬프트

- [x] `prompts/style.py` 생성
- [x] `STYLE_SYSTEM_PROMPT` 상수 정의
- [x] 적용 대상 함수: (Phase 4에서 완료)
  - [x] `recommend_style()` - 시스템 프롬프트 추가
  - [x] `augment_style_description()` - 시스템 프롬프트 추가

### 2.5 패널 이미지 시스템 프롬프트 (개선)

- [x] `prompts/image.py` 생성
- [x] `PANEL_IMAGE_SYSTEM_PROMPT` 상수 개선
- [x] **Multimodal Input Priority Rules** 섹션 추가 (Major Issue #4)
  - [x] 이미지 우선순위: style ref vs character ref
  - [x] 스타일 불일치 시 대응 전략
  - [x] 저품질 참조 이미지 fallback

---

## 🧩 Phase 3: Logic Improvements - 장르 및 언어 처리 (Day 3)

### 3.1 장르 충돌 해결 전략 (Critical Issue #2)

- [x] `prompts/genre.py` 생성
- [x] `GENRE_MODIFIERS` 딕셔너리 정의
- [x] **Primary/Secondary Genre 로직 구현**
  - [x] `get_genre_modifier(genres: List[str], primary_genre: str)` 함수
  - [x] 충돌 해결 메타 프롬프트 추가 (`CONFLICT_RESOLUTION`)
- [x] 충돌 시나리오 정의 완료:
  - [x] Romance + Thriller
  - [x] Fantasy + Romance
  - [x] Action + Comedy
  - [x] Thriller + Horror
  - [x] Romance + Comedy
  - [x] Fantasy + Action

### 3.2 언어 지시문 개선 (Minor Issue #6)

> 리뷰 피드백: 한국어 지시문이 피상적

- [x] `prompts/base.py`에 언어 지시문 통합 (별도 파일 불필요)
- [x] 개선된 `get_language_instruction()` 구현
- [x] **한국 웹툰 특화 지시 추가:**
  - [x] 말풍선 텍스트 길이 제한 (버블당 ~15-20자)
  - [x] 존댓말('~요') vs 반말('~다') 선택 기준
  - [x] 의성어/의태어 표현법 (쾅!, 두근두근 등)
  - [x] 호칭 사용 가이드 (형/오빠/누나/언니, 선배/후배)
  - [x] 캐릭터 이름 짓기 규칙 (성+이름, 2-4 음절)

---

## 🔧 Phase 4: Service Integration (Day 4) ✅ COMPLETED

### 4.1 CharacterAIService 수정

- [x] `text/character.py` 수정
- [x] 프롬프트 import 추가
- [x] 각 함수에 `system_instruction` 파라미터 적용
- [x] 동적 Enum 주입 (`enum_to_prompt_options`, `enum_to_prompt_list`)
- [x] 구조화 로깅 적용 (`logger` 사용)
- [ ] `response_schema` 적용 (Phase 5에서 선택적 적용)

### 4.2 EpisodeAIService 수정

- [x] `text/episode.py` 수정
- [x] 프롬프트 import 추가
- [x] 각 함수에 `system_instruction` 파라미터 적용
- [x] 동적 Enum 주입 (`PanelType`, `DialogueType`)
- [x] 구조화 로깅 적용
- [ ] `response_schema` 적용 (Phase 5에서 선택적 적용)

### 4.3 WorldviewAIService 수정

- [x] `text/worldview.py` 수정
- [x] 프롬프트 import 추가
- [x] `system_instruction` 파라미터 적용
- [x] 장르별 수정자 (`get_genre_modifier`) 적용
- [x] 구조화 로깅 적용
- [ ] `response_schema` 적용 (Phase 5에서 선택적 적용)

### 4.4 StyleAIService 수정

- [x] `text/style.py` 수정
- [x] 프롬프트 import 추가
- [x] `system_instruction` 파라미터 적용
- [x] 구조화 로깅 적용
- [ ] `response_schema` 적용 (Phase 5에서 선택적 적용)

### 4.5 PanelAIService 수정

- [x] `generation/panel_service.py` 수정
- [x] 개선된 시스템 프롬프트 적용 (`PANEL_IMAGE_SYSTEM_PROMPT`)
- [x] Multimodal priority rules 반영
- [x] 구조화 로깅 적용

---

## 🧪 Phase 5: Quality Assurance & Documentation (Day 5) ✅ COMPLETED

### 5.1 에러 핸들링 개선 (Minor Issue #8)

- [x] `print` → 구조화 로깅 전환 (Phase 4에서 완료)
- [ ] 재시도 로직 추가 (`tenacity` 라이브러리) - 연기
- [x] AI 응답 파싱 실패 시 폴백 패턴 유지 (기존 구현)

### 5.2 테스트 작성

> 테스트는 별도 세션에서 작성 예정

- [ ] 각 서비스별 유닛 테스트 - 연기
- [ ] response_schema 검증 테스트 - 연기
- [ ] 장르 복합 충돌 테스트 - 연기
- [ ] 언어별 출력 품질 테스트 - 연기

### 5.3 문서 업데이트

- [x] `docs/ai-prompts/README.md` 업데이트
- [x] `prompts/` 디렉토리 구조 반영
- [x] 사용 예시 추가
- [x] 서비스 적용 현황 테이블 추가
- [ ] 각 프롬프트별 **입력→출력 예시** 추가 - 연기

### 5.4 Deferred Items (연기)

> 리뷰 피드백: A/B 테스트 프레임워크는 오버엔지니어링

- [x] A/B 테스트 프레임워크 → Phase 2 로드맵 이동
- [x] 프롬프트 버전 관리 → 추후 검토
- [x] `response_schema` 강제 적용 → 선택적 적용으로 결정

---

## 📝 체크리스트 진행 현황

### 현재 상태:

| Phase   | 상태                           | 완료율 |
| ------- | ------------------------------ | ------ |
| Phase 1 | ✅ Completed                   | 100%   |
| Phase 2 | ✅ 프롬프트 정의 완료 (적용됨) | 100%   |
| Phase 3 | ✅ Completed                   | 100%   |
| Phase 4 | ✅ Completed                   | 100%   |
| Phase 5 | ✅ Completed (테스트 연기)     | 80%    |

### 생성된 파일:

**프롬프트 모듈** (`backend/app/services/ai/prompts/`)

- `__init__.py` - 중앙 export
- `base.py` - 언어 지시문, 컨텍스트 포맷팅
- `constants.py` - Enum 정의 및 유틸리티
- `character.py` - 캐릭터 시스템 프롬프트
- `episode.py` - 에피소드 시스템 프롬프트
- `worldview.py` - 세계관 시스템 프롬프트
- `style.py` - 스타일 시스템 프롬프트
- `image.py` - 이미지 생성 시스템 프롬프트
- `genre.py` - 장르별 수정자 및 충돌 해결

**AI 응답 스키마** (`backend/app/schemas/ai_responses/`)

- `__init__.py` - 중앙 export
- `character.py` - 캐릭터 응답 스키마
- `episode.py` - 에피소드 응답 스키마
- `worldview.py` - 세계관 응답 스키마
- `style.py` - 스타일 응답 스키마

### 서비스 적용 상태:

| 서비스    | 함수                                   | 시스템 프롬프트 | 언어 지시 | 동적 Enum | 로깅 |
| --------- | -------------------------------------- | --------------- | --------- | --------- | ---- |
| Character | `augment_character_text()`             | ✅              | ✅        | ✅        | ✅   |
| Character | `get_character_suggestion()`           | ✅              | ✅        | -         | ✅   |
| Character | `generate_character_batch_suggestions` | ✅              | ✅        | ✅        | ✅   |
| Character | `analyze_character_concept()`          | ✅              | ✅        | ✅        | ✅   |
| Episode   | `generate_direction_options()`         | ✅              | ✅        | -         | ✅   |
| Episode   | `generate_episode_ideas()`             | ✅              | ✅        | -         | ✅   |
| Episode   | `generate_prologue_ideas()`            | ✅              | ✅        | -         | ✅   |
| Episode   | `generate_initial_cuts()`              | ✅              | ✅        | ✅        | ✅   |
| Worldview | `augment_worldview()`                  | ✅              | ✅        | -         | ✅   |
| Style     | `recommend_style()`                    | ✅              | ✅        | -         | ✅   |
| Style     | `augment_style_description()`          | ✅              | ✅        | -         | ✅   |
| Panel     | `generate_panel_image()`               | ✅              | -         | -         | ✅   |

---

## 🔗 관련 문서

- [01-current-analysis.md](../01-draft/01-current-analysis.md) - 현황 분석
- [02-system-prompts.md](../01-draft/02-system-prompts.md) - 권장 시스템 프롬프트
- [03-implementation-guide.md](../01-draft/03-implementation-guide.md) - 구현 가이드
- [04-prompt-templates.md](../01-draft/04-prompt-templates.md) - 프롬프트 템플릿
- [01-review-gemini-3-pro.md](../02-draft-review/01-review-gemini-3-pro.md) - 리뷰 #1
- [02-review-claude-opus-4-5.md](../02-draft-review/02-review-claude-opus-4-5.md) - 리뷰 #2

---

_Last Updated: 2025-12-28_
