> Model: Claude Opus 4.5

# 📝 프롬프트 템플릿

> 재사용 가능한 표준 프롬프트 템플릿 및 예시

## 🏗️ 기본 템플릿 구조

모든 프롬프트는 다음 섹션을 포함해야 합니다:

```
## Task
[작업 설명]

## Context
[프로젝트/캐릭터/세계관 정보]

## Instructions
[단계별 지시사항]

## Constraints
[제약 조건 및 금지 사항]

## Language
[언어 지시]

## Output Format
[예상 JSON 구조]
```

---

## 📋 기능별 프롬프트 템플릿

### 1. 캐릭터 배치 제안 템플릿

```python
CHARACTER_BATCH_TEMPLATE = """
## Task
Create {count} distinct, interesting character concepts for this webtoon project.

## Context
Project Title: {title}
Genres: {genres}
Worldview: {worldview}
Existing Characters: {existing_chars}

## Instructions
1. Analyze the project context to understand the story's tone and needs.
2. Design characters that would create interesting dynamics together.
3. Ensure each character fills a unique narrative role.
4. {protagonist_instruction}

## Constraints
- No duplicate archetypes (e.g., don't create two "comic relief" characters)
- Visual designs must be distinct and memorable
- Backstories should connect to the worldview organically
- Avoid Mary Sue/Gary Stu perfect characters

{language_instruction}

## Output Format
Return ONLY a valid JSON object:
{{
    "suggestions": [
        {{
            "name": "string",
            "age": "string",
            "role": "string",
            "recommended_role": "protagonist|antagonist|second_lead|scene_stealer",
            "visual_keywords": ["string"],
            "personality": "string",
            "personality_tags": ["string"],
            "theme_color": "#hex",
            "bio": "string",
            "stats": {{
                "strength": 0-100,
                "intelligence": 0-100,
                "charisma": 0-100,
                "luck": 0-100,
                "empathy": 0-100,
                "leadership": 0-100
            }}
        }}
    ]
}}
"""
```

### 2. 캐릭터 컨셉 분석 템플릿

```python
CHARACTER_ANALYSIS_TEMPLATE = """
## Task
Analyze the character concept and suggest the best fitting Role (Archetype) and unique background story.

## Context
Project Worldview: {worldview}

Character Concept:
- Name: {name}
- Age: {age}
- Visual Keywords: {visual_keywords}
- Personality: {personality}

## Available Roles
1. "protagonist" - Center of story, determined, relatable, growth-oriented
2. "antagonist" - Opposing force, ambitious, understandable motivations
3. "second_lead" - Devoted support/rival, potential romantic interest, complex feelings
4. "scene_stealer" - Comic relief/wildcard, distinct personality, memorable moments

## Instructions
1. Select the BEST fitting Role based on the character's traits and story needs.
2. Write a compelling "Lore" (2-3 sentences) that:
   - Weaves the character's personality and visuals into the worldview
   - Explains their motivation or current state
   - Creates hooks for future story development
3. Assign stats (0-100) that reflect the character's described traits.

## Constraints
- The role must make narrative sense
- Lore should feel organic, not forced
- Stats should reflect personality, not just combat ability

{language_instruction}

## Output Format
{{
    "recommended_role": "role_id",
    "analysis": "Brief reason why this role fits (1-2 sentences)",
    "lore": "A compelling 2-3 sentence background story",
    "stats": {{
        "strength": number,
        "intelligence": number,
        "charisma": number,
        "luck": number,
        "empathy": number,
        "leadership": number
    }}
}}
"""
```

### 3. 에피소드 아이디어 템플릿

```python
EPISODE_IDEAS_TEMPLATE = """
## Task
Propose 3 possible episode ideas that logically continue the story.

## Context
Project Title: {title}
Worldview: {worldview}

Story So Far (Recent Episodes):
{recent_episodes}

{user_instruction}

## Instructions
1. Analyze the narrative flow and unresolved threads.
2. Propose 3 DISTINCT directions for the next episode.
3. Each option should represent a different storytelling approach:
   - Option A: Advance main plot
   - Option B: Deepen character relationships
   - Option C: Introduce new element/conflict
4. Ensure continuity - episodes must logically follow the last one.

## Constraints
- No "sudden amnesia" or cheap twists without setup
- Respect established character personalities
- Consider pacing - not every episode needs maximum drama
- Plant seeds for future episodes

{language_instruction}

## Output Format
{{
    "options": [
        {{
            "title": "Episode Title",
            "summary": "Detailed summary of episode events (3-5 sentences)",
            "reason": "How this connects to previous plot and advances the story"
        }}
    ]
}}
"""
```

### 4. 컷 스크립트 생성 템플릿

```python
CUTS_GENERATION_TEMPLATE = """
## Task
Plan a {num_cuts}-cut webtoon episode with detailed visual scripting.

## Context
Project:
- Title: {title}
- Genres: {genres}
- Art Style: {art_style}
- Worldview: {worldview}

Episode Details:
- Title: {episode_title}
- Summary: {summary}

Available Characters:
{characters}

## Instructions
1. Define the overall Background/Setting for the episode.
2. Define the Outfit for each appearing character (maintain consistency).
3. Create {num_cuts} cuts following the episode summary.

For each cut, determine:
- Script: Visual description of action/scene (mention full names only on first appearance)
- Location: Setting name
- Time of Day: Lighting context
- Dialogues: List with speaker, type (speech/thought/shout), and text
- Panel Type: Aspect ratio recommendation
- Appearing Characters: List with id, name, and clothing
- refer_prev_cut: Boolean - TRUE if same location/time as previous cut
- transition_ref: Notes for panel transition

## Constraints
- Avoid excessive character name repetition (use pronouns after introduction)
- Dialogue should fit in speech bubbles (concise)
- Consider vertical scroll pacing
- First 3 cuts must hook the reader

{language_instruction}

## Output Format
{{
    "background_info": "Overall setting description",
    "character_outfits": {{
        "CharacterName": "Outfit description"
    }},
    "cuts": [
        {{
            "cut_order": 1,
            "script": "...",
            "location": "...",
            "time_of_day": "...",
            "dialogues": [{{"speaker": "...", "type": "speech|thought|shout", "text": "..."}}],
            "appearing_characters": [{{"id": "...", "name": "...", "clothing": "..."}}],
            "panel_type": "Wide|Square|Vertical|Closeup",
            "refer_prev_cut": false,
            "transition_ref": null
        }}
    ]
}}
"""
```

### 5. 세계관 확장 템플릿

```python
WORLDVIEW_AUGMENT_TEMPLATE = """
## Task
Create 3 distinct directions/variations for this webtoon world.

## Context
Project Title: {title}
Subtitle: {subtitle}
Genres: {genres}

Original Description: {description}

## Instructions
1. Analyze the core concept and potential.
2. Create 3 CLEARLY DISTINCT options:
   - Option 1: Darker/Grittier interpretation
   - Option 2: Lighter/More accessible take
   - Option 3: Unique/Experimental approach
3. Each option should have its own tone, key features, and full description.

## Constraints
- Options must be meaningfully different, not just reworded
- Stay true to the core concept while exploring variations
- Consider story potential (is this world interesting for 100+ episodes?)
- Think about visual translatability

{language_instruction}

## Output Format
{{
    "options": [
        {{
            "id": "option_1",
            "title": "Direction Title",
            "tone": ["Tone1", "Tone2"],
            "key_features": ["Feature1", "Feature2", "Feature3"],
            "description": "Short summary (1-2 sentences)",
            "content": "Full detailed worldview description (3-5 paragraphs)"
        }}
    ]
}}
"""
```

### 6. 스타일 추천 템플릿

```python
STYLE_RECOMMEND_TEMPLATE = """
## Task
Recommend 3 distinct art styles that would suit this webtoon project.

## Context
Story/Worldview Description: {description}
Genres: {genres}
Target Audience: {audience}

## Instructions
1. Analyze the story's emotional core and tone.
2. Consider the target demographic's preferences.
3. Recommend 3 styles that would:
   - Amplify the narrative's strengths
   - Be sustainable for a long-running series
   - Differentiate the work in the market

## Constraints
- Styles must be feasible for webtoon production
- Consider readability on mobile devices
- Balance aesthetic ambition with practical sustainability

{language_instruction}

## Output Format
{{
    "options": [
        {{
            "id": "style_A",
            "label": "Style Name (e.g., Clean Line Romance)",
            "description": "Why this style fits the story (2-3 sentences)",
            "technical_notes": "Specific techniques: linework, coloring, shading approach",
            "reference_works": ["Similar webtoon/manhwa examples"]
        }}
    ]
}}
"""
```

---

## 🌐 언어별 지시문 템플릿

### 한국어

```python
KOREAN_INSTRUCTION = """
## Language: Korean (한국어)
- All output text MUST be in Korean Hangul (한글).
- Use natural Korean expressions - avoid translated-sounding text.
- Names: Follow Korean conventions (성+이름, 2-4 syllables).
  - Good: 김수현, 박지민, 이하늘
  - Avoid: 직역체 외국 이름
- Dialogue: Use natural colloquial Korean.
  - Match speech level to character relationships:
    - 존댓말 for formal/respectful
    - 반말 for close/casual
  - Consider age hierarchy (호칭: 형, 누나, 선배 등)
- Descriptions: Vivid but concise (웹툰 is visual-first).
- Avoid: Excessive Konglish unless character-appropriate.
"""
```

### 영어

```python
ENGLISH_INSTRUCTION = """
## Language: English
- All output text should be in natural, fluent English.
- Names: Creative but pronounceable.
  - Consider the story's cultural setting when naming
- Dialogue: Should feel natural and character-appropriate.
  - Vary vocabulary and sentence structure
  - Consider character education level and background
- Descriptions: Vivid, visual, and specific.
- Avoid: Overly academic or stiff language (unless character calls for it).
"""
```

### 일본어

```python
JAPANESE_INSTRUCTION = """
## Language: Japanese (日本語)
- All output text MUST be in Japanese.
- Names: Follow Japanese conventions (姓+名).
  - Consider kanji meaning for character flavor
- Honorifics: Use appropriate levels based on relationships.
  - さん、くん、ちゃん、様、先輩、etc.
- Speech patterns: Match character personality.
  - Consider masculine/feminine speech patterns
  - Age-appropriate language (若者言葉 for youth)
- Descriptions: Balance visual detail with brevity.
"""
```

---

## 🔄 템플릿 사용 예시

```python
from app.services.ai.prompts import (
    CHARACTER_BATCH_TEMPLATE,
    get_language_instruction
)

def generate_characters(project_context: dict, count: int, language: str):
    prompt = CHARACTER_BATCH_TEMPLATE.format(
        count=count,
        title=project_context.get("title", "Unknown"),
        genres=", ".join(project_context.get("genres", [])),
        worldview=project_context.get("worldview", "Not specified"),
        existing_chars="None",
        protagonist_instruction="The first character should be a compelling protagonist.",
        language_instruction=get_language_instruction(language)
    )

    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=CHARACTER_SYSTEM_PROMPT,
            response_mime_type="application/json"
        )
    )

    return json.loads(response.text)
```

---

## ✅ 품질 체크리스트

각 프롬프트를 사용하기 전 확인:

- [ ] Task가 명확하고 구체적인가?
- [ ] Context에 필요한 모든 정보가 포함되었는가?
- [ ] Instructions가 단계별로 정리되었는가?
- [ ] Constraints가 원치 않는 출력을 방지하는가?
- [ ] Language instruction이 상세한가?
- [ ] Output Format이 파싱 가능한 JSON인가?
- [ ] 시스템 프롬프트와 함께 사용되는가?

---

_End of Documentation_
