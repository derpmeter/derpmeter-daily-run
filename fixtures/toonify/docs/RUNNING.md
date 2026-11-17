# Running Toonify / Toonify 실행 가이드

[English README](../README.md) · [한국어 README](../README.ko.md)

## English

### 1. Explore the UI without API keys

The local demo uses the real frontend components with in-memory fixture data. It needs Node.js 20.9+ and npm. Python 3 is additionally needed for the sample ZIP export. Docker, a database, a Clerk account, and Gemini credentials are not required.

```bash
git clone https://github.com/workromancer/toonify.workromancer.ai.git
cd toonify.workromancer.ai/frontend
npm ci --legacy-peer-deps
npm run demo
```

Open **http://127.0.0.1:3100/en/dashboard**. For Korean, open **http://127.0.0.1:3100/ko/dashboard**. Stop with Ctrl+C.

The demo copies the frontend into a temporary directory, stubs authentication and analytics only in that copy, and runs a fixture API on the next port (3101 by default). Both servers bind to loopback only. It never edits the application's authentication code, copies local `.env` files, calls AI models, or writes to a real database. Creating a project, casting a character, editing a scene, and exporting sample panel images work against in-memory data. Restarting resets all changes. Generated images are represented by existing repository illustrations; this is not an AI quality or latency benchmark. The demo supports ZIP export; stitched webtoon-strip export requires the full backend. Other screens may have incomplete fixture coverage and return an explicit “not implemented” response.

The regular application retains its original locale routing. The disposable demo uses explicit `/en` and `/ko` prefixes so the recording language is reproducible. For port conflicts, use `DEMO_PORT=3200 npm run demo`; the fixture API then uses 3201. No production deployment should use this sandbox.

### 2. Run the complete application

Prepare Node.js 20.9+ (Node 20 is used by the Docker build), Python 3.11, Docker with Compose, your Gemini credentials, and a Clerk development instance. These instructions are for local development. Preview-model access must be verified for your own Google account.

From the repository root:

```bash
cp backend/.env.example backend/.env.local
cp frontend/.env.example frontend/.env.local
```

Fill in these values:

| File | Required configuration |
| --- | --- |
| `backend/.env.local` | A new, unique `SECRET_KEY`; `GEMINI_API_KEY` for direct API mode. The template's local database/MinIO values match Compose. |
| `frontend/.env.local` | Your `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` from a development Clerk instance. Keep `INTERNAL_BACKEND_URL=http://localhost:8000`. |

Generate a signing key with `python3 -c "import secrets; print(secrets.token_urlsafe(48))"` and paste the result into the backend file. Never reuse historical development keys. Clerk remains necessary because the original frontend initializes Clerk even with legacy login selected.

Start infrastructure only:

```bash
docker compose up -d
docker compose ps
```

Start the backend in terminal 1:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Start the frontend in terminal 2, from the repository root:

```bash
cd frontend
npm ci --legacy-peer-deps
npm run dev
```

Open **http://localhost:3000**. API docs are at **http://localhost:8000/docs**, the health endpoint is **http://localhost:8000/health**, and MinIO's console is at **http://localhost:9001**. Compose starts PostgreSQL and MinIO, not the frontend or backend.

The backend creates tables and a development sample user on startup. For an empty local database you can additionally run `python seed_db.py` from `backend/` with the virtual environment active to populate genres and sample data. That script resets the sample user's password and is intended only for disposable local data. The sample account is `test@example.com` / `password`. Never expose it in a deployed service.

In direct Gemini API mode keep `STORAGE_TYPE=minio`, set `GEMINI_API_KEY`, and leave `GOOGLE_CLOUD_PROJECT` empty if unused. For Vertex AI leave the API key empty, set your project and location, and authenticate with Application Default Credentials; see [the authentication workflow](../.agent/workflows/gcloud-auth.md). `STORAGE_TYPE=gcs` selects the Vertex AI path and Cloud Storage, so it is not a drop-in replacement for the local MinIO setup.

Stop application servers with Ctrl+C and infrastructure with `docker compose down`. Do not add `-v` if you intend to keep volumes. The optional `./dev.sh` helper also restarts Compose, seeds data, and terminates processes on ports 3000/8000; the separate-terminal setup above makes each step easier to inspect.

### Troubleshooting

| Symptom | What to check |
| --- | --- |
| Missing settings or environment-variable error | Both `.env.local` files exist; start the backend from `backend/`; fill every required field in the template. |
| Clerk publishable-key error | Configure a real development Clerk instance even when using legacy login. |
| Database connection refused | Docker is running, `docker compose ps` shows the DB ready, and port 5432 is available. |
| MinIO image upload/download failure | Check ports 9000/9001, local credentials, the `toonify-assets` bucket, and Compose's bucket-initialization output. |
| Gemini authentication or model-not-found error | Check API mode versus Vertex AI mode, credentials, project/location, model access and provider availability. Model IDs are in `backend/app/services/ai/base.py`. |
| Port already in use | Use an available demo port or stop the process you own on the required application/DB/storage port. |

The legacy application has existing lint errors; this release preparation does not claim a clean lint baseline or a fully tested production deployment. The retired hosted service is not required to try the local demo. GitHub Actions deployment has been removed; manual cloud scripts remain for reference and must be adapted to your own resources.

### Recreate README GIFs

Install FFmpeg and Python 3, then install the optional recorder dependencies and Chromium:

```bash
npm install --prefix scripts/demo
cd scripts/demo
npx playwright install chromium
cd ../..
```

Keep `cd frontend && npm run demo` running in another terminal, then from the repository root run:

```bash
npm --prefix scripts/demo run capture
```

The recorder exercises the actual UI, saves a dashboard screenshot and four scenario GIFs into `docs/media/`, and validates that the downloaded sample ZIP contains readable images. Use a freshly started demo for a clean recording. Optional `DEMO_URL` may point only to a local demo address; `CHROMIUM_PATH` selects an existing browser executable. The recordings illustrate fixture-backed UI behavior, not live Gemini requests.

## 한국어

### 1. API 키 없이 UI 둘러보기

실제 프론트엔드 컴포넌트에 메모리 기반 데모 데이터를 연결했습니다. Node.js 20.9 이상과 npm이 필요하고, 샘플 ZIP 내보내기에는 Python 3도 필요합니다. Docker·DB·Clerk 계정·Gemini 키는 필요하지 않습니다.

```bash
git clone https://github.com/workromancer/toonify.workromancer.ai.git
cd toonify.workromancer.ai/frontend
npm ci --legacy-peer-deps
npm run demo
```

영어 화면은 **http://127.0.0.1:3100/en/dashboard**, 한국어 화면은 **http://127.0.0.1:3100/ko/dashboard**에서 확인합니다. 종료는 Ctrl+C입니다.

프론트엔드를 임시 폴더에 복사한 뒤 그 복사본에서만 인증과 분석을 대체하고, 별도 데모 API를 다음 포트(기본 3101)에 띄웁니다. 두 서버 모두 로컬 연결만 받습니다. 원본 앱의 인증 코드를 수정하거나 로컬 `.env`를 복사하지 않으며, AI 호출과 실제 DB 저장도 없습니다. 프로젝트 생성·캐릭터 캐스팅·컷 편집·샘플 이미지 내보내기는 메모리 데이터로 동작하고 재시작하면 초기화됩니다. 생성 결과는 저장소의 기존 일러스트로 대신하므로 AI 품질·응답 속도를 보여주는 데모는 아닙니다. 데모는 ZIP 내보내기를 지원하며 세로형 이미지 병합은 전체 백엔드에서 실행해야 합니다. 일부 화면은 데모 데이터가 구현되지 않아 명시적인 미지원 응답을 반환할 수 있습니다.

원본 앱의 다국어 경로는 유지하며, 임시 데모에서만 `/en`·`/ko` 접두사를 사용합니다. 포트 충돌 시 `DEMO_PORT=3200 npm run demo`로 실행하면 API는 3201을 사용합니다. 운영 배포에 이 데모를 사용하지 마세요.

### 2. 실제 AI 기능까지 실행하기

Node.js 20.9 이상(Docker 빌드는 Node 20), Python 3.11, Docker Compose, 본인의 Gemini 인증 정보와 Clerk 개발용 인스턴스를 준비합니다. 미리보기 모델의 이용 가능 여부는 본인의 Google 계정에서 확인해야 합니다.

저장소 루트에서 환경 파일을 복사합니다.

```bash
cp backend/.env.example backend/.env.local
cp frontend/.env.example frontend/.env.local
```

- `backend/.env.local`: 새 `SECRET_KEY`와 직접 API 방식의 `GEMINI_API_KEY`를 입력합니다. 로컬 DB·MinIO 기본값은 Compose와 일치합니다.
- `frontend/.env.local`: Clerk 개발용 `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`를 입력합니다. `INTERNAL_BACKEND_URL`은 `http://localhost:8000`입니다.
- 서명 키는 `python3 -c "import secrets; print(secrets.token_urlsafe(48))"`로 새로 생성합니다. 과거 개발용 키는 재사용하지 마세요. 기존 이메일 로그인을 사용해도 원본 프론트엔드가 Clerk를 초기화하므로 Clerk 키가 필요합니다.

```bash
# 저장소 루트: PostgreSQL·MinIO만 실행
docker compose up -d
docker compose ps

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

접속 주소는 프론트엔드 **http://localhost:3000**, API 문서 **http://localhost:8000/docs**, 상태 확인 **http://localhost:8000/health**, MinIO 콘솔 **http://localhost:9001**입니다. Compose는 앱 서버를 실행하지 않습니다.

백엔드는 시작할 때 테이블과 개발용 샘플 계정을 생성합니다. 빈 로컬 DB에 장르와 샘플 데이터를 더 넣으려면 가상환경이 활성화된 `backend/`에서 `python seed_db.py`를 실행할 수 있습니다. 이 스크립트는 샘플 계정의 비밀번호를 초기화하므로 폐기 가능한 로컬 데이터에만 사용하세요. 샘플 계정은 `test@example.com` / `password`이며 외부에 배포하는 서비스에서는 제거해야 합니다.

직접 Gemini API를 사용하면 `STORAGE_TYPE=minio`와 본인의 `GEMINI_API_KEY`를 설정합니다. 사용하지 않는 `GOOGLE_CLOUD_PROJECT`는 빈 값으로 둘 수 있습니다. Vertex AI를 사용하면 API 키는 비우고 프로젝트·리전과 Application Default Credentials를 설정합니다. [인증 워크플로](../.agent/workflows/gcloud-auth.md)를 참고하세요. `STORAGE_TYPE=gcs`는 Vertex AI와 Cloud Storage 경로를 선택하므로 로컬 MinIO 설정을 그대로 대체하지는 않습니다.

앱 서버는 Ctrl+C, 인프라는 `docker compose down`으로 종료합니다. 볼륨을 보존하려면 `-v`를 추가하지 마세요. `./dev.sh`는 Compose 재시작·데이터 입력과 3000/8000 포트의 프로세스 종료도 수행하므로, 처음에는 터미널을 나눠 실행하는 편이 각 단계를 확인하기 쉽습니다.

### 자주 막히는 부분

| 증상 | 확인할 내용 |
| --- | --- |
| 환경변수·설정 누락 | `.env.local` 두 개를 만들었는지, 백엔드를 `backend/`에서 실행했는지, 필수 값을 채웠는지 확인합니다. |
| Clerk 키 오류 | 기존 이메일 로그인을 사용해도 Clerk 개발용 키가 필요합니다. |
| DB 연결 실패 | Docker 실행 상태, `docker compose ps`, 5432 포트 충돌을 확인합니다. |
| 이미지 업로드·다운로드 실패 | MinIO 9000/9001 포트, 로컬 인증 정보, `toonify-assets` 버킷과 초기화 로그를 확인합니다. |
| Gemini 인증·모델 오류 | API/Vertex 모드, 인증 정보, 프로젝트·리전, 모델 접근 권한과 제공 여부를 확인합니다. 모델 ID는 `backend/app/services/ai/base.py`에 있습니다. |
| 포트 충돌 | 데모는 `DEMO_PORT`를 바꾸고, 앱·DB·저장소는 해당 포트를 사용하는 본인의 프로세스를 확인합니다. |

기존 앱에는 린트 오류가 남아 있습니다. 이번 공개 준비가 운영 배포 전체의 검증을 의미하지는 않습니다. 종료한 기존 서버 없이도 로컬 데모를 실행할 수 있습니다. GitHub Actions 자동 배포는 제거했으며, 수동 클라우드 배포 스크립트는 본인의 환경에 맞게 수정해야 합니다.

### README GIF 다시 만들기

FFmpeg·Python 3를 설치하고 녹화용 선택 의존성과 Chromium을 준비합니다.

```bash
npm install --prefix scripts/demo
cd scripts/demo
npx playwright install chromium
cd ../..
```

다른 터미널에서 `cd frontend && npm run demo`를 실행한 상태로, 저장소 루트에서 다음 명령을 실행합니다.

```bash
npm --prefix scripts/demo run capture
```

실제 UI를 조작해 `docs/media/`에 대시보드 캡처와 네 가지 시나리오 GIF를 저장하고, 내려받은 샘플 ZIP의 이미지도 검증합니다. 새로 시작한 데모를 사용해야 초기 상태로 녹화됩니다. `DEMO_URL`은 로컬 데모 주소만 허용하며, `CHROMIUM_PATH`로 기존 브라우저 실행 파일을 지정할 수 있습니다. 녹화는 실제 Gemini 호출이 아닌 데모 데이터 기반 화면 흐름을 보여줍니다.
