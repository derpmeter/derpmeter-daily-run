# 🤖 Backend AI Service 리팩토링 계획

> **우선순위**: 🔴 Critical  
> **예상 소요**: 3-5일  
> **Phase**: 1  
> **상태**: ✅ 완료 (2025-12-27)

## 📋 현재 상태 분석 (Before)

### 파일 정보

- **경로**: `backend/app/services/ai.py`
- **라인 수**: 1,287줄
- **함수 개수**: 26개
- **클래스**: 1개 (AIService)

### 핵심 문제점

1. **단일 책임 원칙 위반**: 캐릭터, 에피소드, 스타일, 이미지 등 모든 AI 관련 로직이 한 클래스에
2. **테스트 어려움**: 개별 도메인 테스트를 위해 전체 서비스 모킹 필요
3. **Merge Conflict 빈도 높음**: 여러 기능 개발 시 동일 파일 수정
4. **코드 탐색 어려움**: 1,287줄에서 필요한 메서드 찾기 어려움

---

## 🎯 구현된 구조

```
backend/app/services/ai/
├── __init__.py                    # AIService facade (276줄, 역호환성 유지)
├── base.py                        # 공통 클라이언트 + 유틸리티 (193줄)
│
├── text/                          # 텍스트 생성 서비스
│   ├── __init__.py
│   ├── character.py               # 캐릭터 관련 AI (~350줄)
│   ├── episode.py                 # 에피소드/컷 생성 (~280줄)
│   ├── style.py                   # 스타일 추천/확장 (~200줄)
│   └── worldview.py               # 세계관 확장 (~150줄)
│
├── generation/                    # 이미지 생성 서비스
│   ├── __init__.py
│   ├── image_service.py           # 범용 이미지 생성 (315줄)
│   └── panel_service.py           # 패널 이미지 특화 (~200줄)
│
└── providers/                     # (향후 확장용, 현재 미사용)
    └── __init__.py
```

---

## ✅ 체크리스트

- [x] 디렉토리 구조 생성
- [x] `base.py` 작성 및 테스트
- [x] `text/character.py` 분리 및 테스트
- [x] `text/episode.py` 분리 및 테스트
- [x] `text/style.py` 분리 및 테스트
- [x] `text/worldview.py` 분리 및 테스트
- [x] `generation/panel_service.py` 분리 및 테스트
- [x] `generation/image_service.py` 분리 및 테스트
- [x] `__init__.py` Facade 완성
- [x] 기존 ai.py 백업 및 교체
- [x] 전체 테스트 통과

---

## 📊 결과

| 지표                | Before | After    |
| ------------------- | ------ | -------- |
| 파일 수             | 1      | **10**   |
| 최대 파일 라인 수   | 1,287  | **~350** |
| 테스트 격리         | 불가능 | **가능** |
| Merge Conflict Risk | 높음   | **낮음** |

### 주요 서비스 클래스

| 서비스 클래스        | 위치                          | 주요 기능                        |
| -------------------- | ----------------------------- | -------------------------------- |
| `CharacterAIService` | `text/character.py`           | 캐릭터 제안, 분석, 확장          |
| `EpisodeAIService`   | `text/episode.py`             | 연출, 에피소드 아이디어, 컷 생성 |
| `StyleAIService`     | `text/style.py`               | 스타일 추천, 설명 확장           |
| `WorldviewAIService` | `text/worldview.py`           | 세계관 확장                      |
| `ImageAIService`     | `generation/image_service.py` | 범용 이미지, 커버, 캐릭터 시트   |
| `PanelAIService`     | `generation/panel_service.py` | 웹툰 패널 이미지                 |

### 역호환성

기존 import 방식을 유지합니다:

```python
# 기존 코드 그대로 사용 가능
from app.services.ai import ai_service

result = ai_service.recommend_style(description)
result = ai_service.generate_panel_image(prompt)
```

> 📝 Note: Facade 패턴을 통해 내부적으로 도메인별 서비스에 위임하므로 기존 호출 코드 변경 불필요.
