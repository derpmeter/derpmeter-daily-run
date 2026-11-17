# Toonify · AI 웹툰 스튜디오

[English](README.md) · [한국어](README.ko.md)

**이야기 아이디어를 AI와 함께 캐릭터, 에피소드, 웹툰 컷으로 만듭니다.**

Toonify(투니파이)는 세계관 설정부터 화풍 선택, 캐릭터 디자인, 스토리보드 편집, 이미지 생성, 에피소드 내보내기까지 하나의 흐름으로 연결하는 AI 웹툰 창작 보조 플랫폼입니다.

**Antigravity + Gemini 3 Pro로 개발한 AI Native 프로젝트**입니다.

![Toonify 프로젝트 미리보기](docs/media/dashboard.png)

## 시나리오별 UI 둘러보기

아래 GIF는 **실제 프론트엔드에 데모 데이터와 기존 샘플 일러스트**를 넣어 녹화했습니다. 인증과 AI 응답은 로컬 환경에서 대체했으며, 실제 Gemini 생성 결과나 운영 성능을 보여주는 영상은 아닙니다.

### 1. 프로젝트 생성과 세계관 설정

제목과 장르를 정하고, 세계관 아이디어를 확장한 뒤 화풍을 적용합니다.

![프로젝트·세계관 설정 흐름](docs/media/01-project-worldbuilding.gif)

### 2. 캐릭터 캐스팅

이름·나이·외형 키워드·성격을 입력하고, 역할을 선택한 뒤 완성된 프로필을 확인합니다.

![캐릭터 캐스팅 흐름](docs/media/02-character-casting.gif)

### 3. 스토리보드 편집

장면을 선택해 이미지 프롬프트를 수정하고 재생성을 요청합니다. 여러 컷을 선택해 다시 생성하는 화면도 확인할 수 있습니다.

![스토리보드 편집 흐름](docs/media/03-storyboard-editing.gif)

### 4. 모바일 검토와 내보내기

모바일 읽기 화면에서 컷을 스크롤하고, 샘플 이미지가 담긴 ZIP 파일을 내려받습니다.

![모바일 검토·ZIP 내보내기 흐름](docs/media/04-review-export.gif)

## 빠르게 UI 실행하기

Node.js 20.9 이상과 npm만 있으면 로컬 UI 데모를 실행할 수 있습니다. API 키·Clerk 계정·DB·Docker는 필요하지 않습니다. 샘플 ZIP 내보내기를 사용하려면 Python 3도 필요합니다.

```bash
git clone https://github.com/workromancer/toonify.workromancer.ai.git
cd toonify.workromancer.ai/frontend
npm ci --legacy-peer-deps
npm run demo
```

**[한국어 데모](http://127.0.0.1:3100/ko/dashboard)** 또는 **[English demo](http://127.0.0.1:3100/en/dashboard)**에 접속합니다. 변경 내용은 메모리에만 저장되며 재시작하면 초기화됩니다. 임시 복사본에서 실행하므로 원본 앱의 인증 코드는 유지되고, AI 서비스 호출도 없습니다.

실제 AI 기능까지 사용하려면 아래 [로컬 실행](#로컬-실행)을 참고하세요. 준비물·문제 해결·데모의 범위·GIF 재녹화 방법은 [실행 가이드](docs/RUNNING.md)에 정리했습니다.

## 주요 기능

1. 프로젝트를 만들고 AI 제안으로 세계관, 장르, 분위기를 구체화합니다.
2. 화풍을 선택하고 스타일 참조 이미지와 프로젝트 커버를 생성합니다.
3. 캐릭터 프로필, 참조 보드, 의상 참조를 구성합니다.
4. 에피소드 아이디어를 발전시키고 스토리보드에서 장면을 설계합니다.
5. 캐릭터·화풍·이전 컷 이미지를 참조해 컷을 생성, 수정, 재생성합니다.
6. 모바일 뷰어로 에피소드를 검토하고 세로형 이미지나 ZIP으로 내보냅니다.

워크스페이스, 생성 크레딧, 한국어·영어 UI도 포함합니다. 캐릭터 일관성을 높이기 위해 참조 이미지와 프롬프트를 활용하며, 생성 결과에는 차이가 있을 수 있습니다.

## 개발 기간과 Git 이력

**2026년 11월 16일에 가져온 Git 이력**을 기준으로 정리했습니다. 날짜는 모두 **한국 표준시(KST, UTC+9)**이며, 일수는 시작일과 종료일을 포함한 달력상 기간입니다. 실제 투입 시간을 의미하지 않습니다.

| 범위 | 기록된 개발 기간 | 달력상 기간 | 커밋 수 |
| --- | --- | --- | --- |
| 기본 브랜치 `main` | 2025.12.06 ~ 2026.01.07 | 33일 | 313개 |
| 가져온 전체 브랜치 | 2025.12.06 ~ 2026.01.12 | 38일 | 중복 제외 323개 |

- **최초 기록:** [`b46ec0a`](https://github.com/workromancer/toonify.workromancer.ai/commit/b46ec0a), 2025년 12월 6일 22:57 KST.
- **기존 main 마지막 기록:** [`19f8c41`](https://github.com/workromancer/toonify.workromancer.ai/commit/19f8c41), 2026년 1월 7일 22:46 KST.
- **추가 기능 개발:** [`feature/improve-cut-generation`](https://github.com/workromancer/toonify.workromancer.ai/tree/feature/improve-cut-generation) 브랜치의 [`3489932`](https://github.com/workromancer/toonify.workromancer.ai/commit/3489932), 2026년 1월 12일까지.
- **GitHub 저장소 생성일:** 2025년 12월 7일. 저장소 생성일이나 마지막 push 날짜는 개발 기간과 구분합니다.

위 수치는 오픈소스 공개 준비 변경 이전의 개발 이력입니다. 이후 유지보수와 문서 커밋은 포함하지 않습니다.

## AI Native 개발 방식

이 프로젝트는 **Antigravity + Gemini 3 Pro**를 개발 도구로 활용했습니다. 저장소에는 문서 갱신, 린트, 커밋, Google Cloud 인증, 배포를 위한 [에이전트 워크플로](.agent/workflows/)와 [프롬프트 설계·구현 계획](docs/ai-prompts/README.md)이 포함되어 있습니다.

**개발에 사용한 AI**와 **서비스 실행 중 호출하는 AI**는 구분합니다. 현재 백엔드 [`base.py`](backend/app/services/ai/base.py)에 설정된 런타임 모델은 다음과 같습니다.

| 서비스 내 용도 | 설정된 모델 |
| --- | --- |
| 세계관·화풍·캐릭터 텍스트·에피소드 기획 | `gemini-3-flash-preview` |
| 이미지 생성·수정 | `gemini-3-pro-image-preview` |
| 텍스트 임베딩 | `gemini-embedding-001` |

위 목록은 저장소에 기록된 설정이며, 현재 제공 여부를 보장하는 목록은 아닙니다. 실행 환경에서 해당 모델을 사용할 수 있는지 확인하고 필요한 경우 설정을 변경해야 합니다.

## 아키텍처와 기술 스택

```text
브라우저 → Next.js 프론트엔드 / API 프록시 → FastAPI 백엔드
                                                ├─ PostgreSQL + pgvector
                                                ├─ Gemini / Vertex AI
                                                └─ MinIO(로컬) / Cloud Storage(운영)
```

| 영역 | 저장소 기준 기술 |
| --- | --- |
| 프론트엔드 | Next.js 16, React 19, TypeScript, Tailwind CSS 4, Zustand, next-intl |
| 백엔드 | Python, FastAPI, SQLModel, Pydantic, Alembic, Google Gen AI SDK |
| 데이터·저장소 | PostgreSQL 16 + pgvector, MinIO, Google Cloud Storage |
| 인증 | Clerk 연동 및 기존 이메일·비밀번호 인증 |
| 배포 | Docker, Google Cloud Run, Cloud SQL, Artifact Registry |

## 로컬 실행

본인의 인증 정보로 실제 기능을 실행하는 방법입니다. 외부 서비스 없이 화면만 확인하려면 위의 UI 데모를 사용하세요. 자세한 설명은 [실행 가이드](docs/RUNNING.md)를 참고하세요.

**Node.js 20.9 이상**(Docker 빌드는 Node 20 사용), **Python 3.11**, **Docker Compose**가 필요합니다. 본인의 Gemini API 인증 정보와 Clerk 개발용 키도 준비해야 합니다. 기존 이메일·비밀번호 로그인을 사용하더라도 프론트엔드에서 Clerk를 초기화합니다.

```bash
git clone https://github.com/workromancer/toonify.workromancer.ai.git
cd toonify.workromancer.ai
cp backend/.env.example backend/.env.local
cp frontend/.env.example frontend/.env.local
```

두 환경 파일을 수정합니다. 백엔드 `SECRET_KEY`에는 새로 생성한 고유 값을 넣고, 본인의 `GEMINI_API_KEY`와 Clerk 개발용 키를 설정합니다. 예제 DB·MinIO 인증 정보는 Docker Compose와 일치하는 로컬 개발용 값입니다.

```bash
# PostgreSQL과 MinIO 실행. Compose는 앱 서버를 실행하지 않습니다.
docker compose up -d

# 터미널 1: 백엔드
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

```bash
# 터미널 2: 저장소 루트에서 프론트엔드 실행
cd frontend
npm ci --legacy-peer-deps
npm run dev
```

- 프론트엔드: [localhost:3000](http://localhost:3000)
- API 문서: [localhost:8000/docs](http://localhost:8000/docs)
- MinIO 콘솔: [localhost:9001](http://localhost:9001)

백엔드는 시작 시 테이블을 초기화합니다. 기존 개발용 초기화 과정에서 샘플 계정도 생성하므로, 외부에 서비스를 배포하기 전에 개발용 시드를 검토하고 제거해야 합니다. AI 요청에는 외부 서비스가 필요하며 비용이 발생할 수 있습니다.

선택적으로 `./dev.sh`를 사용할 수 있습니다. 의존성 설치, Compose 재시작, 샘플 데이터 입력, 앱 서버 실행을 수행하며 **3000·8000 포트의 기존 프로세스를 종료**하므로 전용 로컬 환경에서 실행하세요.

Vertex AI를 사용하려면 Google Cloud 프로젝트·리전·Application Default Credentials를 설정합니다. [인증 워크플로](.agent/workflows/gcloud-auth.md)를 참고하세요. GitHub Actions 자동 배포는 제거했습니다. 남아 있는 수동 배포 스크립트에는 본인의 클라우드 리소스와 비밀값이 필요하며, 환경별 설정값을 검토한 뒤 사용해야 합니다.

## 저장소 구조

| 경로 | 내용 |
| --- | --- |
| [`frontend/`](frontend/) | 스튜디오 UI, 다국어 페이지, API·이미지 프록시 |
| [`backend/`](backend/) | API, 데이터 모델, AI 서비스, 저장소, 마이그레이션 |
| [`scripts/`](scripts/) | 인프라·배포 유틸리티 |
| [`.agent/workflows/`](.agent/workflows/) | AI 기반 개발 워크플로 |
| [`docs/`](docs/) | 제품·구조·프롬프트·배포 문서 |

## 관련 문서

- [실행·문제 해결 가이드 — 한국어 / English](docs/RUNNING.md)
- [제품 사용 설명서](docs/PRODUCT_MANUAL.md)
- [웹툰 제작 과정](docs/WEBTOON_CREATION_PROCESS.md)
- [API 레퍼런스](docs/API_REFERENCE.md)
- [AI 모델·프롬프트](docs/AI_MODELS.md)
- [캐릭터 일관성 설계 — 한국어](docs/character-consistency/character-consistency-solution-ko.md) · [English](docs/character-consistency/character-consistency-solution-en.md)
- [운영 배포 가이드](docs/prod/deployment_guide_ko.md)
- [로드맵](docs/roadmap/README.md)

일부 설계·운영 문서는 이전 구현을 설명합니다. 현재 의존성·설정·동작은 패키지 명세와 소스 코드를 기준으로 확인하세요.

## 기여 방법

문제 상황, 기대 동작, 재현 방법을 포함해 이슈를 작성해 주세요. PR에는 변경 내용과 검증 결과를 설명하고, 인증 정보·사용자 데이터·클라우드 환경 생성 파일을 포함하지 마세요.

프론트엔드 변경은 개발 환경을 설정한 뒤 `cd frontend && npm run lint`, `npm run build`로 확인합니다. 백엔드 변경은 로컬 환경에서 해당 API 동작을 검증합니다.

## 라이선스

소스 코드는 [MIT 라이선스](LICENSE)로 제공합니다. 외부 의존성에는 각각의 라이선스가 적용됩니다. 외부 서비스와 생성 콘텐츠에는 해당 이용 조건이 적용되며, 이 라이선스가 제3자의 캐릭터·브랜드·참조 이미지에 대한 권리를 부여하지는 않습니다.
