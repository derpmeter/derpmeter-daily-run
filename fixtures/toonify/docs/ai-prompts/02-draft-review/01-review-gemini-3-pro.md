> Model: Gemini 3 Pro

# 🧐 AI 프롬프트 초안 검토 및 제안

01-draft 내의 Claude가 작성한 프롬프트 문서들은 전반적으로 수준이 매우 높으며, 현황 분석부터 해결 방안, 구현 가이드까지 논리적 흐름이 탄탄합니다. 특히 웹툰 도메인 지식(스크롤 연출, 장르별 특성)이 프롬프트에 깊이 있게 반영된 점이 인상적입니다.

그러나 실제 프로덕션 환경에서의 안정성과 효율성을 위해 다음과 같은 **비판적 개선점**을 제안합니다.

## 🚨 Critical: JSON 안정성 및 스키마 강제화

### 문제점

[`03-implementation-guide.md`](../01-draft/03-implementation-guide.md)와 [`04-prompt-templates.md`](../01-draft/04-prompt-templates.md)에서 JSON 출력을 유도하고 있지만, 여전히 **텍스트 기반 프롬프트**(`Return ONLY a valid JSON...`)에 의존하고 있습니다.
복잡한 중첩 구조(예: `CUTS_GENERATION_TEMPLATE`의 컷 리스트)에서는 LLM이 스키마를 이탈하거나, 문자열 내에서 따옴표를 잘못 처리하는 파싱 에러가 발생할 확률이 높습니다.

### 제안

Google Gen AI SDK(Gemini)의 **`response_schema`** 기능을 적극 도입해야 합니다.

- 텍스트로 포맷을 설명하는 대신, **Pydantic 모델**을 정의하여 `response_schema` 파라미터로 주입하세요.
- 이는 **Type Safety**와 **JSON Parsing 성공률**을 100%에 가깝게 보장합니다.
- [`03-implementation-guide.md`](../01-draft/03-implementation-guide.md)의 표준을 이 방식으로 변경하는 것을 강력히 권장합니다.

## ⚡️ Efficiency: 문맥 과부하와 토큰 효율성

### 문제점

[`02-system-prompts.md`](../01-draft/02-system-prompts.md)의 시스템 프롬프트들이 매우 깁니다. 특히 "철학(Philosophy)"이나 "원칙" 같은 추상적인 섹션이 많은 비중을 차지합니다.
시스템 프롬프트가 지나치게 길면 LLM이 정작 중요한 **구체적 지시사항(Instructions)**이나 **제약조건(Constraints)**을 놓칠 수 있습니다 ("Lost in the Middle" 현상).

### 제안

- "철학" 섹션은 과감히 줄이거나 핵심 키워드 위주로 요약하세요.
- 대신 **Few-shot Example(예시)**을 추가하는 것이 훨씬 효과적입니다.
- 예: "Show, Don't Tell"을 설명하는 대신, `[Bad: He was angry.]` vs `[Good: He slammed his fist on the table.]` 예시 한 쌍이 더 강력합니다.

## 🧩 Logic: 장르 복합 적용 시 충돌 가능성

### 문제점

[`03-implementation-guide.md`](../01-draft/03-implementation-guide.md)의 `Step 3: 장르별 프롬프트 변형 지원`에서 단순 문자열 결합(`join`) 방식을 사용합니다.
만약 사용자가 **[Romance, Thriller]**를 동시에 선택한다면?

- Romance: "감정선에 집중하고 여백을 줘라"
- Thriller: "긴장감을 위해 컷을 조이고 정보를 숨겨라"
  두 지침이 충돌하여 LLM이 환각(Hallucination)을 일으키거나 지시를 무시할 수 있습니다.

### 제안

- **우선순위(Primary/Secondary Genre) 로직**을 도입하세요.
- 또는 충돌 해결을 위한 메타 시스템 프롬프트를 추가하세요. ("두 장르의 특성을 융합하되, 충돌 시 스릴러의 긴장감을 우선하라" 등)

## 🎨 Domain Specific: 이미지 생성 프롬프트의 한계

### 문제점

[`02-system-prompts.md`](../01-draft/02-system-prompts.md)의 패널 이미지 생성 프롬프트(`PANEL_IMAGE_SYSTEM_PROMPT`)에서 `"Do NOT copy: people from style reference"`와 같은 Negative Constraint를 텍스트로만 제어하려고 합니다.
이미지 생성 모델 특성상 텍스트 프롬프트만으로는 스타일 이미지의 피사체가 결과물에 침범하는 것을 완벽히 막기 어렵습니다.

### 제안

- 프롬프트 엔지니어링만으로는 한계가 있음을 인정하고, **전처리 단계**를 고려해야 합니다.
- 예: 스타일 참고 이미지에 대한 캡션을 별도로 생성하여 "스타일만 참고하고 내용은 무시하라"는 것을 명시적으로 LLM이 인지하게 하거나, 모델 파이프라인(IP-Adapter 등) 레벨의 제어를 병행해야 함을 주석으로 남겨두세요.

## 🛠 Maintainability: 템플릿 내 하드코딩

### 문제점

[`04-prompt-templates.md`](../01-draft/04-prompt-templates.md)의 템플릿 내에 `"recommended_role": "protagonist|antagonist|..."`와 같은 Enum 값들이 문자열로 하드코딩되어 있습니다.

### 제안

- 코드(`schema.py`)의 Enum 정의와 프롬프트 템플릿이 분리되면 유지보수가 어렵습니다.
- 템플릿 문자열 내에 하드코딩하지 말고, `{valid_roles}`와 같이 **변수로 주입**받도록 수정하여 코드와 동기화되도록 하세요.
