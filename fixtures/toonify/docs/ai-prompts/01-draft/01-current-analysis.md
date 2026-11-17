> Model: Claude Opus 4.5

# 📋 현재 AI 프롬프트 분석

> 현재 Toonify 프로젝트의 AI 서비스 프롬프트 현황 및 문제점 분석

## 🔍 서비스별 프롬프트 현황

### 1. 캐릭터 AI 서비스 (`text/character.py`)

| 함수명                                 | 설명                        | 시스템 프롬프트 | 비고              |
| -------------------------------------- | --------------------------- | --------------- | ----------------- |
| `augment_character_text`               | 캐릭터 컨셉 3가지 옵션 생성 | ❌ 없음         | 인라인 프롬프트만 |
| `get_character_suggestion`             | 이름/비주얼/배경 제안       | ❌ 없음         |                   |
| `generate_character_batch_suggestions` | 배치 캐릭터 10인 제안       | ❌ 없음         |                   |
| `analyze_character_concept`            | 역할/배경 분석              | ❌ 없음         |                   |

**현재 프롬프트 예시:**

```python
prompt = f"""
You are a character design expert for {style} webtoons.
Based on the initial concept and the project context, create 3 distinct character profile variations...
"""
```

### 2. 에피소드 AI 서비스 (`text/episode.py`)

| 함수명                       | 설명                  | 시스템 프롬프트 | 비고                        |
| ---------------------------- | --------------------- | --------------- | --------------------------- |
| `generate_direction_options` | 연출 옵션 3가지 생성  | ❌ 없음         |                             |
| `generate_episode_ideas`     | 에피소드 아이디어 3개 | ❌ 없음         |                             |
| `generate_prologue_ideas`    | 프롤로그 아이디어     | ✅ **있음**     | 가장 상세한 시스템 프롬프트 |
| `generate_initial_cuts`      | 초기 컷 스크립트 생성 | ❌ 없음         |                             |

**프롤로그 시스템 프롬프트 (현재 유일하게 잘 구현된 예시):**

```python
system_instruction = """
You are a senior webtoon writer and story consultant with 15+ years of experience...

## Your Expertise
- Master of visual storytelling and panel-by-panel narrative flow
- Deep understanding of scroll-based reading experience (mobile-first)
...
"""
```

### 3. 스타일 AI 서비스 (`text/style.py`)

| 함수명                      | 설명                 | 시스템 프롬프트 | 비고 |
| --------------------------- | -------------------- | --------------- | ---- |
| `recommend_style`           | 스타일 3개 추천      | ❌ 없음         |      |
| `augment_style_description` | 스타일 프롬프트 확장 | ❌ 없음         |      |

### 4. 세계관 AI 서비스 (`text/worldview.py`)

| 함수명              | 설명                   | 시스템 프롬프트 | 비고 |
| ------------------- | ---------------------- | --------------- | ---- |
| `augment_worldview` | 세계관 3가지 방향 제안 | ❌ 없음         |      |

### 5. 패널 이미지 서비스 (`generation/panel_service.py`)

| 함수명                 | 설명                  | 시스템 프롬프트 | 비고             |
| ---------------------- | --------------------- | --------------- | ---------------- |
| `generate_panel_image` | 웹툰 패널 이미지 생성 | ✅ **있음**     | 이미지 생성 전용 |

**현재 시스템 프롬프트:**

```python
system_parts = [
    "You are a professional webtoon artist. Your PRIMARY OBJECTIVE is visual consistency.",
    "CRITICAL RULES:",
    "1. If a STYLE REFERENCE IMAGE is provided, you MUST replicate its exact art style...",
    ...
]
```

---

## ⚠️ 문제점 분석

### 1. 시스템 프롬프트의 부재

**문제:**

- 14개 AI 함수 중 **2개만** 시스템 프롬프트 사용
- 대부분 인라인 프롬프트에 역할 한 줄만 포함
- AI의 페르소나/전문성이 일관되게 적용되지 않음

**영향:**

- 출력 품질의 변동성 높음
- 웹툰 업계 전문 용어/관습 반영 부족
- 장르별 특화 대응 어려움

### 2. 프롬프트 구조의 비일관성

**문제:**

```python
# 함수마다 다른 구조 사용
# A 함수
prompt = f"You are a character design expert..."

# B 함수
prompt = f"""
# Project Context
Title: {project_title}
...
"""

# C 함수
prompt = f"""
## Task
...
"""
```

**영향:**

- 유지보수 어려움
- 새 기능 추가 시 가이드라인 부재
- 코드 리뷰 시 품질 기준 모호

### 3. 언어 지시의 불일치

**현재 상태:**

```python
# 패턴 1
{f'IMPORTANT: All output text MUST be in {language} language.' if language else ''}

# 패턴 2
{f'If language is Korean, use Hangul.' if language and language.startswith('ko') else ''}

# 패턴 3
{f'IMPORTANT: All output text (names, descriptions) MUST be in {language} language.' if language else ''}
```

**문제:**

- 일부 함수는 두 지시 모두 포함, 일부는 하나만
- 한국어 특화 지시(존댓말/반말, 이름 규칙 등) 부재
- 자연스러운 한국어 vs 번역투 구분 없음

### 4. 컨텍스트 활용 부족

**문제:**

- 장르별 맞춤 지침 없음 (판타지 vs 로맨스 vs 스릴러)
- 프로젝트 톤앤매너 반영 미흡
- 기존 캐릭터/세계관과의 coherence 체크 부재

### 5. 한국 웹툰 특화 부족

**부재한 요소:**

- 세로 스크롤 형식 최적화 지침
- 한국 웹툰 캐릭터 아키타입 (츤데레, 회귀, 각성 등)
- 네이버/카카오 플랫폼 관습
- 한국어 대사 문법 (말풍선 길이, 줄바꿈 등)

---

## 📈 개선 우선순위

| 우선순위 | 영역                      | 영향도 | 구현 난이도 |
| -------- | ------------------------- | ------ | ----------- |
| 1        | 시스템 프롬프트 중앙화    | 높음   | 중간        |
| 2        | 캐릭터 생성 프롬프트      | 높음   | 낮음        |
| 3        | 에피소드/컷 생성 프롬프트 | 높음   | 낮음        |
| 4        | 다국어 지시 표준화        | 중간   | 낮음        |
| 5        | 장르별 프롬프트 변형      | 중간   | 중간        |

---

_다음 문서: [02-system-prompts.md](./02-system-prompts.md)_
