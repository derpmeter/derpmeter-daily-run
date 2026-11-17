# **AI 웹툰 플랫폼 MVP 비즈니스 전략 (Gemini Only Edition)**

## **1. 개요 및 MVP 목표**

초기 개발 복잡도를 낮추기 위해 외부 이미지 생성 엔진(Fal.ai) 연동 없이, **Google Gemini 3 Pro** 하나의 엔진으로 텍스트, 코드, 이미지를 모두 처리하는 **All-in-One MVP 전략**입니다.

- **핵심 목표:** 시장 검증 (PMF), 빠른 출시, 사용자 피드백 확보
- **제약 사항:** Gemini 3 Pro Image 모델의 비용($0.134/장)이 높으므로, 마진율보다는 **유저 확보**에 집중.

## **2. 핵심 인프라 및 기술 스택 (MVP Stack)**

단일 공급자(Google) 전략으로 개발 공수를 최소화합니다.

| 구분                | 선정 기술        | 선정 이유                                                                                                                                 |
| :------------------ | :--------------- | :---------------------------------------------------------------------------------------------------------------------------------------- |
| **결제/정산 (MoR)** | **Polar.sh**     | • **최저 수수료 (4% + $0.40)**로 초기 비용 절감 • Next.js 친화적, 글로벌 세금 자동 처리                                                   |
| **AI 통합 엔진**    | **Gemini 3 Pro** | • **텍스트:** 세계관, 스토리, 챗봇 • **이미지:** gemini-3-pro-image-preview • **장점:** 멀티모달 입력(이미지+텍스트)으로 일관성 시도 가능 |

## **3. MVP 요금제 구조 (Pricing Tiers)**

Fal.ai(FLUX) 사용 시보다 원가가 높기 때문에, **Pro 플랜의 제공량을 보수적으로 책정**하여 리스크를 관리합니다.

| 플랜명          | Plus                 | Pro                                                | Studio                                             |
| :-------------- | :------------------- | :------------------------------------------------- | :------------------------------------------------- |
| **월 구독료**   | **$12 / mo**         | **$39 / mo**                                       | **$119 / mo**                                      |
| **지급 크레딧** | **800 Credits**      | **3,000 Credits**                                  | **10,000 Credits**                                 |
| **초기 지급**   | 500 Credits          | 500 Credits                                        | 500 Credits                                        |
| **사용 모델**   | **Gemini 3 Pro**     | **Gemini 3 Pro**                                   | **Gemini 3 Pro**                                   |
| **일관성 기능** | ❌ 텍스트 프롬프트만 | 🔺 **멀티모달 참조** (이미지 업로드로 스타일 유도) | ⭕ **전담 프롬프트 엔지니어링** (챗봇 수익화 권한) |
| **이미지 품질** | 표준 (1024px)        | 고화질 (일관성 시도)                               | 고화질 + 우선 처리                                 |
| **특이 사항**   | 가벼운 찍먹용        | **MVP 주력 모델**                                  | B2B / 수익화 테스트용                              |

## **4. MVP 크레딧 차감 정책 (Credit Policy)**

**기본 가치:** 1 Credit ≈ **$0.013** (약 18원)

**초기 지급:** 신규 가입 시 **500 Credits** 지급

**일일 리필:** 매일 **50 Credits** 자동 충전

Gemini 3 Pro 이미지 생성 원가가 비싸므로(약 $0.13), 이미지 생성 차감액을 현실화했습니다.

---

### **📋 크레딧 차감 매트릭스 (Credit Deduction Matrix)**

#### **🏗️ 프로젝트 & 세계관**

| 기능 (한글)               | Action Type (Key)              | 차감 크레딧 |
| :------------------------ | :----------------------------- | :---------- |
| 세계관 AI 확장            | `augment_worldview`            | 5           |
| 프로젝트 커버 이미지 생성 | `generate_project_cover_image` | 15          |

#### **🎨 아트 스타일**

| 기능 (한글)      | Action Type (Key)         | 차감 크레딧 |
| :--------------- | :------------------------ | :---------- |
| 스타일 추천      | `recommend_style`         | 1           |
| 스타일 샘플 생성 | `style_sample_generation` | 10          |

#### **👤 캐릭터**

| 기능 (한글)             | Action Type (Key)             | 차감 크레딧 |
| :---------------------- | :---------------------------- | :---------- |
| 캐릭터 텍스트 확장      | `augment_character_text`      | 5           |
| 캐릭터 제안 (단일)      | `get_character_suggestion`    | 1           |
| 캐릭터 컨셉 분석        | `analyze_character_concept`   | 1           |
| 캐릭터 배치 제안 (10개) | `batch_character_suggestions` | 5           |
| 캐릭터 시트 생성        | `generate_character_sheet`    | 20          |

#### **📖 에피소드 & 스토리보드**

| 기능 (한글)               | Action Type (Key)            | 차감 크레딧 |
| :------------------------ | :--------------------------- | :---------- |
| 에피소드 아이디어 생성    | `generate_episode_ideas`     | 3           |
| 초기 컷 구조 생성         | `generate_initial_cuts`      | 5           |
| 연출 옵션 생성            | `generate_direction_options` | 2           |
| 패널 이미지 생성          | `generate_panel_image`       | 12          |
| 백그라운드 컷 이미지 생성 | `bg_generate_cut_image`      | 8           |

#### **🛠️ 유틸리티**

| 기능 (한글)      | Action Type (Key)     | 차감 크레딧 |
| :--------------- | :-------------------- | :---------- |
| 일반 이미지 생성 | `generate_image`      | 10          |
| 이미지 수정      | `modify_image`        | 8           |
| 이미지 업스케일  | `upscale`             | 10          |
| 연출 제안        | `director_suggestion` | 1           |

## **5. 수익성 분석 (Break-even Analysis)**

MVP 단계에서는 **'적자를 보지 않는 선'**에서 방어하며 유저 데이터를 쌓는 것이 목표입니다.

**시나리오:** Pro 플랜($39) 유저가 3,000 크레딧을 모두 **일반 컷 생성(10 크레딧)**에 사용 시 (300장).

### **5.1. Polar.sh 수수료 공제**

- **판매가:** $39.00
- **수수료:** -$2.55 (약 6.5%)
- **실수령액 (Net):** **$36.45**

### **5.2. AI 원가 및 손익**

- **Gemini 원가:** 300장 × $0.134 = **-$40.20**
- **영업손익:** $36.45 - $40.20 = **-$3.75 (약간의 적자)** 🚨

**💡 MVP 생존 전략:**

1. **낙전 수입 기대:** 모든 유저가 크레딧을 100% 소진하지 않으므로(평균 70% 소진), 실제로는 **본전(BEP)** 수준 유지 예상.
2. **믹스(Mix) 전략:** 유저가 이미지(10 크레딧) 외에 텍스트 기획(1~5 크레딧) 기능을 섞어 쓰도록 유도하여 마진 확보.
3. **마케팅비로 간주:** 약간의 적자는 초기 유저 확보를 위한 마케팅 비용으로 투자.

## **6. 단계별 로드맵 (Migration Plan)**

현재(MVP)는 개발 속도를 위해 Gemini만 쓰지만, 유저가 늘어나면 수익성을 위해 엔진을 교체해야 합니다.

- **Phase 1 (MVP - 현재):** **Gemini 3 Pro Only**
  - 목표: 서비스 런칭, 결제 연동(Polar), UI/UX 검증.
  - 특징: 개발 속도 빠름, 마진 낮음.
- **Phase 2 (Growth - 다음 단계):** **Fal.ai (FLUX) 도입**
  - 시점: 유료 구독자 100명 돌파 시.
  - 변화: 이미지 엔진을 Fal.ai로 교체 → 원가 1/5로 절감 → **마진율 40%대로 급상승.**
  - 혜택: 이때부터 '완벽한 캐릭터 고정' 기능을 마케팅 포인트로 내세움.

## **7. 결론**

**"일단 Gemini 하나로 빠르게 런칭한다."**

MVP 단계에서는 복잡한 기술 연동보다는 **서비스가 돌아가는 것을 보여주는 것**이 중요합니다. Gemini 3 Pro의 멀티모달 기능을 최대한 활용하여 '유사한 스타일'을 뽑아내고, **Polar.sh**로 결제 시스템을 테스트하십시오. 수익성은 Phase 2에서 Fal.ai 도입과 함께 확보하면 됩니다.

---

## **8. 구현 상태 및 TODO (Implementation Status)**

### **✅ 구현 완료 (Implemented)**

| 기능                    | 구현 위치                                    | 비고                                    |
| :---------------------- | :------------------------------------------- | :-------------------------------------- |
| 크레딧 시스템 (PRICING) | `backend/app/services/billing.py`            | 기능별 차등 요금 적용 (Plus/Pro/Studio) |
| 신규 가입 500 크레딧    | `backend/app/api/v1/endpoints/workspaces.py` | Workspace 생성 시 500 Credits 기본값    |
| 일일 50 크레딧 리필     | `billing.py` → `check_daily_refill()`        | 매일 리필 로직                          |
| 크레딧 차감/기록        | `billing.py` → `deduct_credits()`            | `CreditTransaction` 모델에 기록         |
| 충전 UI (모달)          | `frontend/.../RechargeModal.tsx`             | **UI만 구현됨, 결제 로직 없음**         |

### **❌ 미구현 (TODO)**

#### **1. Polar.sh 결제 연동**

- [ ] Polar.sh 계정 생성 및 API 키 발급
- [ ] 환경변수 추가: `POLAR_API_KEY`, `POLAR_WEBHOOK_SECRET`
- [ ] **백엔드**: `backend/app/api/v1/endpoints/payments.py` 생성
  - [ ] `POST /api/v1/payments/checkout` - 결제 세션 생성
  - [ ] `POST /api/v1/payments/webhook` - Polar 웹훅 처리
  - [ ] `GET /api/v1/payments/history` - 결제 내역 조회
- [ ] **프론트엔드**: `RechargeModal.tsx` 수정
  - [ ] Polar Checkout 리다이렉트 또는 임베드 구현
  - [ ] 결제 완료 콜백 처리

#### **2. 구독 요금제 시스템**

- [ ] **모델 추가**: `backend/app/models/models.py`
  ```python
  class Subscription(SQLModel, table=True):
      id: UUID
      workspace_id: UUID
      plan: str  # "plus" | "pro" | "studio"
      status: str  # "active" | "cancelled" | "past_due"
      polar_subscription_id: str
      current_period_start: datetime
      current_period_end: datetime
  ```
- [ ] **Workspace.tier** 동기화 로직 (웹훅에서 업데이트)
- [ ] **요금제별 분기 처리**
  - [ ] Plus ($12): 800 Credits
  - [ ] Pro ($39): 3,000 Credits
  - [ ] Studio ($119): 10,000 Credits

#### **3. 코인 구매 (일회성)**

- [ ] 구매 패키지 정의 (Polar Product 등록)
  - [ ] Starter: 100 Credits / $2.99
  - [ ] Creator: 500 Credits / $9.99
  - [ ] Pro: 1,200 Credits / $19.99
- [ ] 웹훅 처리 시 `Workspace.credits += 구매량` 로직

#### **4. 프론트엔드 결제 UX**

- [ ] `/dashboard/billing` 페이지 신설
  - [ ] 현재 구독 상태 표시
  - [ ] 요금제 업그레이드/다운그레이드
  - [ ] 결제 수단 관리 (Polar 포털 링크)
  - [ ] 결제 내역 조회
- [ ] 크레딧 부족 시 결제 유도 모달 개선

#### **5. 보안 및 검증**

- [ ] Polar 웹훅 시그니처 검증
- [ ] 중복 결제 방지 (idempotency key)
- [ ] 환불 처리 로직 (크레딧 차감)

---

### **🎯 구현 우선순위 (Priority)**

1. **P0 (필수)**: Polar.sh 연동 + 코인 구매 + 웹훅 처리
2. **P1 (중요)**: 구독 요금제 시스템
3. **P2 (권장)**: Billing 대시보드 UI
