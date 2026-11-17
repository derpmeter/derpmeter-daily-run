# 🛤️ Backend Endpoint 슬림화 계획

> **우선순위**: 🟠 Medium  
> **예상 소요**: 2일  
> **Phase**: 2
> **상태**: ✅ 완료 (2025-12-27)

## 📋 현재 상태

### 대형 Endpoint 파일

| 파일            | 라인 수 | 주요 문제                                |
| --------------- | ------- | ---------------------------------------- |
| `episodes.py`   | 994줄   | 스키마 + 라우트 + 백그라운드 태스크 혼재 |
| `characters.py` | 671줄   | 스키마 중복, 태스크 로직 포함            |
| `projects.py`   | 605줄   | 커버 생성 태스크 포함                    |

---

## 🎯 목표

1. 스키마를 `app/schemas/`로 이동 (02-backend-schemas.md 참조)
2. 백그라운드 태스크를 `app/tasks/`로 분리
3. Endpoint 파일은 라우팅 로직만 포함

---

## 📝 실행 계획

### Step 1: tasks 디렉토리 생성

```
backend/app/tasks/
├── __init__.py
├── episode_tasks.py    # 컷 생성, 이미지 생성 태스크
├── character_tasks.py  # 캐릭터 시트 생성 태스크
└── project_tasks.py    # 커버 이미지, 제안 생성 태스크
```

### Step 2: 태스크 함수 이동

#### episodes.py에서 이동할 함수들

```python
# app/tasks/episode_tasks.py
def generate_episode_cuts_task(...): ...  # Line 378-491
def generate_cut_task(...): ...           # Line 533-771
def generate_episode_images_sequentially(...): ...  # Line 773-809
```

#### characters.py에서 이동할 함수들

```python
# app/tasks/character_tasks.py
def generate_character_image_task(...): ...  # Line 245-314
```

#### projects.py에서 이동할 함수들

```python
# app/tasks/project_tasks.py
def generate_project_cover_task(...): ...    # Line 91-141
def generate_suggestions_bg_task(...): ...   # Line 143-192
```

### Step 3: Endpoint 파일 정리

```python
# Before (episodes.py)
def generate_episode_cuts_task(...):
    with Session(engine) as session:
        ...

@router.post("/{episode_id}/generate-cuts")
def generate_episode_cuts(...):
    background_tasks.add_task(generate_episode_cuts_task, ...)

# After
from app.tasks.episode_tasks import generate_episode_cuts_task

@router.post("/{episode_id}/generate-cuts")
def generate_episode_cuts(...):
    background_tasks.add_task(generate_episode_cuts_task, ...)
```

---

## ✅ 체크리스트

- [x] `app/tasks/` 디렉토리 생성
- [x] `episode_tasks.py` 생성 (3개 함수)
- [x] `character_tasks.py` 생성 (1개 함수)
- [x] `project_tasks.py` 생성 (2개 함수)
- [x] endpoint 파일에서 import 변경
- [x] 테스트 통과 (모듈 import 검증 완료)

## 📊 결과

| 파일            | Before | After (목표) | After (실제) |
| --------------- | ------ | ------------ | ------------ |
| `episodes.py`   | 994줄  | ~400줄       | **560줄**    |
| `characters.py` | 671줄  | ~350줄       | **532줄**    |
| `projects.py`   | 605줄  | ~350줄       | **443줄**    |

> 📝 Note: 스키마 분리는 02-backend-schemas.md에서 이미 완료됨. 현재 단계에서는 태스크 함수만 분리.
