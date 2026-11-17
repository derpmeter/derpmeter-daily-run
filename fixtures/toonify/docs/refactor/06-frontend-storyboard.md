# 🎬 Frontend StoryboardView 분할 계획

> **우선순위**: 🟠 High  
> **예상 소요**: 2-3일  
> **Phase**: 4
> **상태**: ✅ 완료 (2025-12-27)

## 📋 현재 상태 (Before)

### 파일 정보

- **경로**: `frontend/src/components/editor/StoryboardView.tsx`
- **라인 수**: 791줄
- **함수 개수**: 13개

### 핵심 문제점

- 생성, 내비게이션, 데이터 조회 로직 혼재
- 상태 관리가 컴포넌트 내부에 집중
- 재사용 가능한 로직이 없음

---

## 🎯 구현된 구조

```
frontend/src/components/editor/
├── StoryboardView.tsx              # 기존 호환성을 위한 re-export (~7줄)
└── StoryboardView/
    ├── index.tsx                   # 메인 오케스트레이터 (~241줄)
    ├── types.ts                    # 공유 타입 정의 (~27줄)
    ├── StoryboardToolbar.tsx       # 상단 툴바 (~67줄)
    ├── PositionIndicator.tsx       # 위치 표시 사이드바 (~70줄)
    ├── CutCard.tsx                 # 개별 컷 카드 (~174줄)
    ├── DirectorModeArea.tsx        # 감독 모드 영역 (~94줄)
    └── hooks/
        ├── index.ts                # 훅 barrel export (~4줄)
        ├── useStoryboard.ts        # 메인 상태 관리 (~172줄)
        ├── useCutGeneration.ts     # 이미지 생성 로직 (~99줄)
        ├── useExport.ts            # 내보내기 로직 (~71줄)
        └── useDirectorMode.ts      # 감독 모드 로직 (~125줄)
```

---

## ✅ 체크리스트

- [x] `StoryboardView/` 디렉토리 생성
- [x] `types.ts` 타입 정의 추출
- [x] `useStoryboard.ts` 훅 추출
- [x] `useCutGeneration.ts` 훅 추출
- [x] `useExport.ts` 훅 추출
- [x] `useDirectorMode.ts` 훅 추출
- [x] `CutCard.tsx` 분리
- [x] `PositionIndicator.tsx` 분리
- [x] `StoryboardToolbar.tsx` 분리
- [x] `DirectorModeArea.tsx` 분리
- [x] `index.tsx` 오케스트레이터 작성
- [x] 기존 파일 re-export로 변환
- [x] TypeScript 빌드 검증 통과

## 📊 결과

| 지표              | Before | After (목표) | After (실제) |
| ----------------- | ------ | ------------ | ------------ |
| 최대 파일 라인 수 | 791    | ~200         | **241줄**    |
| 파일 수           | 1      | 7            | **12**       |
| 로직 재사용성     | 0%     | 훅 단위      | **훅 단위**  |

### 파일별 라인 수

| 파일                             | 라인 수    |
| -------------------------------- | ---------- |
| `StoryboardView.tsx` (re-export) | 7          |
| `index.tsx` (오케스트레이터)     | 241        |
| `types.ts`                       | 27         |
| `StoryboardToolbar.tsx`          | 67         |
| `PositionIndicator.tsx`          | 70         |
| `CutCard.tsx`                    | 174        |
| `DirectorModeArea.tsx`           | 94         |
| `hooks/index.ts`                 | 4          |
| `hooks/useStoryboard.ts`         | 172        |
| `hooks/useCutGeneration.ts`      | 99         |
| `hooks/useExport.ts`             | 71         |
| `hooks/useDirectorMode.ts`       | 125        |
| **Total**                        | **~1,151** |

> 📝 Note: 총 라인 수는 증가했지만 (791 → ~1,151), 각 파일이 단일 책임을 가지고 250줄 이하로 유지되어 유지보수성과 테스트 가능성이 크게 향상됨. 비즈니스 로직이 훅으로 분리되어 재사용 가능.
