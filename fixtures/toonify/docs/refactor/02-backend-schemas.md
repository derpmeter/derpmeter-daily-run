# 📦 Backend Pydantic Schema 중앙화 계획

> **우선순위**: 🔴 Critical  
> **예상 소요**: 2-3일  
> **Phase**: 1  
> **상태**: ✅ 완료 (2025-12-27)

## 📋 현재 상태

### 스키마 분산 현황

| Endpoint 파일   | 스키마 개수 | 라인 범위   |
| --------------- | ----------- | ----------- |
| `episodes.py`   | 6개         | Line 24-218 |
| `characters.py` | 11개        | Line 22-467 |
| `projects.py`   | 6개         | Line 22-87  |

### 핵심 문제점

- 스키마 재사용 불가
- 중복 정의 가능성
- 탐색 어려움

---

## 🎯 목표 구조

```
backend/app/schemas/
├── __init__.py        # 통합 export
├── base.py            # 공통 Mixin
├── character.py       # 캐릭터 스키마
├── episode.py         # 에피소드 스키마
├── project.py         # 프로젝트 스키마
└── common.py          # 공통 패턴
```

---

## 📝 실행 계획

### Step 1: 디렉토리 생성

```bash
mkdir -p backend/app/schemas
```

### Step 2: base.py - 공통 Mixin

```python
# backend/app/schemas/base.py
from pydantic import BaseModel
from app.core.config import settings

class FullUrlMixin:
    @classmethod
    def _make_full_url(cls, v):
        if v and not v.startswith('http'):
            return f"{settings.STORAGE_BASE_URL}/{v}"
        return v

class OrmConfig:
    orm_mode = True
    from_attributes = True
```

### Step 3: 도메인별 스키마 파일 생성

각 endpoint에서 스키마를 추출하여 해당 도메인 파일로 이동

### Step 4: Endpoint 파일 업데이트

```python
# Before (characters.py)
class CharacterCreate(BaseModel): ...

# After
from app.schemas import CharacterCreate
```

---

## ✅ 체크리스트

- [x] schemas 디렉토리 생성
- [x] base.py 작성
- [x] character.py 스키마 이동 (10개)
- [x] episode.py 스키마 이동 (6개)
- [x] project.py 스키마 이동 (6개)
- [x] endpoint 파일 import 변경
- [x] Pydantic V2 호환성 (orm_mode → from_attributes)
- [x] 구문 검사 통과

## 📊 실제 결과

| 지표                  | Before | After |
| --------------------- | ------ | ----- |
| characters.py 라인 수 | 671    | 603   |
| episodes.py 라인 수   | 994    | 949   |
| projects.py 라인 수   | 607    | 544   |
| Endpoint 총 라인 수   | 2,272  | 2,096 |
| 스키마 재사용성       | 0%     | 100%  |

### 생성된 스키마 파일

```
backend/app/schemas/
├── __init__.py    (82줄) - 통합 export
├── base.py        (21줄) - 공통 Mixin
├── character.py   (115줄) - 캐릭터 스키마 10개
├── episode.py     (77줄) - 에피소드 스키마 6개
├── project.py     (88줄) - 프로젝트 스키마 6개
└── common.py      (27줄) - 공통 패턴
```

**완료일**: 2025-12-27
