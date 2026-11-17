> Model: Claude Sonnet 4 (Antigravity)
> Review Date: 2025-12-28

# 📋 Draft Review: Claude Opus 4.5 AI Prompt Documentation

> 01-draft 문서들에 대한 비판적 검토 의견

---

## 📌 리뷰 범위

- `01-current-analysis.md` - 현황 분석
- `02-system-prompts.md` - 권장 시스템 프롬프트
- `03-implementation-guide.md` - 구현 가이드
- `04-prompt-templates.md` - 프롬프트 템플릿

---

## 🔴 Critical Issues (즉시 수정 필요)

### 1. `response_schema` 미활용 - 가장 심각한 누락

**문제점:**  
문서 전반에서 `response_mime_type="application/json"`만 언급하고, Gemini API의 **`response_schema`** 기능을 전혀 다루지 않음.

**왜 치명적인가:**

```python
# 현재 문서의 접근 (불안정)
config=types.GenerateContentConfig(
    response_mime_type="application/json"
    # ← 구조 강제 없음. AI가 다른 키 이름, 누락 필드 반환 가능
)

# 실제 Gemini 베스트 프랙티스
config=types.GenerateContentConfig(
    response_mime_type="application/json",
    response_schema={
        "type": "object",
        "properties": {
            "suggestions": {
                "type": "array",
                "items": {...}
            }
        },
        "required": ["suggestions"]
    }
)
```

`response_schema`는 단순히 "JSON으로 응답해줘"가 아니라, **스키마 레벨에서 구조를 강제**하여:

- 필드 누락 방지
- 타입 안전성 보장
- 프롬프트에서 Output Format 설명을 대폭 축소 가능

**권장:**  
모든 템플릿에 `response_schema` 정의를 필수 요소로 추가. 03-implementation-guide에서 이를 핵심 패턴으로 문서화.

---

### 2. 장르 간 충돌 해결 전략 부재

**문제점:**  
`03-implementation-guide.md`의 `GENRE_MODIFIERS`가 단순 연결(concatenation)만 고려. 복합 장르 프로젝트에서 **상충되는 지시사항** 처리 방법이 없음.

**예시 - Fantasy + Romance 충돌:**

```python
# Fantasy modifier:
"Fast cuts, dynamic angles, 1-2 panels per beat"

# Romance modifier:
"Lingering moments, close-ups, emotional micro-expressions"

# 단순 연결 시 모순된 지시 발생
```

**권장:**

- 장르 우선순위 전략 정의 (Primary Genre vs Secondary)
- 충돌 시나리오별 해결 규칙 문서화
- 복합 장르용 fused modifier 패턴 고려

---

### 3. Enum/상수값의 하드코딩 동기화 문제

**문제점:**  
프롬프트 템플릿 내 enum 값들이 백엔드 모델/스키마와 동기화 보장이 없음.

```python
# 템플릿 (04-prompt-templates.md)
"recommended_role": "protagonist|antagonist|second_lead|scene_stealer"

# 만약 백엔드에서 CharacterRole enum이 확장되면?
# → 프롬프트와 실제 코드 간 불일치 발생
```

**권장:**

- Enum 값을 코드에서 동적으로 주입하는 패턴 도입
- `prompts/constants.py`에서 enum 문자열 중앙 관리
- 혹은 프롬프트 빌드 시점에 스키마에서 자동 추출

---

## 🟠 Major Concerns (개선 필요)

### 4. 패널 이미지 프롬프트의 Multimodal 처리 모호성

**문제점:**  
`02-system-prompts.md`의 `PANEL_IMAGE_SYSTEM_PROMPT`가 텍스트로만 작성됨. 실제 패널 생성은 **multimodal input** (style reference image, character reference images)을 받는데, 이미지 입력과 텍스트 지시 간의 **상호작용 전략**이 없음.

**현재 문서:**

> "If a STYLE REFERENCE IMAGE is provided, you MUST replicate its exact art style"

**누락된 내용:**

- 이미지가 여러 개일 때 우선순위 (style vs character ref)
- Character reference가 Style reference와 다른 스타일일 때 대응
- 참조 이미지 품질이 낮을 때 fallback 전략

**권장:**  
별도 섹션으로 "Multimodal Input Priority Rules" 추가.

---

### 5. A/B 테스트 프레임워크의 실용성 의문

**문제점:**  
`03-implementation-guide.md`의 `PromptABTest` 클래스가 존재하지만:

- 실제 메트릭 수집 메커니즘 없음
- 테스트 결과 저장/분석 파이프라인 없음
- "품질 평가 메트릭"은 정의만 있고 측정 방법 없음

```python
# 정의만 존재
1. 일관성 점수: 동일 입력에 대한 출력 변동성
2. 완성도 점수: 요청된 모든 필드 포함 여부
# ← 실제 구현 코드 없음
```

**권장:**  
A/B 테스트는 "Nice to have" 섹션으로 분리. MVP 단계에서는 오버엔지니어링. 실제 구현할 것이 아니면 제거하거나, Phase 2 로드맵으로 이동.

---

### 6. 한국어 지시문의 피상성

**문제점:**  
`04-prompt-templates.md`의 `KOREAN_INSTRUCTION`이 표면적인 규칙만 나열. 실제 웹툰 플랫폼에서 쓰이는 **구체적 관습**이 부족.

**누락된 한국 웹툰 특화 지시:**

```markdown
- 말풍선 텍스트 길이 제한 (한 버블당 ~15자 권장)
- '~요' vs '~다' 문체 선택 기준
- 웹툰 특유의 의성어/의태어 표현 (쾅! 두근두근 등)
- 비속어/은어 수위 조절 (플랫폼별 심의 기준 상이)
- 캐릭터 이름 짓기: 운율, 의미 암시, 발음 용이성
```

**권장:**  
실제 네이버웹툰/카카오페이지 작가 가이드라인 참고하여 구체화.

---

## 🟡 Minor Issues (개선 권장)

### 7. 버전 관리 전략 부재

프롬프트가 시간이 지나며 개선될 때:

- 어떤 버전이 어떤 시점에 사용되었는지 추적 방법 없음
- 롤백 필요 시 이전 버전 접근 방법 없음

**권장:**  
프롬프트 상수에 버전 메타데이터 추가, 또는 Git 태그 기반 관리 방안 명시.

---

### 8. 에러 핸들링 패턴 부족

`03-implementation-guide.md`의 구현 예시에서:

```python
except Exception as e:
    print(f"Batch Suggestion Error: {e}")
    raise e
```

**문제:**

- `print` 사용 (구조화 로깅 아님)
- 재시도 로직 없음
- AI 응답 파싱 실패 시 폴백 없음

**권장:**  
Gemini API 특성상 간헐적 실패/불완전 응답이 발생할 수 있으므로, 재시도 + 그레이스풀 디그레이데이션 패턴 문서화.

---

### 9. 캐릭터 스탯의 모호성

`04-prompt-templates.md`에서:

```json
"stats": {
    "strength": 0-100,
    "intelligence": 0-100,
    ...
}
```

**문제:**  
로맨스 웹툰에서 "strength"는 무엇을 의미하는가? 장르별로 스탯의 해석이 달라져야 함.

**권장:**

- 장르별 스탯 해석 가이드 추가
- 또는 장르에 따라 스탯 세트 자체를 변경 (예: 로맨스는 "charm", "wit", "confidence")

---

### 10. "15년 경력" 페르소나의 일관성

모든 시스템 프롬프트가 "15+ years of experience" 페르소나를 사용. 이것이 **실제로 출력 품질에 영향**을 주는지 검증 필요.

**의문:**

- LLM에서 페르소나 설정의 실효성에 대한 연구 결과 상이
- 더 구체적인 지시(what to do)가 추상적 페르소나(who you are)보다 효과적일 수 있음

**권장:**  
페르소나 섹션을 간결하게 유지하고, 구체적 규칙/제약에 토큰 예산 할당.

---

## 🔵 Documentation Quality Issues

### 11. 예시 부족

`02-system-prompts.md`의 각 프롬프트에서:

- "좋은 출력"과 "나쁜 출력"의 비교 예시 없음
- 실제 AI 응답 샘플이 없어 기대치 파악 어려움

**권장:**  
각 프롬프트 섹션에 "Example Input → Example Output" 추가.

---

### 12. 디렉토리 구조 제안의 현실성

`03-implementation-guide.md`의 권장 구조:

```
backend/app/services/ai/prompts/
├── character.py
├── episode.py
├── ...
```

**현재 실제 구조와의 괴리:**

- 이미 `text/character.py`, `text/episode.py` 존재
- 마이그레이션 계획 없이 "새 구조 권장"만 제시

**권장:**  
현재 구조에서 점진적으로 전환하는 마이그레이션 스크립트/단계 포함.

---

## ✅ Positive Aspects (잘된 점)

1. **문제 인식의 정확성**: `01-current-analysis.md`의 현황 분석은 실제 코드베이스와 일치함
2. **구조화**: 문서 간 논리적 흐름 (현황 → 프롬프트 → 구현 → 템플릿) 적절
3. **장르별 차별화 시도**: 최소한 장르별 접근이 필요하다는 인식 있음
4. **Vertical Scroll 최적화 언급**: 웹툰 특성 반영 시도

---

## 📊 Summary Scores

| 항목           | 점수 (10점 만점) | 코멘트                                           |
| -------------- | ---------------- | ------------------------------------------------ |
| 기술적 정확성  | 5/10             | `response_schema` 누락 치명적                    |
| 실용성         | 6/10             | A/B 테스트 등 미구현 기능 포함                   |
| 완성도         | 6/10             | 예시 부족, 에러 핸들링 부재                      |
| 한국 웹툰 특화 | 4/10             | 피상적 수준에 머무름                             |
| 구현 가능성    | 7/10             | 대부분 실제 적용 가능하나 마이그레이션 계획 필요 |

---

## 🚀 Recommended Next Steps

1. **`response_schema` 적용**: 모든 템플릿에 스키마 정의 추가 (우선순위 1)
2. **복합 장르 충돌 해결 전략** 문서화 (우선순위 2)
3. **한국어 지시문 구체화**: 실제 웹툰 관습 반영 (우선순위 3)
4. **예시 기반 문서**: 입력→출력 샘플 추가 (우선순위 4)
5. **A/B 테스트 섹션 제거 또는 연기**: 오버엔지니어링 방지 (우선순위 5)

---

_End of Review_
