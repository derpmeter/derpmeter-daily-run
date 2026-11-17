"""
Episode AI Service - 에피소드 및 컷 생성

시스템 프롬프트 및 표준화된 언어 지시문 적용
"""
from google.genai import types
import json
import logging
from typing import List, Optional

from app.services.ai.base import BaseAIService
from app.services.ai.prompts import (
    EPISODE_SYSTEM_PROMPT,
    get_language_instruction,
    format_character_list,
    PanelType,
    DialogueType,
    enum_to_prompt_options,
)

logger = logging.getLogger(__name__)


class EpisodeAIService(BaseAIService):
    """에피소드/컷 관련 AI 기능"""
    
    def generate_direction_options(
        self, 
        script: str, 
        character_context: str = "", 
        language: str = "en"
    ) -> dict:
        """연출 옵션 생성 (3가지 방향)"""
        self._ensure_client()

        prompt = f"""
## Task
Analyze the script and suggest 3 distinct visual direction options (camera angle, composition, mood).

## Script
"{script}"

{f'## Character Details (include in visual description if relevant)' + chr(10) + character_context if character_context else ''}

{get_language_instruction(language)}

## Output Format
Return ONLY a JSON object:
{{
    "options": [
        {{
            "id": "A",
            "label": "Short Title (e.g., Low Angle)",
            "description": "Brief description of the visual composition.",
            "aspect_ratio": "3:4", 
            "image_prompt": "Detailed image generation prompt for this scene including character visual details..."
        }}
    ]
}}
"""
        
        try:
            logger.debug(f"PROMPT [generate_direction_options]: {prompt[:500]}...")
            response = self.client.models.generate_content(
                model=self.model_config["director"],
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=EPISODE_SYSTEM_PROMPT,
                    response_mime_type="application/json"
                )
            )
            cleaned_text = self._clean_json_text(response.text)
            return json.loads(cleaned_text)
            
        except Exception as e:
            logger.error(f"Director AI Error: {e}")
            raise e
    
    def generate_episode_ideas(
        self, 
        project_title: str, 
        worldview: str, 
        recent_episodes: str, 
        language: str = "en", 
        user_instruction: str = None
    ) -> dict:
        """에피소드 아이디어 생성 (3개 제안)"""
        self._ensure_client()
             
        prompt = f"""
## Task
Propose 3 possible episode ideas that logically continue the story.

## Project Context
- Title: {project_title}
- Worldview: {worldview}

## Story So Far (Recent Episodes)
{recent_episodes}

{f'## User Instruction' + chr(10) + user_instruction if user_instruction else ''}

## Instructions
1. Analyze the narrative flow of the recent episodes.
2. Propose 3 distinct directions for the immediately following episode.
3. Ensure continuity: The new episodes must logically succeed the incidents in the last episode.
4. Advance the plot or deepen character relationships based on established context.

{get_language_instruction(language)}

## Output Format
Return ONLY a JSON object:
{{
    "options": [
        {{
            "title": "Episode Title",
            "summary": "Detailed summary of the episode events (3-5 sentences).",
            "reason": "How this connects to previous plot and advances the story."
        }}
    ]
}}
"""
        try:
            logger.debug(f"PROMPT [generate_episode_ideas]: {prompt[:500]}...")
            response = self.client.models.generate_content(
                model=self.model_config["director"],
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=EPISODE_SYSTEM_PROMPT,
                    response_mime_type="application/json"
                )
            )
            cleaned_text = self._clean_json_text(response.text)
            return json.loads(cleaned_text)
        except Exception as e:
            logger.error(f"Episode Idea Gen Failed: {e}")
            raise e
    
    def generate_prologue_ideas(
        self, 
        project_title: str, 
        worldview: str, 
        characters: str,
        language: str = "en", 
        user_instruction: str = None
    ) -> dict:
        """프롤로그 에피소드 아이디어 생성 (3개 제안)
        
        프롤로그는 이야기의 시작을 알리는 특별한 에피소드로:
        - 세계관 소개
        - 분위기/톤 설정  
        - 주요 인물 첫 등장
        - 핵심 갈등의 암시
        """
        self._ensure_client()
             
        prompt = f"""
## Task
Propose 3 unique PROLOGUE episode ideas that will hook readers from the very first scene.

## Project Context
- Title: {project_title}
- Worldview: {worldview}

## Available Characters (for reference)
{characters if characters else "None specified yet"}

{f'## User Instruction' + chr(10) + user_instruction if user_instruction else ''}

## Prologue-Specific Guidelines
1. **Hook the Reader**: Start with an attention-grabbing moment - mystery, action, emotion, or intrigue.
2. **Establish the World**: Introduce key elements of the worldview naturally through the narrative.
3. **Set the Tone**: The prologue should clearly establish the mood/genre of the story.
4. **Introduce Key Characters**: Feature main character(s) in a memorable way, showing their personality.
5. **Plant Seeds**: Hint at the main conflict or mystery without revealing too much.
6. **Stand Alone & Connect**: The prologue should work as a compelling short story while leading into episode 1.

## Prologue Types to Consider
- "Cold Open": Start in the middle of action, then flashback or continue
- "Mysterious Setup": Begin with an intriguing event that will be explained later
- "Character Introduction": Deep dive into the protagonist's normal world before change
- "World Showcase": A day-in-the-life that reveals the unique setting
- "Flash Forward": Show a glimpse of an exciting future moment

{get_language_instruction(language)}

## Output Format
Return ONLY a JSON object:
{{
    "options": [
        {{
            "title": "Prologue Title",
            "summary": "Detailed summary of the prologue events, focusing on what makes it a compelling opening.",
            "reason": "Why this prologue works well - what it establishes and how it hooks readers.",
            "prologue_type": "Type of prologue (Cold Open / Mysterious Setup / etc.)"
        }}
    ]
}}
"""
        try:
            logger.debug(f"PROMPT [generate_prologue_ideas]: {prompt[:500]}...")
            response = self.client.models.generate_content(
                model=self.model_config["director"],
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    system_instruction=EPISODE_SYSTEM_PROMPT
                )
            )
            cleaned_text = self._clean_json_text(response.text)
            return json.loads(cleaned_text)
        except Exception as e:
            logger.error(f"Prologue Idea Gen Failed: {e}")
            raise e
    
    def generate_initial_cuts(
        self, 
        episode_title: str, 
        summary: str, 
        style: str, 
        num_cuts: int = 6, 
        language: str = "en",
        available_characters: List[dict] = None,
        project_context: dict = None
    ) -> dict:
        """초기 컷 스크립트 생성"""
        self._ensure_client()
        
        available_characters = available_characters or []

        # Format available characters using utility
        chars_str = format_character_list(available_characters)

        # Format project context
        project_info_str = ""
        if project_context:
            worldview = project_context.get("worldview", {})
            worldview_str = "\n".join([f"- {k}: {v}" for k, v in worldview.items()]) if worldview else "None"
            project_info_str = f"""
## Project Context
- Title: {project_context.get("title")}
- Genres: {', '.join(project_context.get("genres", []))}
- Art Style: {project_context.get("art_style")}
- Worldview/Setting:
{worldview_str}
"""

        # Dynamic enum injection
        panel_types = enum_to_prompt_options(PanelType)
        dialogue_types = enum_to_prompt_options(DialogueType)

        prompt = f"""
## Task
Plan a {num_cuts}-cut webtoon episode with detailed visual scripting.

{project_info_str}

## Episode Details
- Title: {episode_title}
- Summary: {summary}
- Style: {style}

## Available Characters
{chars_str}

## Instructions
1. Define the overall **Background/Setting** for the episode.
2. Define the **Outfit** for each character appearing in this episode.
3. Create {num_cuts} cuts following the episode summary.

## For Each Cut, Determine:
- script: Visual description of action/scene (mention full names only on first appearance)
- location: Setting name
- time_of_day: Lighting context (Morning, Afternoon, Evening, Night, etc.)
- dialogues: List with speaker, type ({dialogue_types}), and text
- panel_type: One of [{panel_types}]
- appearing_characters: List with id, name, and clothing
- refer_prev_cut: Boolean (TRUE if same location/time as previous cut)
- transition_ref: Notes for panel transition

## Constraints
- Avoid excessive character name repetition (use pronouns after introduction)
- Keep dialogue concise for speech bubbles (~15-20 chars per bubble)
- Consider vertical scroll pacing
- First 3 cuts must hook the reader

{get_language_instruction(language)}

## Output Format
Return ONLY a JSON object:
{{
    "background_info": "Overall setting description...",
    "character_outfits": {{
        "CharacterName": "Outfit description..."
    }},
    "cuts": [
        {{
            "cut_order": 1,
            "script": "...",
            "location": "Classroom",
            "time_of_day": "Day",
            "dialogues": [{{"speaker": "Name", "type": "speech", "text": "..."}}],
            "appearing_characters": [{{"id": "...", "name": "...", "clothing": "..."}}],
            "panel_type": "Wide",
            "refer_prev_cut": false,
            "transition_ref": null
        }}
    ]
}}
"""
        try:
            logger.debug(f"PROMPT [generate_initial_cuts]: {prompt[:500]}...")
            response = self.client.models.generate_content(
                model=self.model_config["director"],
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=EPISODE_SYSTEM_PROMPT,
                    response_mime_type="application/json"
                )
            )
            cleaned_text = self._clean_json_text(response.text)
            return json.loads(cleaned_text)
        except Exception as e:
            logger.error(f"Cut Gen Failed: {e}")
            raise e


# 인스턴스는 AIService Facade에서 관리됨
