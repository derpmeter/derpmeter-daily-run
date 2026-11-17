# 🧙 Frontend CharacterCastingWizard 분할 계획

> **우선순위**: 🟠 High  
> **예상 소요**: 2-3일  
> **Phase**: 3
> **상태**: ✅ 완료 (2025-12-27)

## 📋 현재 상태 (Before)

### 파일 정보

- **경로**: `frontend/src/components/project/CharacterCastingWizard.tsx`
- **라인 수**: 779줄
- **함수 개수**: 20개

### 핵심 문제점

- 모든 스텝 로직이 하나의 파일에 존재
- `renderXxxStep()` 패턴은 컴포넌트 분리의 anti-pattern
- 새 스텝 추가 시 전체 파일 수정 필요
- 각 스텝 독립 테스트 어려움

---

## 🎯 구현된 구조

```
frontend/src/components/project/
├── CharacterCastingWizard.tsx      # 기존 호환성을 위한 re-export (~7줄)
├── CharacterCastingWizard/
│   ├── index.tsx                   # 메인 오케스트레이터 (~281줄)
│   ├── types.ts                    # 공유 타입 정의 (~65줄)
│   ├── StepIndicator.tsx           # 스텝 인디케이터 (~57줄)
│   ├── hooks/
│   │   ├── index.ts                # 훅 barrel export (~1줄)
│   │   └── useCharacterWizard.ts   # 상태 + API 로직 (~282줄)
│   └── steps/
│       ├── index.ts                # 스텝 barrel export (~3줄)
│       ├── ConceptStep.tsx         # 컨셉 입력 스텝 (~66줄)
│       ├── StyleStep.tsx           # 스타일 선택 스텝 (~147줄)
│       └── RoleStep.tsx            # 역할/배경 스텝 (~109줄)
```

---

## ✅ 체크리스트

- [x] `CharacterCastingWizard/` 디렉토리 생성
- [x] `types.ts` 타입 정의 추출
- [x] `useCharacterWizard.ts` 훅 추출
- [x] `StepIndicator.tsx` 분리
- [x] `ConceptStep.tsx` 분리
- [x] `StyleStep.tsx` 분리
- [x] `RoleStep.tsx` 분리
- [x] `index.tsx` 오케스트레이터 작성
- [x] 기존 파일 re-export로 변환
- [x] TypeScript 빌드 검증 통과

## 📊 결과

| 지표                | Before | After (목표) | After (실제) |
| ------------------- | ------ | ------------ | ------------ |
| 최대 파일 라인 수   | 779    | ~200         | **282줄**    |
| 파일 수             | 1      | 6            | **10**       |
| 새 스텝 추가 용이성 | 어려움 | 단순         | **단순**     |

### 파일별 라인 수

| 파일                                     | 라인 수    |
| ---------------------------------------- | ---------- |
| `CharacterCastingWizard.tsx` (re-export) | 7          |
| `index.tsx` (오케스트레이터)             | 281        |
| `types.ts`                               | 65         |
| `StepIndicator.tsx`                      | 57         |
| `hooks/useCharacterWizard.ts`            | 282        |
| `hooks/index.ts`                         | 1          |
| `steps/ConceptStep.tsx`                  | 66         |
| `steps/StyleStep.tsx`                    | 147        |
| `steps/RoleStep.tsx`                     | 109        |
| `steps/index.ts`                         | 3          |
| **Total**                                | **~1,018** |

> 📝 Note: 총 라인 수는 약간 증가했지만 (779 → ~1,018), 각 파일이 단일 책임을 가지고 300줄 이하로 유지되어 유지보수성과 테스트 가능성이 크게 향상됨. 새 스텝 추가 시 `steps/` 디렉토리에 새 파일만 추가하면 됨.
