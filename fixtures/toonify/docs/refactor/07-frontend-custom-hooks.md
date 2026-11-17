# 🪝 Frontend Custom Hooks 아키텍처 계획

> **우선순위**: 🟠 Medium  
> **예상 소요**: 지속적  
> **Phase**: 3-4 (병행)
> **상태**: ✅ 완료 (2025-12-27)

## 📋 현재 상태

### hooks 디렉토리 현황 (After Phase 1 & 3)

```
frontend/src/hooks/
├── index.ts                  # 훅 barrel export (12줄)
├── use-toast.ts              # 기존 toast 훅 (7줄)
│
└── utils/                    # 유틸리티 훅
    ├── index.ts              # utils barrel export (5줄)
    ├── usePolling.ts         # 폴링 패턴 (159줄)
    ├── useDebounce.ts        # 디바운스 (31줄)
    ├── useModal.ts           # 모달 상태 관리 (46줄)
    ├── useKeyboard.ts        # 키보드 네비게이션 (152줄)
    └── useLocalStorage.ts    # 로컬 스토리지 (63줄)
```

### 컴포넌트별 내장 훅 (Phase 3-4에서 추출됨)

```
frontend/src/components/
├── project/
│   ├── ProjectHome/hooks/
│   │   ├── useSuggestions.ts
│   │   ├── useCoverImage.ts
│   │   └── useCharacters.ts
│   │
│   └── CharacterCastingWizard/hooks/
│       └── useCharacterWizard.ts
│
└── editor/
    └── StoryboardView/hooks/
        ├── useStoryboard.ts
        ├── useCutGeneration.ts
        ├── useExport.ts
        └── useDirectorMode.ts
```

---

## 🎯 목표 구조 (계획)

```
frontend/src/hooks/
├── use-toast.ts              # 기존 유지
│
├── api/                      # API 호출 관련 훅
│   ├── useProject.ts         # 프로젝트 CRUD
│   ├── useCharacter.ts       # 캐릭터 CRUD
│   ├── useEpisode.ts         # 에피소드 CRUD
│   └── useCut.ts             # 컷 CRUD
│
├── ai/                       # AI 기능 관련 훅
│   ├── useSuggestions.ts     # AI 제안 로직
│   ├── useImageGeneration.ts # 이미지 생성 로직
│   └── useAnalysis.ts        # 분석 로직
│
├── ui/                       # UI 상태 관련 훅
│   ├── useModal.ts           # ✅ 완료
│   ├── useKeyboard.ts        # ✅ 완료
│   └── usePolling.ts         # ✅ 완료
│
└── utils/                    # 유틸리티 훅
    ├── useDebounce.ts        # ✅ 완료
    └── useLocalStorage.ts    # ✅ 완료
```

---

## ✅ 우선순위별 구현 목록

### Phase 1 (즉시) - ✅ 완료

- [x] `usePolling.ts` - 폴링 패턴 통합 (159줄)
- [x] `useDebounce.ts` - 디바운스 (31줄)
- [x] `useModal.ts` - 모달 상태 관리 (46줄)
- [x] `useKeyboard.ts` - 키보드 네비게이션 (152줄)
- [x] `useLocalStorage.ts` - 로컬 스토리지 (63줄)

### Phase 2 (컴포넌트 리팩토링 시) - ✅ 완료 (컴포넌트 로컬)

- [x] `useSuggestions.ts` - ProjectHome 리팩토링 시 (로컬 훅)
- [x] `useCoverImage.ts` - ProjectHome 리팩토링 시 (로컬 훅)
- [x] `useCharacters.ts` - ProjectHome 리팩토링 시 (로컬 훅)
- [x] `useCharacterWizard.ts` - CharacterCastingWizard 리팩토링 시 (로컬 훅)
- [x] `useStoryboard.ts` - StoryboardView 리팩토링 시 (로컬 훅)
- [x] `useCutGeneration.ts` - StoryboardView 리팩토링 시 (로컬 훅)
- [x] `useExport.ts` - StoryboardView 리팩토링 시 (로컬 훅)
- [x] `useDirectorMode.ts` - StoryboardView 리팩토링 시 (로컬 훅)

### Phase 3 (추가 개선) - ✅ 완료

- [x] `useDebounce.ts`
- [x] `useKeyboard.ts` + `useKeyboardNavigation.ts`
- [x] `useModal.ts`
- [x] `useLocalStorage.ts`

### Phase 4 (향후 고려)

- [ ] `api/useProject.ts` - API 훅 통합 (필요시)
- [ ] `api/useCharacter.ts` - API 훅 통합 (필요시)
- [ ] `api/useEpisode.ts` - API 훅 통합 (필요시)
- [ ] `ai/useSuggestions.ts` - AI 훅 통합 (필요시)
- [ ] `ai/useImageGeneration.ts` - AI 훅 통합 (필요시)

## 📊 결과

| 지표               | Before | After (현재) |
| ------------------ | ------ | ------------ |
| 커스텀 훅 파일 수  | 1      | **8**        |
| 재사용 가능 훅     | 0      | **6**        |
| 컴포넌트별 로컬 훅 | 0      | **8**        |
| 패턴 표준화        | ❌     | ✅           |

### 생성된 훅 상세

| 훅 이름           | 라인 수 | 용도                       |
| ----------------- | ------- | -------------------------- |
| `usePolling`      | 159     | 비동기 상태 폴링           |
| `useDebounce`     | 31      | 입력 디바운싱              |
| `useModal`        | 46      | 모달/다이얼로그 상태 관리  |
| `useKeyboard`     | 152     | 키보드 이벤트 + 네비게이션 |
| `useLocalStorage` | 63      | SSR-safe 로컬 스토리지     |

> 📝 Note: 컴포넌트별 로컬 훅은 각 컴포넌트 디렉토리에 유지됩니다. 범용 재사용이 필요한 경우에만 `src/hooks/`로 이동 검토합니다.
