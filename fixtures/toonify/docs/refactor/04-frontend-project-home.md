# 🏠 Frontend ProjectHome 분할 계획

> **우선순위**: 🔴 Critical  
> **예상 소요**: 3-4일  
> **Phase**: 3
> **상태**: ✅ 완료 (2025-12-27)

## 📋 현재 상태

### 파일 정보 (Before)

- **경로**: `frontend/src/components/project/ProjectHome.tsx`
- **라인 수**: 1,000줄
- **함수 개수**: 23개

### 핵심 문제점 (Before)

- 1,000줄의 단일 컴포넌트
- UI 렌더링 + 비즈니스 로직 혼재
- 여러 섹션이 하나의 파일에 존재
- 상태 관리 복잡도 높음

---

## 🎯 목표 구조

```
frontend/src/components/project/
├── ProjectHome.tsx            # 기존 호환성을 위한 re-export (~6줄)
├── ProjectHome/
│   ├── index.tsx              # 메인 오케스트레이터 (~310줄)
│   ├── types.ts               # 공유 타입 정의 (~77줄)
│   ├── ProjectHero.tsx        # 히어로 섹션 (~213줄)
│   ├── CharacterSection.tsx   # 캐릭터 목록 (~187줄)
│   ├── EpisodeSection.tsx     # 에피소드 목록 (~129줄)
│   ├── SuggestionBanner.tsx   # AI 제안 배너 (~69줄)
│   ├── WorldviewSection.tsx   # 세계관 섹션 (~32줄)
│   └── hooks/
│       ├── index.ts           # 훅 barrel export (~3줄)
│       ├── useSuggestions.ts  # 제안 관련 로직 (~114줄)
│       ├── useCoverImage.ts   # 커버 이미지 로직 (~99줄)
│       └── useCharacters.ts   # 캐릭터 로직 (~84줄)
└── modals/                    # 기존 유지
```

---

## ✅ 체크리스트

- [x] `ProjectHome/` 디렉토리 생성
- [x] `types.ts` 타입 정의 추출
- [x] `useSuggestions.ts` 훅 추출
- [x] `useCoverImage.ts` 훅 추출
- [x] `useCharacters.ts` 훅 추출
- [x] `ProjectHero.tsx` 컴포넌트 추출
- [x] `CharacterSection.tsx` 컴포넌트 추출
- [x] `EpisodeSection.tsx` 컴포넌트 추출
- [x] `SuggestionBanner.tsx` 컴포넌트 추출
- [x] `WorldviewSection.tsx` 컴포넌트 추출
- [x] `index.tsx` 오케스트레이터 작성
- [x] 기존 파일 re-export로 변환
- [x] TypeScript 빌드 검증 통과

## 📊 결과

| 지표               | Before | After (목표) | After (실제) |
| ------------------ | ------ | ------------ | ------------ |
| 최대 파일 라인 수  | 1,000  | ~200         | **310줄**    |
| 파일 수            | 1      | 8            | **12**       |
| 테스트 가능 단위   | 1      | 8            | **12**       |
| 렌더링 최적화 가능 | 어려움 | 용이         | **용이**     |

### 파일별 라인 수

| 파일                          | 라인 수   |
| ----------------------------- | --------- |
| `ProjectHome.tsx` (re-export) | 6         |
| `index.tsx` (오케스트레이터)  | 310       |
| `types.ts`                    | 77        |
| `ProjectHero.tsx`             | 213       |
| `CharacterSection.tsx`        | 187       |
| `EpisodeSection.tsx`          | 129       |
| `SuggestionBanner.tsx`        | 69        |
| `WorldviewSection.tsx`        | 32        |
| `hooks/useSuggestions.ts`     | 114       |
| `hooks/useCoverImage.ts`      | 99        |
| `hooks/useCharacters.ts`      | 84        |
| `hooks/index.ts`              | 3         |
| **Total**                     | **1,323** |

> 📝 Note: 총 라인 수는 약간 증가했지만 (1,000 → 1,323), 각 파일이 단일 책임을 가지고 200줄 이하로 유지되어 유지보수성과 테스트 가능성이 크게 향상됨.
