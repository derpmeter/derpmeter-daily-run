# 웹툰 제작 프로세스 (Webtoon Creation Process)

이 문서는 Toonify 시스템 내에서 웹툰 한 회차를 처음부터 끝까지 제작하는 전체 워크플로우를 기술합니다.

## 1. 사전 준비: 프로젝트 및 세계관 (Foundation)

에피소드 제작 전, 작품의 기반이 되는 세계관과 화풍이 확립되어야 합니다.

- **장르 선택 (Genre)**: 12가지 핵심 장르 (Fantasy, Romance, Thriller 등) 중 선택.
- **세계관 확장 (Worldview Augmentation)**:
  - `WorldviewAIService`가 사용자의 짧은 설명을 바탕으로 3가지 구체적인 설정(방향성, 톤앤매너, 주요 특징)을 제안합니다.
- **화풍 미리보기 (Style Preview)**:
  - `StyleAIService`가 설정된 `art_style` 텍스트를 기반으로 인물/텍스트가 없는 순수 화풍 샘플 이미지를 생성하여 시각적 검증을 돕습니다.

## 2. 캐릭터 캐스팅 (Character Casting)

이야기를 이끌어갈 배우(캐릭터)를 생성합니다.

- **AI 캐릭터 제안 (Suggestions)**: 프로젝트 생성 시 "Cold Start"를 방지하기 위해 캐릭터 초안을 자동 제안합니다. (초기 주인공 포함 옵션 제공)
- **캐스팅 (Promotion)**: 제안된 카드 중 마음에 드는 캐릭터를 정식 캐릭터로 승격시킵니다.
- **시트 생성 (Reference Sheet)**: 선별된 캐릭터에 대해 `ImageAIService`가 '전신상 + 4가지 포즈'가 포함된 캐릭터 시트를 생성합니다. 이는 이후 컷 생성 시 외형 참조의 기준이 됩니다.

## 3. 에피소드 기획 (Episode Planning)

### 3.1 아이디어 발상 (Ideation)

- **일반 에피소드**: 기존 에피소드 흐름(`recent_episodes`)을 분석하여 다음 전개를 위한 3가지 옵션을 제안합니다.
- **프롤로그 모드 (Prologue Mode)**:
  - 프로젝트의 첫 에피소드를 생성할 때 활성화됩니다.
  - **시니어 작가 페르소나 (Senior Writer Persona)**가 적용되어, 독자를 즉시 사로잡을 수 있는 '발단(Inciting Incident)' 위주의 강렬한 도입부를 설계합니다. (Show, Don't Tell 원칙 적용)

### 3.2 콘티 생성 (Storyboard Generation)

- 사용자가 아이디어를 선택하면 `EpisodeAIService`가 구체적인 컷 리스트를 생성합니다.
- 각 컷은 **지문(Script)**, **연출 가이드(Director's Guidance)**, **대사(Dialogue)** 정보를 포함합니다.

---

## 4. 이미지 생성 (Image Generation) - 핵심 단계

이 단계에서 실제 웹툰 컷 이미지가 생성됩니다. `PanelAIService`는 **시각적 일관성(Visual Continuity)**을 유지하기 위해 복합적인 파이프라인을 수행합니다.

### 4.1 캐릭터 참조 보드 (Character Reference Board, CRB)

- **Just-In-Time 생성**: 에피소드 생성 시점에, 해당 회차에 등장하는 캐릭터들의 **'이번 에피소드 의상'**을 입은 모습을 모아 하나의 참조 이미지(Board)로 합성합니다.
- **구조**: 4분할 그리드에 붉은색 테두리와 이름표를 부착하여 AI가 캐릭터를 명확히 식별하도록 돕습니다.
- **불변성(Immutability)**: CRB가 생성되면 해당 에피소드의 의상 설정은 잠금(Lock) 처리되어, 중간에 의상이 바뀌어 발생하는 시각적 오류를 방지합니다.

### 4.2 컷 생산 방식 (Sequential Generation)

두 가지 모드를 지원합니다.

1.  **순차 생성 (Sequential)**: 1번 컷부터 차례대로 생성하며, **'이전 컷(Previous Cut)'** 이미지를 참조로 사용하여 배경과 조명의 연속성을 유지합니다.
2.  **개별 생성 (Individual)**: 특정 컷만 수동으로 트리거합니다.

### 4.3 프롬프트 엔지니어링 및 캐싱

- **Context Caching**: 화풍(Style)과 캐릭터 참조 보드(CRB) 등 고정된 무거운 컨텍스트는 `ContextCacheService`를 통해 AI 모델 레벨에서 캐싱하여 생성 속도를 높이고 일관성을 강화합니다.
- **대사 렌더링 (Dialogue Rendering)**: 대사 타입에 따라 말풍선 모양을 지정합니다.
  - `speech`: 타원형 말풍선
  - `thought`: 구름형 말풍선 (속마음)
  - `shout`: 뾰족한 말풍선

---

## 5. 수정 및 보완 (Refinement)

### 5.1 부분 재생성 (Batch Regeneration)

- 마음에 들지 않는 컷들을 선택하여 일괄 재생성합니다.
- 선택된 컷들의 순서를 지켜 처리함으로써, 수정 과정에서도 앞뒤 컷의 맥락이 파괴되지 않도록 합니다.

### 5.2 감독 모드 (Director's Guidance)

- 컷 생성 전, 대본을 분석하여 최적의 카메라 구도(Low angle, Close-up 등)를 AI가 미리 제안합니다. 사용자는 이를 수정하여 연출 의도를 반영할 수 있습니다.
