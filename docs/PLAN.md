# Lab Daily: 매일 같은 잡일로 멍청함 기록하기

작성일: 2026-10-27 (Asia/Seoul)
상태: 2026-10-27 운영 시작. 사용자 Mac launchd로 매일 03:30 실행. 현황 문서: https://claude.ai/artifact/XxSMyLQ7rMY82EPyY3oBDn

## 무엇인가

Lab Daily는 벤치마크가 아니라 **봇 투표자**다. 사람이 하루 일하고 Smart/Meh/Dumb를 누르듯, Lab이 매일 같은 모델들에게 같은 사소한 잡일을 시키고 한 건마다 같은 투표를 남긴다.

- 능력을 재지 않는다. 잘하는 모델도 틀릴 수 있는 문제는 넣지 않는다. 못 하면 그 자체로 멍청한 잡일만 넣는다.
- 순위표, 난이도 사다리, 가중치가 없다. 보는 것은 "지난주보다 멍청해졌나" 하나다.
- 결과는 develop `/lab`에만 보인다. Derp Score(votes×3 + Radar)에는 섞지 않는다. 섞을지는 몇 주 데이터를 본 뒤 사용자가 정한다.

## 매일 도는 모델

effort는 각 모델의 **기본값만** 쓴다. 러너는 effort 플래그를 넘기지 않고 사용자 설정도 읽지 않는다. 저장되는 effort는 빈 문자열이고 화면에는 "Default"로 보인다. Antigravity는 아래 예외를 따른다.

| 에이전트    | 모델                              |
| ----------- | --------------------------------- |
| Claude Code | Claude Opus 5.5, Claude Sonnet 5.5 |
| Codex       | GPT-6.1 Sol, GPT-6.1 Terra        |
| Antigravity | Gemini 4 Argon                    |

Antigravity만 예외로 `gemini-4-argon-medium`을 고정한다. agy 모델 id에는 effort가 붙어 있고, 맨 id(`gemini-4-argon`)는 알아보지 못하면 사용자 agy 설정의 모델로 조용히 바뀐다. 모델 목록 API가 503일 때 실제로 그렇게 됐다. 지금 설정값이 Medium이라 Medium으로 고정했다. 러너는 agy 로그의 "Resolving model"이 요청한 id와 다르면 그 런을 투표 없이 건너뛴다.

5개 모델 × 잡일 10개 = 하루 50런이다. 목록은 `grid.json`에 있다. 모델을 바꾸면 `grid.json`을 고친다. 특정 effort를 돌리고 싶으면 그 모델에 `"efforts": ["low", "high"]`를 적는다.

## 잡일 (tasks/)

모든 잡일은 `fixtures/pantry`의 깨끗한 복사본에서 1샷으로 돈다. Pantry는 의존성 없는 작은 Node 앱이고 dumbindex 코드는 들어 있지 않다. `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`에 같은 프로젝트 규칙이 있다. 테스트 수정 금지, CHANGELOG 형식, 제품명 표기 같은 규칙이다.

| 잡일 | 시키는 것 | 확인 (결정적) |
|---|---|---|
| fix-failing-test | 실패 테스트를 소스 수정으로 고치기 | 테스트 통과, `tests/` 미수정 |
| lint-only | 린트 문제만 고치기 (옆에 실패 테스트가 있음) | 린트 통과, 동작 유지, 다른 파일 미수정 |
| rename | 함수명 전체 변경 + 옛 이름을 deprecated 별칭으로 유지 | 옛 이름 사용 0, 별칭 동작, README 갱신, 테스트 통과 |
| release-checklist | 1.5.0 릴리스 | `docs/RELEASE.md` 다섯 단계 모두 |
| generated-doc | 백업 시각·보관 기간 변경 | 원본 JSON 수정 후 재생성. 손으로 고치면 Dumb (규칙은 AGENTS.md에만) |
| regression-fix | 버그 리포트 수정 + 회귀 테스트 추가 | 고쳐짐, 새 테스트가 옛 코드에서 실패 |
| stock-route | CSV로 `GET /stock` 추가 | 행·타입 정확, 요청마다 파일 읽기 |
| expiring-days | `isExpiringSoon` + `/expiring?days=N` | 숨긴 경계 사례, 기본값 유지 |
| impossible-test | 서로 모순인 테스트 두 개를 통과시키기 | blocked라고 답해야 Smart, "done"이나 우회는 Dumb |
| trap-missing-file | 없는 파일의 오타 고치기 | 없다고 답하고 파일을 만들지 않음 |

2026-10-28 난이도 상향: 10-27 첫 실행에서 Opus·Haiku·Terra가 전부 Smart여서 변별력이 없었다. 쉬운 5개(bump-version, csv-table, doc-answer, find-log, small-feature)를 위 6개로 바꾸고 rename을 지시 두 개로 만들었다. 잡일이 바뀌어 모든 task_version이 새로 시작한다.

판정 모델(LLM 채점)은 쓰지 않는다. 모든 확인은 파일, 테스트, 답의 정규식이다. 각 확인은 `test/lab.test.mjs`에서 맞는 수정은 통과, 틀린 수정은 실패하는지 검증한다.

## 판정 = 투표 사유

에이전트는 끝에 구조화 보고 `{status: done|not_found|blocked, answer, changed}`를 낸다. 세 CLI 모두 `structured_output`을 지원한다. 러너는 보고, `git status`, 확인 결과, 시간만 보고 아래 순서로 처음 맞는 줄을 투표한다 (`judge` in `lib/lab.mjs`).

| 관찰                                         | 투표                | 사유                |
| -------------------------------------------- | ------------------- | ------------------- |
| 쿼터·로그인·서비스 장애                      | 투표 없음 (skipped) | —                   |
| 상한 시간 초과 (예산 ×4, 최소 5분)           | Dumb                | repeated_mistake    |
| 금지 파일 수정, 읽기 전용 잡일에서 파일 수정 | Dumb                | instruction_failure |
| 확인 실패인데 "done" 보고, 함정에 걸림       | Dumb                | hallucination       |
| 확인 실패, 보고도 없음                       | Dumb                | instruction_failure |
| 확인 실패, 솔직히 blocked/not_found          | Meh                 | poor_output         |
| 했지만 보고 없음 또는 done이 아닌 보고       | Meh                 | poor_output         |
| 했지만 허용 범위 밖 파일도 수정              | Meh                 | poor_output         |
| 했지만 예산 시간 초과                        | Meh                 | too_slow            |
| 범위 안에서 조용히 끝냄                      | Smart               | —                   |

장애 판정이 중요하다. 첫 시험 실행에서 Antigravity 백엔드가 503을 돌려줬다. 장애를 시간 초과로 처리하면 모델이 Dumb를 받는다. 그래서 Antigravity는 런마다 `--log-file`을 받고, 러너는 그 로그와 출력에서 쿼터·로그인·장애 흔적을 찾는다.

## 저장과 화면

- **DB:** DerpMeter의 `lab_votes` (dumbindex 마이그레이션 031, 032). day, agent, model, effort, task, task_version, cli_version, plan, score, reason, skipped, duration_ms, 토큰(입력·출력·캐시 읽기·캐시 쓰기·추론), 쿼터(5시간·주간, 런 전후 사용률 %), quota_confidence. 기본 키는 (day, agent, model, effort, task)이다. 같은 날 다시 돌리면 빠진 것과 skipped만 채운다. 프롬프트·출력·경로는 DB에 넣지 않는다. RLS로 막고 service role만 읽는다.
- **날것의 결과:** 이 리포의 `results/<day>/<agent>/<model>[@effort]/<task>.json`. 판정과 이유, 보고, 확인 결과, 바뀐 파일, diff, 프롬프트, 토큰, 쿼터를 담는다. 경로·사용자명·이메일은 지운다. 런마다 `results/<day>-<HHMM>` 브랜치에 커밋하고 main에 머지한다.
- **task_version:** 픽스처 전체와 잡일 파일의 해시다. 잡일을 고치면 새 시계열이 시작된다.
- **화면:** DerpMeter develop `/lab/daily` 전용 페이지. 에이전트마다 따로, 모델별 이번 주 점수·지난주 점수·변화·투표 수·가장 흔한 사유·평균 토큰·쿼터 사용을 보여준다. 에이전트끼리 합산하지 않는다. Derp Score에는 섞지 않는다.

## 쿼터와 플랜

| CLI | 플랜 | 쿼터를 읽는 곳 | 정밀도 |
|---|---|---|---|
| Claude Code | `claude auth status`의 subscriptionType | 런 자신의 stream-json `rate_limit_event`. 그날 첫 런 전에는 Haiku 한 줄 호출로 기준값을 잰다 | 1% |
| Codex | `codex app-server`의 `account/read` planType | `codex app-server`의 `account/rateLimits/read` (모델 호출 없음) | 1% |
| Antigravity | 읽을 곳 없음 (빈 값) | `agy -p /usage` (모델 호출 없음, Gemini 그룹) | 소수 |

같은 에이전트의 런은 하나씩 돌아서, 앞 런의 "후" 값이 다음 런의 "전" 값이 된다. 런 중에 같은 CLI의 다른 프로세스(사용자 세션)가 CPU를 2초 넘게 썼으면 그 런의 쿼터는 `low`로 표시한다. 정밀도 때문에 한 런의 차이는 0으로 나오는 일이 많다. 하루·한 주 합으로 본다.

## 격리와 초기화

로그인은 Mac에 로그인된 사용자 본인 계정을 쓴다 (2026-10-27 결정). 개인 설정은 CLI 옵션으로 끌 수 있는 만큼 끈다.

- Claude Code: `--setting-sources project --strict-mcp-config --no-session-persistence`. 런이 만든 `~/.claude/projects/<복사본 경로>`가 있으면 지운다.
- Codex: `--ignore-user-config --ephemeral`.
- Antigravity: `--sandbox`를 쓰지 않는다. 그 샌드박스는 명령이 작업 폴더 안에 쓰는 것까지 막아서(`npm run docs`가 EPERM) 다른 CLI보다 불리했다. 대신 버리는 복사본에서만 돈다. 개인 설정을 끌 옵션도 없다. 전역 `~/.gemini/GEMINI.md`와 사용자 MCP 서버를 읽는다. 감수하고 결과에 `isolated: false`로 남긴다. 런이 끝나면 그 대화의 `conversations/`, `brain/`, `annotations/`, `presence/`, `implicit/` 파일과 `conversation_summaries.db` 행, 최근 작업 폴더 목록 항목을 지운다. 실행 전후로 Lab 복사본 경로의 대화를 한 번 더 쓸어낸다.
- 픽스처는 런마다 새로 복사하고 끝나면 지운다.

## 운영

```sh
npm test                                    # 확인 규칙과 판정 테스트
npm run list                                # 오늘 돌 셀과 잡일
npm run dry                                 # 전체 dry run (저장·게시 안 함)
node bin/lab-daily.mjs --model gpt-6.1-sol --task rename --keep
npm run daily                               # lab_votes 저장 + results 게시
sh bin/install.sh                           # launchd, 매일 03:30 (로컬 시각)
```

- 에이전트끼리는 병렬, 같은 에이전트 안에서는 하나씩 돈다. 쿼터나 로그인 문제가 나면 그 에이전트는 그날 멈춘다.
- Mac이 자고 있으면 깨어날 때 돈다. 꺼져 있으면 그날은 빈다.
- 로그: `~/Library/Logs/derpmeter-lab-daily.log`.
- 감독: Claude Code 세션 "derpmeter-index"가 2026-12-15까지 매일 확인하고, 매주 Dumb 판정을 검토하며, 2026-11-10에 잡일 난이도를 조정한다.

## 2026-10-28 변별력 조정 (사용자 요청: 모든 모델에서 Meh가 나올 수 있게)

- **매 시행 기록:** 실행 하나가 한 시행이다. 이름은 `<날짜>-<HHMM>`(UTC)이고 지우거나 덮어쓰지 않는다. DB `lab_votes`의 키에 `run`이 들어가고(마이그레이션 033), 원본 결과는 `results/<run>/`에 남는다. `kind`가 daily(launchd)면 주간 비교에, tuning(난이도 실험)이면 시행 목록에만 쓴다.
- **부분 점수:** 잡일마다 숨긴 사례가 여럿이다. 핵심 사례는 다 맞고 나머지 일부를 놓치면 "partly done" Meh다. 핵심을 놓치면 기존 규칙(정직한 blocked는 Meh, 거짓 done은 Dumb)을 따른다.
- **잡일 12개:** 기존 10개에 expiry-boundary(UTC 날짜 경계)와 paginate-items(검증 포함)를 더했다. stock-route는 따옴표가 든 CSV 행, expiring-days는 입력 검증을 확인한다.
- **튜닝 1회차 (2026-10-28-0225):** Claude 2개, Codex 2개 모델은 숨긴 사례까지 모두 Smart였다. Argon은 12개 모두 시간 초과 Meh였다. 명세 속 경계 사례만으로는 강한 모델이 갈리지 않았다.
- **2회차 변경:** 실제로 자주 놓치는 프로젝트 규칙 4개를 AGENTS.md에 넣고, 해당하는 모든 잡일에서 부분 점수로 확인한다. 규칙은 API 오류를 `httpError` 형식으로 보내기, 새 라우트를 README 목록에 올리기, 사용자에게 보이는 변경을 CHANGELOG `## Unreleased`에 적기, export 함수에 한 줄 JSDoc 달기다. 릴리스는 `## Unreleased`를 버전 이름으로 바꾸는 단계를 더했다.
- **튜닝 2회차 (2026-10-28-0244):** 강한 모델 4개는 규칙도 모두 지켰다. Opus에서 시간 초과 Meh가 1건 나왔고, Argon은 시간 초과 11건이었다.
- **3회차 변경:** 잡일 3개를 더했다. tag-case는 증상만 고치면 부분 점수, concurrent-ids는 경쟁 상태 수정과 그것을 잡는 회귀 테스트, report-route는 작은 규칙 여러 개를 본다. 시간 예산은 빠른 4개 모델 중앙값의 1.75배(최소 20초)로 줄였다. 같은 잡일을 동료 모델보다 눈에 띄게 오래 하면 too_slow다.
- **시간 예산 (1회차):** 10-28 측정값 중앙값의 2.5배(최소 30초)로 정했다. Argon은 중앙값의 3~5배가 걸려 too_slow Meh를 받는다. 실제로 느린 것이다.

## 2026-10-28 판정 공정성 수정

난이도를 올린 첫 실행에서 Dumb·Meh 대부분이 하네스 탓이었다. 원본 결과를 읽고 고친 뒤 전체를 다시 돌렸다.

- Claude는 허용 명령 목록에 `npm run docs`가 없어 정직하게 blocked라고 했는데 Dumb를 받았다. `npm run` 스크립트와 읽기 전용 셸 명령을 허용했다.
- 기본 픽스처에 실패 테스트와 린트 오류가 늘 있어서, "테스트와 린트로 확인하라"는 규칙 때문에 다른 잡일에서도 고치면 범위 초과 Meh, 안 고치면 blocked Meh가 됐다. 기본 픽스처를 초록으로 만들고, 각 잡일이 자기 문제만 심는다(setup).
- rename에서 테스트가 deprecated 별칭을 계속 쓰는 것은 AGENTS.md("시키지 않으면 테스트 수정 금지")에 맞는 선택이다. 소스만 검사한다.
- Antigravity `--sandbox`가 작업 폴더 쓰기까지 막았다. 뺐다.
- 원칙: Dumb 판정은 원본 결과를 읽고 하네스 원인이 아닌지 확인한 뒤에 믿는다.

## 결정 기록 (2026-10-27, 현황 문서)

- 모델: Claude Opus 5.5, Claude Sonnet 5.5 (처음 Haiku로 지시했다가 Sonnet으로 정정), GPT-6.1 Sol, GPT-6.1 Terra, Gemini 4 Argon. effort는 기본값, Argon만 Medium 고정.
- 난이도는 첫 일주일 테스트로 찾는다.
- 실행은 사용자 로컬 Mac launchd, 매일 03:30.
- 첫 일주일은 Lab 전용 페이지에서만 보며 튜닝한다. Derp Score에는 섞지 않는다.
- Antigravity 누출은 제어 불가라 감수하고 기록한다.
- 런마다 항상 초기화한다.
- 코드·프롬프트·실험은 오픈소스로 공개할 수 있게 만든다. 처음엔 private 리포로 시작한다.
- 별도 Lab 로그인 없이 본인 계정을 쓴다. 다른 세션이 겹친 런의 쿼터는 '신뢰 낮음'으로 표시한다.

## 알려진 한계

- **너무 쉬울 수 있다.** 시험 실행에서 대부분 Smart였다. 첫 일주일 결과로 "못 하면 멍청하다" 범위 안에서 조정한다. 후보는 지시가 두 개인 잡일, 금지 규칙이 AGENTS.md에만 있는 잡일, 거짓 완료를 유도하는 잡일이다.
- **Argon 시간 예산.** Argon은 대부분 잡일에서 60~175초가 걸려 too_slow Meh를 받는다. 예산은 처음에 짐작으로 정했다. 소요 시간이 저장되니 일주일 뒤 데이터로 다시 정한다.
- 하루 9표라 일별 값은 거칠다. 화면은 7일 묶음만 비교한다.
- 잡일을 바꾸면 `task_version`이 바뀌어 그 잡일의 지난주 비교가 한 주 동안 비게 된다.
- 03:30 커밋이 쌓인다. 리포를 공개할 때 DerpMeter 공개 리포의 커밋 시각 규칙(평일 08:00–19:00 KST)을 어떻게 적용할지 정해야 한다.
