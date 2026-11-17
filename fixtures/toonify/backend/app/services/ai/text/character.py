"""
Character AI Service - 캐릭터 생성 및 분석

시스템 프롬프트 및 표준화된 언어 지시문 적용
"""
from google.genai import types
import json
import logging
from typing import List, Optional

from app.services.ai.base import BaseAIService
from app.services.ai.prompts import (
    CHARACTER_SYSTEM_PROMPT,
    get_language_instruction,
    CharacterRole,
    PersonalityTag,
    enum_to_prompt_options,
    enum_to_prompt_list,
    get_role_descriptions_prompt,
)

logger = logging.getLogger(__name__)


class CharacterAIService(BaseAIService):
    """캐릭터 관련 AI 기능"""
    
    def augment_character_text(
        self, 
        name: str, 
        tags: List[str], 
        mood: list | str, 
        style: str, 
        project_context: str = "", 
        language: str = "en"
    ) -> dict:
        """캐릭터 컨셉 확장 (3가지 옵션 생성)"""
        self._ensure_client()

        mood_str = ", ".join(mood) if isinstance(mood, list) else mood

        prompt = f"""
## Task
Create 3 distinct character profile variations based on the initial concept that fit the project world.

## Project Context
{project_context}

## Initial Character Concept
- Input Name: {name}
- Initial Tags: {', '.join(tags) if tags else 'None'}
- Mood: {mood_str}
- Art Style: {style}

## Instructions
For each option, provide:
1. Unique Name (can be same or variation)
2. Age (e.g. "Early 20s", "Ancient")
3. Personality (Short summary)
4. Features (Visual traits as list)
5. Pros (Strengths/Advantages)
6. Cons (Weaknesses/Flaws)
7. Bio (Structured background):
   - Origin: Where they came from or their past
   - Goals: What they want to achieve
   - Quirk: A unique habit or trait
8. Visual Description (Detailed prompt for image generation)

{get_language_instruction(language)}

## Output Format
Return ONLY a JSON object:
{{
    "options": [
        {{
            "name": "Name",
            "age": "Age",
            "personality": "...",
            "features": ["tag1", "tag2"],
            "pros": ["..."],
            "cons": ["..."],
            "bio": {{
                "origin": "...",
                "goals": "...",
                "quirk": "..."
            }},
            "visual_description": "...",
            "reason": "Why this fits"
        }}
    ]
}}
"""
        try:
            logger.debug(f"PROMPT [augment_character_text]: {prompt[:500]}...")
            response = self.client.models.generate_content(
                model=self.model_config["worldview"],
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=CHARACTER_SYSTEM_PROMPT,
                    response_mime_type="application/json"
                )
            )
            cleaned_text = self._clean_json_text(response.text)
            return json.loads(cleaned_text)
        except Exception as e:
            logger.error(f"Character Augment Error: {e}")
            raise e
    
    def get_character_suggestion(
        self, 
        suggestion_type: str, 
        project_context: str, 
        current_data: dict, 
        language: str = "en"
    ) -> dict:
        """캐릭터 속성 제안 (이름/비주얼/배경)"""
        self._ensure_client()

        target_model = self.model_config["style"]
        lang_instruction = get_language_instruction(language)

        prompt = ""
        if suggestion_type == "name":
            prompt = f"""
## Task
Suggest a creative character name and a suitable age fitting for this Webtoon Project.

## Project Context
{project_context}

{lang_instruction}

## Output Format
Return a JSON object with "name" and "age".
Example: {{"name": "Jiwoo", "age": "19"}}
"""
        elif suggestion_type == "visuals":
            prompt = f"""
## Task
Suggest 5-7 visual appearance keywords/tags for a character in this Webtoon.

## Context
- Project: {project_context}
- Character Name: {current_data.get('name', 'Unknown')}
- Age: {current_data.get('age', 'Unknown')}

{lang_instruction}

## Output Format
Return a JSON list of strings.
Example: ["Tall", "Scarred eye", "Hoodie"]
"""
        elif suggestion_type == "lore":
            prompt = f"""
## Task
Write a compelling, short character description/lore (2-3 sentences) fitting the archetype and world.

## Context
- Project: {project_context}
- Character: {current_data.get('name', 'Unknown')}, {current_data.get('age', 'Unknown')} years old
- Archetype: {current_data.get('role', 'Unknown')}
- Personality: {current_data.get('personality', 'Unknown')}
- Visuals: {', '.join(current_data.get('visual_keywords', []))}

{lang_instruction}

## Output Format
Return just the description text (no JSON wrapper).
"""
        
        try:
            logger.debug(f"PROMPT [get_character_suggestion/{suggestion_type}]: {prompt[:300]}...")
            response = self.client.models.generate_content(
                model=target_model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=CHARACTER_SYSTEM_PROMPT,
                    response_mime_type="application/json" if suggestion_type in ["visuals", "name"] else "text/plain"
                )
            )
            
            if suggestion_type in ["visuals", "name"]:
                cleaned = self._clean_json_text(response.text)
                return json.loads(cleaned)
            else:
                return {"suggestion": response.text.strip()}
                
        except Exception as e:
            # Fallback to lite model
            logger.warning(f"Suggestion Error with {target_model}: {e}. Retrying with gemini-2.5-flash-lite.")
            try:
                response = self.client.models.generate_content(
                    model="gemini-2.5-flash-lite",
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json" if suggestion_type in ["visuals", "name"] else "text/plain"
                    )
                )
                if suggestion_type in ["visuals", "name"]:
                    cleaned = self._clean_json_text(response.text)
                    return json.loads(cleaned)
                else:
                    return {"suggestion": response.text.strip()}
                    
            except Exception as e2:
                logger.error(f"Fallback suggestion failed: {e2}")
                raise e2
    
    def generate_character_batch_suggestions(
        self, 
        project_context: str, 
        count: int = 10, 
        language: str = "en",
        include_protagonist: bool = False
    ) -> dict:
        """배치 캐릭터 제안 생성
        
        Args:
            project_context: 프로젝트 컨텍스트 (제목, 장르, 세계관 등)
            count: 생성할 캐릭터 수
            language: 출력 언어
            include_protagonist: True면 주인공 포함 (프로젝트 초기 생성 시)
        """
        self._ensure_client()
        
        # 주인공 포함 여부에 따른 프롬프트 분기
        if include_protagonist:
            protagonist_instruction = """
IMPORTANT: The FIRST character in the list MUST be a compelling Protagonist.
Design a main character who:
- Has clear motivations and goals tied to the worldview
- Has relatable personality traits with both strengths and flaws
- Serves as the central figure of the story
The remaining characters should be diverse supporting cast members (antagonist, allies, rivals, etc).
"""
        else:
            protagonist_instruction = "Exclude the Protagonist if already defined (assume these are potential additional cast members)."

        # 동적 Enum 주입
        personality_options = enum_to_prompt_list(PersonalityTag)
        role_options = enum_to_prompt_options(CharacterRole)

        prompt = f"""
## Task
Create {count} distinct, interesting character concepts that could fit into this story.

## Project Context
{project_context}

## Instructions
{protagonist_instruction}

Characters should vary in age, role, personality, and appearance.
Each character must fill a unique narrative role.

## Required Fields for Each Character
- name: Character name
- age: Age (e.g. "19", "Early 20s")
- role: Role title in the story (e.g. "Rival", "Best Friend")
- recommended_role: One of [{role_options}]
- visual_keywords: List of 3-5 visual appearance tags
- personality: Short personality summary (1-2 sentences)
- personality_tags: 1-3 from [{personality_options}]
- theme_color: Hex color code (e.g. "#ef4444")
- bio: Brief background (2-3 sentences)
- stats: Object with strength, intelligence, charisma, luck, empathy, leadership (0-100 each)

{get_language_instruction(language)}

## Output Format
Return ONLY a JSON object:
{{
    "suggestions": [
        {{
            "name": "Name",
            "age": "Age",
            "role": "Role Title",
            "recommended_role": "role_id",
            "visual_keywords": ["tag1", "tag2"],
            "personality": "...",
            "personality_tags": ["Tag1", "Tag2"],
            "theme_color": "#hex",
            "bio": "...",
            "stats": {{
                "strength": 50,
                "intelligence": 50,
                "charisma": 50,
                "luck": 50,
                "empathy": 50,
                "leadership": 50
            }}
        }}
    ]
}}
"""
        try:
            logger.debug(f"PROMPT [batch_suggestions]: {prompt[:500]}...")
            response = self.client.models.generate_content(
                model=self.model_config["worldview"],
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=CHARACTER_SYSTEM_PROMPT,
                    response_mime_type="application/json"
                )
            )
            cleaned_text = self._clean_json_text(response.text)
            return json.loads(cleaned_text)
        except Exception as e:
            logger.error(f"Batch Suggestion Error: {e}")
            raise e

    
    def analyze_character_concept(
        self, 
        project_context: str, 
        name: str, 
        age: str, 
        visual_keywords: List[str], 
        personality: str, 
        language: str = "en"
    ) -> dict:
        """캐릭터 컨셉 분석 (역할/배경 제안)"""
        self._ensure_client()
        
        # 동적으로 역할 설명 생성
        role_descriptions = get_role_descriptions_prompt()
        
        prompt = f"""
## Task
Analyze the character concept within the project worldview and suggest the best fitting Role and background story.

## Project Context
{project_context}

## Character Concept
- Name: {name}
- Age: {age}
- Visual Keywords: {', '.join(visual_keywords)}
- Personality: {personality}

{role_descriptions}

## Instructions
1. Select the BEST fitting Role from the available roles above.
2. Write a unique "Lore" (2-3 sentences) that weaves the character's personality and visuals into the worldview.
3. Suggest stats (0-100) for: strength, intelligence, charisma, luck, empathy, leadership

{get_language_instruction(language)}

## Output Format
Return ONLY a JSON object:
{{
    "recommended_role": "role_id (e.g. protagonist, antagonist, second_lead, scene_stealer)",
    "analysis": "Brief reason why this role fits (1-2 sentences)",
    "lore": "A compelling 2-3 sentence background story",
    "stats": {{
        "strength": 50,
        "intelligence": 50,
        "charisma": 50,
        "luck": 50,
        "empathy": 50,
        "leadership": 50
    }}
}}
"""

        try:
            logger.debug(f"PROMPT [analyze_character_concept]: {prompt[:500]}...")
            response = self.client.models.generate_content(
                model=self.model_config["analysis"], 
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=CHARACTER_SYSTEM_PROMPT,
                    response_mime_type="application/json"
                )
            )
            
            cleaned = self._clean_json_text(response.text)
            return json.loads(cleaned)

        except Exception as e:
            logger.error(f"Error in analyze_character_concept: {e}")
            return {
                "recommended_role": "protagonist",
                "analysis": "Fallback due to error.",
                "lore": f"{name} is a mysterious character in this world.",
                "stats": {"strength": 50, "intelligence": 50, "charisma": 50, "luck": 50, "empathy": 50, "leadership": 50}
            }


# 인스턴스는 AIService Facade에서 관리됨
