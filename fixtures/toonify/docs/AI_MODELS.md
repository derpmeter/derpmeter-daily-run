# AI 모델 & 프롬프트 문서 (AI Models & Prompts)

이 문서는 Toonify 백엔드에서 사용되는 AI 모델, 각 기능에 대해 구성된 프롬프트, 그리고 전달되는 파라미터를 정리한 문서입니다.

## 헬퍼 모델 구성 (Helper Models Configuration)

`AIService` (`backend/app/services/ai/`)에 설정된 모델 목록입니다:

| 키 (Key)    | 모델 ID (Model ID)           | 용도 (Purpose)                                             |
| :---------- | :--------------------------- | :--------------------------------------------------------- |
| `style`     | `gemini-3-flash-preview`     | 화풍(Art Style) 추천 및 설명 증강                          |
| `worldview` | `gemini-3-flash-preview`     | 세계관 구축, 서사 생성, 캐릭터 확장(Variation)             |
| `director`  | `gemini-3-flash-preview`     | 스토리보드 연출, 컷 기획, 시각적 디렉팅, 에피소드 아이디어 |
| `image`     | `gemini-3-pro-image-preview` | 이미지 생성 및 수정                                        |
| `embedding` | `gemini-embedding-001`       | RAG/검색을 위한 텍스트 임베딩                              |
| `lite`      | `gemini-3-flash-preview`     | 빠른 캐릭터 제안 (이름, 비주얼 키워드 등)                  |
| `analysis`  | `gemini-3-flash-preview`     | 심층 캐릭터 분석 (역할/아키타입)                           |

---

## 1. 프로젝트 & 세계관 (Project & Worldview)

### 세계관 확장 (Worldview Augmentation)

**메서드:** `augment_worldview`
**모델:** `gemini-3-flash-preview`

**파라미터:**

- `description`: 사용자의 초기 아이디어.
- `title` (선택): 프로젝트 제목.
- `subtitle` (선택): 프로젝트 부제목.
- `genres` (선택): 장르 목록.
- `language`: 출력 언어 코드 (예: "ko", "en").

**프롬프트 구조:**

```text
You are an expert webtoon scenario writer proficient in all genres.
Based on the following worldview description and project context, create 3 distinct directions/variations for this world.
The 3 options MUST be clearly distinct in style, mood, and narrative focus from each other.
Each option should have a catchy title, a short summary, and a detailed enhanced description.

Project Context:
Project Title: {title}
Subtitle: {subtitle}
Genres: {genres}

Original Description: "{description}"

{IMPORTANT: All output text (titles, summaries, descriptions) MUST be in {language} language.}

Return ONLY a JSON object with the following structure:
{
    "options": [
        {
            "id": "option_1",
            "title": "Title",
            "tone": ["Tone 1", "Tone 2"],
            "key_features": ["Feature 1", "Feature 2"],
            "description": "Short summary",
            "content": "Full detailed enhanced worldview description..."
        },
        ...
    ]
}
```

### 프로젝트 커버 생성 (Project Cover Generation)

**메서드:** `generate_project_cover_image`
**모델:** `gemini-3-pro-image-preview`

**파라미터:**

- `title`: 프로젝트 제목.
- `genre`: 장르.
- `worldview`: 전체 세계관 설명.
- `style`: 화풍 이름.
- `tones` (선택): 톤(Tone) 목록.
- `style_ref_url` (선택): 스타일 참조 이미지 URL.
- `character_image_urls` (선택): 포함할 캐릭터 이미지 URL 목록.
- `language`: 프로젝트 언어 설정.

**프롬프트 구조:**

```text
Create a high-quality webtoon cover illustration.

Title: {title}
Genre: {genre}
Art Style: {style}
Tone: {tones}

Worldview/Setting:
{worldview}

Requirements:
- The image should be eye-catching and representative of the genre and story.
- Use the user-defined art style: {style}.
- Aspect Ratio: Wide (16:9).
- Composition: Cinematic, showing the atmosphere.
        - Place the title ("{title}") and subtitle (if any) logo in the center of the cover image in a way that suits the cover aesthetic.
        - (If language is 'ko'): Ensure the title text is in Korean if possible.

(If character references provided):
- INCLUDE the characters provided in the reference images. Place them naturally in the scene according to the worldview.

(If style reference provided):
- IMPORTANT: Mimic the art style of the first provided image exactly.
```

_참고: 참조 이미지가 제공되면 멀티모달(Multimodal) 입력을 사용합니다._

---

## 2. 화풍 (Art Style)

### 화풍 설명 증강 (Style Augmentation)

**메서드:** `augment_style_description`
**모델:** `gemini-3-flash-preview`

**파라미터:**

- `prompt`: 사용자의 초기/단순 화풍 설명.
- `project_context`: 프로젝트 제목, 장르, 세계관.
- `language`: 출력 언어 설정.

**프롬프트 구조:**

```text
You are a prompt engineering expert for generative AI art.
Improve the user's rough art style description into a high-quality, detailed prompt...

Task:
1. Expand on valid aesthetic keywords (lighting, texture, composition).
2. If project context is provided, ensure the style fits the genre and tone.
3. Return ONLY the improved prompt text.
```

### 스타일 추천 (Style Recommendation)

**메서드:** `recommend_style`
**모델:** `gemini-3-flash-preview`

**파라미터:**

- `description`: 세계관 또는 스토리 설명.
- `language`: 출력 언어 설정.

**프롬프트 구조:**

```text
You are an expert art director for webtoons.
Based on the following story or worldview description, recommend 3 distinct art styles that would suit the project.

Description: "{description}"

{IMPORTANT: All output text (descriptions, labels) MUST be in {language} language.}

Return ONLY a JSON object with the following structure:
{
    "options": [
        {
            "id": "style_A",
            "label": "Style Name",
            "description": "Why this fits the story.",
            "sample_image_url": "..." (Ignored/Re-generated)
        },
        ...
    ]
}
```

**후속 이미지 생성 (Style Preview Generation):**
각 추천 스타일 또는 사용자 생성 스타일에 대해 샘플 이미지를 생성합니다:
`Prompt`: "Create a high-quality representative illustration of this art style: {style_desc}... Subject: A character portrait or a scenic view..."
`Negative Prompt`: "Do NOT include any text, logos, watermarks, typography, or speech bubbles. Focus PURELY on the visual art style."
`Model`: `gemini-3-pro-image-preview` (1:1 비율)

---

## 3. 캐릭터 (Characters)

### 캐릭터 확장/변형 (Character Augmentation)

**메서드:** `augment_character_text`
**모델:** `gemini-3-flash-preview`

**파라미터:**

- `name`: 캐릭터 이름.
- `tags`: 외모 태그 목록.
- `mood`: 성격/분위기 키워드.
- `style`: 화풍.
- `project_context`: 제목, 장르, 세계관.
- `language`: 출력 언어 설정.

**프롬프트 구조:**

```text
You are a character design expert for {style} webtoons.
Based on the initial concept and the project context, create 3 distinct character profile variations that fit the world.

Project Context:
{project_context}

Input Name: {name}
Initial Tags: {tags}
Mood: {mood}

{IMPORTANT: All output text MUST be in {language} language.}

For each option, provide:
- Unique Name
- Age
- Personality
- Features
- Pros/Cons
- Bio (Origin, Goals, Quirk)
- Visual Description

Return ONLY a JSON object...
```

### 캐릭터 제안 (Character Suggestions)

**메서드:** `get_character_suggestion`
**모델:** `gemini-3-flash-preview`

**파라미터:**

- `suggestion_type`: "name" (이름), "visuals" (비주얼), "lore" (설정).
- `project_context`: 프로젝트 상세 정보.
- `current_data`: 현재 컨텍스트 딕셔너리 (이름, 나이 등).

**프롬프트 요약:**

- **이름 (Name)**: "Suggest a creative character name and a suitable age fitting for this Webtoon Project. Project Context: {context}..."
- **비주얼 (Visuals)**: "Suggest 5-7 visual appearance keywords/tags... Character Name: {name}..."
- **설정 (Lore)**: "Write a compelling, short character description/lore (2-3 sentences)... Archetype: {role}..."

### 캐릭터 분석 (Character Analysis - Archetype)

**메서드:** `analyze_character_concept`
**모델:** `gemini-3-flash-preview`

**파라미터:**

- `project_context`: 프로젝트 상세 정보.
- `name`, `age`, `visual_keywords`, `personality`.

**프롬프트 구조:**

```text
Analyze the following character concept within the provided Project Worldview and suggest the best fitting Role (Archetype) and a unique background story (Lore).

Project Context: {project_context}
Character Concept: ...

Available Roles: Protagonist, Antagonist, Second Lead, Scene Stealer.

Task:
1. Select the BEST fitting Role.
2. Write a unique "Lore".
3. Suggest stats (0-100) for Strength, Intelligence, Charisma, Luck, Empathy, Leadership.

Return ONLY a JSON object...
```

### 캐릭터 시트 생성 (Character Sheet Generation)

**메서드:** `generate_character_sheet`
**모델:** `gemini-3-pro-image-preview`

**파라미터:**

- `name`: 캐릭터 이름.
- `description`: 상세 비주얼 설명.
- `style`: 화풍.

**프롬프트 구조:**

```text
Create a Character Reference Sheet for a {style} webtoon character named {name}.

Character Description:
{description}

Composition Requirements:
- Vertical Layout (9:16 Portrait aspect ratio).
- TOP HALF: High-quality detailed Portrait/Close-up.
- BOTTOM HALF: Horizontally divided into 4 equal vertical sections (outfits/poses).
- Background: Pure white, empty, whitespace.
- Style: {style}.

NEGATIVE PROMPT: Do NOT include any text, logos, watermarks, signature, charts, buildings, scenery, trees, furniture, or complex background.
```

---

## 4. 에피소드 & 스토리보드 (Episodes & Storyboard)

### 에피소드 아이디어 (Episode Ideas)

**메서드:** `generate_episode_ideas`
**모델:** `gemini-2.5-pro`

**파라미터:**

- `project_title`, `worldview`.
- `recent_episodes`: 최근 3개 에피소드 요약.
- `language`: 출력 언어 설정.

**프롬프트 구조:**

```text
You are a webtoon writer.
Project: {project_title}
Worldview: {worldview}
Recent Episodes: {recent_episodes}

{IMPORTANT: All output text MUST be in {language} language.}

Propose 3 distinct episode ideas for the next chapter.
Return ONLY JSON...
```

### 초기 컷 기획 (Initial Cuts Planning)

**메서드:** `generate_initial_cuts`
**모델:** `gemini-2.5-pro` (Director)

**파라미터:**

- `episode_title`, `summary`.
- `style`: 화풍.
- `num_cuts`: 컷 수 (기본 6개).
- `language`: 출력 언어 설정.

**프롬프트 구조:**

```text
Plan a {num_cuts}-cut webtoon episode.
Title: {episode_title}
Summary: {summary}
Style: {style}

{IMPORTANT: All output text MUST be in {language} language.}

For each cut, determine:
- Script (Visual Description)
- Dialogues
- Panel Type (Wide, Vertical, Square)

Return ONLY JSON...
```

### 시각 연출 옵션 (Visual Direction Options)

**메서드:** `generate_direction_options`
**모델:** `gemini-3-flash-preview` (Director)

**파라미터:**

- `script`: 씬 스크립트.
- `script`: 씬 스크립트.
- `character_context`: (선택) 캐릭터 상세 정보.
- `language`: 출력 언어 설정.

**프롬프트 구조:**

```text
You are a professional webtoon director.
Analyze the following script and suggest 3 distinct visual direction options (camera angle, composition, mood).

Script: "{script}"
{character_context}

{IMPORTANT: All output text MUST be in {language} language.}

Return ONLY a JSON object...
```

### 패널 이미지 생성 - 스마트 (Panel Image Generation - Smart)

**메서드:** `generate_panel_image`
**모델:** `gemini-3-pro-image-preview`

**전처리 로직 (Preprocessing Logic):**

- **대사 (Dialogues):** `(속마음)` 및 `(thought)` 마커를 제거하고 `(Thinking)` 포맷으로 변환하여 모델이 시각적 연출(표정 등)로 해석하도록 유도 (이미지 내 텍스트 출력 방지).
- **캐릭터 (Characters):** 해당 에피소드에 처음 등장하는 캐릭터에 한해 구체적인 외모 묘사를 포함(Name Tag 방지).

**파라미터:**

- `prompt`: 씬 설명 (아래 구조로 조립됨).
- `style_ref_url`: 프로젝트 스타일 참조 이미지.
- `character_data`: 캐릭터 참조 이미지 목록.
- `prev_scene_url`: 연속성을 위한 이전 씬 이미지.

**프롬프트 구조 (Prompt Construction):**

```text
Style: {style}
Setting: {setting_str}
Action/Scene: {script}
{outfit_str}
{char_visuals_str}
Dialogues: Character A (Thinking): I love him... (Markers stripped)
{transition_str}
```

**멀티모달 입력 (Multimodal Inputs):**

```text
[Style Ref Image]
[Prev Scene Image] (If applicable)
[Character Ref Images]
Prompt Text
```

### 단순 컷 이미지 - 폴백/빠른생성 (Simple Cut Image)

**메서드:** `bg_generate_cut_image` (`endpoints/project_workflow.py` 내부) -> `generate_image` 호출
**모델:** `gemini-3-pro-image-preview`

**파라미터:**

- `cut.script`: 스크립트 텍스트.
- `project.art_style`: 화풍.

**프롬프트 구조:**

```text
{cut.script}, Style: {project.art_style}
```

---

## 5. 이미지 유틸리티 (Image Utilities)

### 일반 이미지 생성 (General Image Generation)

**메서드:** `generate_image`
**모델:** `gemini-3-pro-image-preview`

**파라미터:**

- `prompt`: 텍스트 설명.
- `width`/`height`: 비율 결정 (1:1, 3:4, 4:3, 16:9, 9:16).

### 이미지 수정 (Image Modification)

**메서드:** `modify_image`
**모델:** `gemini-3-pro-image-preview`

**파라미터:**

- `original_image_url`: 원본 이미지.
- `instruction`: 수정 지시 사항 텍스트.

**프롬프트 구조:**
Input: `[Image, Text("Edit this image: {instruction}")]`
