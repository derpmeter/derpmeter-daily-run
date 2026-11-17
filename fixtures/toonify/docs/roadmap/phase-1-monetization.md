# 💰 Phase 1: 수익화 기반 구축 (Monetization Foundation)

> **목표**: 첫 유료 고객 확보, 결제 파이프라인 검증  
> **예상 기간**: 2-3주  
> **상태**: 📋 준비 중

## 📋 개요

MVP 출시 후 가장 먼저 확보해야 할 것은 **수익화 파이프라인**입니다. 현재 크레딧 시스템과 UI는 구현되어 있으나, 실제 결제 연동이 없는 상태입니다. Polar.sh를 통해 빠르게 결제 시스템을 구축합니다.

## 🎯 핵심 목표

1. **첫 유료 결제 완료** - 결제 파이프라인 검증
2. **결제 → 크레딧 자동화** - 웹훅 기반 자동 지급
3. **구독 시스템 활성화** - Plus/Pro/Studio 티어

---

## 📝 태스크 목록

### 1. Polar.sh 결제 연동 (P0 - 필수)

#### 1.1 초기 설정

- [ ] Polar.sh 계정 생성
- [ ] 조직(Organization) 설정
- [ ] API 키 발급 (`POLAR_API_KEY`)
- [ ] 웹훅 시크릿 발급 (`POLAR_WEBHOOK_SECRET`)

#### 1.2 환경변수 설정

```bash
# .env.production 추가
POLAR_API_KEY=polar_sk_xxx
POLAR_WEBHOOK_SECRET=whsec_xxx
POLAR_ORGANIZATION_ID=org_xxx
```

#### 1.3 백엔드 API 구현

**파일**: `backend/app/api/v1/endpoints/payments.py`

```python
# 필수 엔드포인트
POST /api/v1/payments/checkout      # 결제 세션 생성
POST /api/v1/payments/webhook       # Polar 웹훅 처리
GET  /api/v1/payments/history       # 결제 내역 조회
GET  /api/v1/payments/subscription  # 현재 구독 상태
```

#### 1.4 웹훅 이벤트 처리

| 이벤트                  | 처리 로직                     |
| ----------------------- | ----------------------------- |
| `checkout.completed`    | 크레딧 지급 또는 구독 활성화  |
| `subscription.created`  | 구독 정보 저장, 티어 업데이트 |
| `subscription.updated`  | 구독 상태 동기화              |
| `subscription.canceled` | 구독 취소 처리                |
| `order.created`         | 일회성 구매 크레딧 지급       |

---

### 2. 코인 구매 시스템 (P0 - 필수)

#### 2.1 Polar Product 등록

| 패키지명 | 크레딧        | 가격   | 크레딧당 가격 |
| -------- | ------------- | ------ | ------------- |
| Starter  | 100 Credits   | $2.99  | $0.030        |
| Creator  | 500 Credits   | $9.99  | $0.020        |
| Pro      | 1,200 Credits | $19.99 | $0.017        |

#### 2.2 구현 체크리스트

- [ ] Polar에 3개 Product 생성
- [ ] Product ID를 환경변수로 관리
- [ ] 결제 완료 시 `Workspace.credits += 구매량` 로직
- [ ] `CreditTransaction` 기록 (type: `purchase`)

---

### 3. 구독 요금제 시스템 (P1 - 중요)

#### 3.1 데이터베이스 모델 추가

**파일**: `backend/app/models/models.py`

```python
class Subscription(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    workspace_id: UUID = Field(foreign_key="workspace.id")
    plan: str  # "plus" | "pro" | "studio"
    status: str  # "active" | "cancelled" | "past_due"
    polar_subscription_id: str
    current_period_start: datetime
    current_period_end: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```

#### 3.2 요금제별 크레딧 지급

| 플랜   | 월 구독료 | 월 지급 크레딧 |
| ------ | --------- | -------------- |
| Plus   | $12       | 800 Credits    |
| Pro    | $39       | 3,000 Credits  |
| Studio | $119      | 10,000 Credits |

#### 3.3 구현 체크리스트

- [ ] `Subscription` 모델 생성 및 마이그레이션
- [ ] Polar에 3개 구독 상품 생성
- [ ] 구독 활성화 시 `Workspace.tier` 동기화
- [ ] 구독 갱신일에 크레딧 자동 지급
- [ ] 구독 취소 시 티어 다운그레이드 로직

---

### 4. Billing Dashboard (P2 - 권장)

#### 4.1 페이지 구성

**경로**: `/dashboard/billing`

```
/dashboard/billing
├── 현재 구독 상태 카드
│   ├── 플랜명 (Plus/Pro/Studio)
│   ├── 다음 결제일
│   └── 남은 크레딧
├── 요금제 비교 & 변경
│   ├── 업그레이드 버튼
│   └── 다운그레이드 버튼
├── 크레딧 구매 섹션
│   └── 패키지 카드 3개
└── 결제 내역
    └── 페이지네이션 테이블
```

#### 4.2 구현 체크리스트

- [ ] `/dashboard/billing` 페이지 생성
- [ ] 구독 상태 표시 컴포넌트
- [ ] 요금제 변경 모달
- [ ] 크레딧 구매 카드 컴포넌트
- [ ] 결제 내역 테이블

---

### 5. 보안 및 검증 (P2 - 권장)

#### 5.1 웹훅 보안

- [ ] Polar 웹훅 시그니처 검증
- [ ] 타임스탬프 검증 (replay attack 방지)

#### 5.2 결제 무결성

- [ ] Idempotency Key 처리 (중복 결제 방지)
- [ ] 트랜잭션 로깅

#### 5.3 환불 처리

- [ ] Polar 환불 웹훅 처리
- [ ] 크레딧 차감 로직
- [ ] 환불 기록 저장

---

## 📊 완료 기준 (Definition of Done)

- [ ] 테스트 결제로 크레딧이 자동 지급됨
- [ ] 구독 활성화 시 티어가 업데이트됨
- [ ] 결제 내역이 정상적으로 조회됨
- [ ] 웹훅 시그니처 검증이 동작함
- [ ] 프로덕션 환경에서 결제 테스트 완료

## 🔗 관련 문서

- [MVP 비즈니스 전략](../PLANS.md) - 요금제 및 크레딧 정책 상세
- [크레딧 시스템](../prod/prod_credit_system.md) - 현재 구현된 크레딧 로직
- [Polar.sh 문서](https://docs.polar.sh/) - 외부 문서
