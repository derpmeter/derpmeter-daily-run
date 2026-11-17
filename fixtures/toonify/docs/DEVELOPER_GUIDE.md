# 🛠 개발 가이드 (DEVELOPER GUIDE)

본 문서는 Toonify 프로젝트의 기술 스택, 시스템 아키텍처, 설치 및 실행 방법을 설명합니다.

## 1. 기술 스택 (Tech Stack)

| 구분         | 기술 (Technology) | 버전/비고                           |
| :----------- | :---------------- | :---------------------------------- |
| **Frontend** | **Next.js**       | v15 (App Router 사용)               |
|              | **React**         | v19                                 |
|              | **Language**      | TypeScript                          |
|              | **Styling**       | Tailwind CSS v4, Framer Motion      |
|              | **State Mgmt**    | Zustand                             |
|              | **Data Fetching** | Axios, React Query (TanStack Query) |
| **Backend**  | **FastAPI**       | Python 3.10+                        |
|              | **ORM**           | SQLModel (SQLAlchemy Wrapper)       |
|              | **Validation**    | Pydantic                            |
| **Database** | **PostgreSQL**    | v15+ (pgvector 확장 사용)           |
| **Infra**    | **Docker**        | Docker Compose 기반 로컬 개발       |
| **AI**       | **Google Gemini** | 텍스트 분석 및 이미지 생성          |

## 2. 프로젝트 구조 (Directory Structure)

```bash
toonify.workromancer.ai/
├── backend/                # Backend Root
│   ├── app/
│   │   ├── api/            # API Router & Endpoints (v1)
│   │   ├── core/           # Config(settings), Security
│   │   ├── db/             # Database Session & Init
│   │   ├── models/         # SQLModel Database Models
│   │   ├── schemas/        # Pydantic 스키마 (중앙화)
│   │   ├── services/       # 비즈니스 로직 (ai/, billing, storage 등)
│   │   └── main.py         # App Entry Point
│   ├── scripts/            # 유틸리티 스크립트 (DB 초기화 등)
│   └── requirements.txt    # Python 의존성
├── frontend/               # Frontend Root
│   ├── src/
│   │   ├── app/            # Next.js App Router Pages
│   │   ├── components/     # Reusable UI Components
│   │   ├── lib/            # 유틸리티 함수
│   │   └── store/          # Zustand State Stores
│   └── package.json
├── infra/                  # 인프라 관련 설정 파일
├── docs/                   # 프로젝트 문서
├── docker-compose.yml      # 전체 서비스 실행 설정
└── dev.sh                  # 개발 편의 스크립트
```

## 3. 로컬 개발 환경 설정 (Setup & Run)

### 사전 요구사항 (Prerequisites)

- Docker & Docker Compose
- Node.js 18+
- Python 3.10+

### 실행 방법 1: Docker Compose (권장)

전체 서비스를 컨테이너로 띄웁니다.

```bash
docker-compose up -d --build
```

- Frontend: http://localhost:3000
- Backend DOCS: http://localhost:8000/docs
- DB: 5432 포트

### 실행 방법 2: 로컬 실행 (Manual)

**Backend**

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

## 4. 주요 데이터 모델 및 관계

- **Workspace**: 유저의 작업 공간
- **Project**: 웹툰 프로젝트 단위 (Genre, Worldview 포함)
- **Character**: 프로젝트에 속한 등장인물 (Image, Personality)
- **Episode**: 프로젝트 내의 에피소드
- **Scene (Cut)**: 에피소드를 구성하는 장면 단위. 프롬프트와 생성된 이미지 URL을 가짐.

## 5. 핵심 로직 설명

### AI 이미지 생성 (Image Generation)

1.  **프롬프트 조합**: 유저 입력(대사/지문) + 캐릭터 외형 묘사 + 화풍(Style) 프롬프트 + 세계관 프롬프트.
2.  **API 호출**: Google Gemini (또는 설정된 AI 모델) API 호출.
3.  **후처리**: 생성된 이미지를 저장소(Local or S3)에 저장하고 URL을 DB에 기록.

### 일관성(Consistency) 전략

- 캐릭터 생성 시 고정된 Seed 또는 캐릭터 LoRA/Embedding을 활용하는 구조 (현재는 프롬프트 엔지니어링 의존도가 높음, 추후 고도화 필요).

## 6. 배포 (Deployment)

- 현재 개발 단계로 Local Docker 환경에 최적화되어 있습니다.
- 운영 배포 시 Dockerfile을 기반으로 K8s 또는 Cloud Run 등에 배포 가능합니다.
