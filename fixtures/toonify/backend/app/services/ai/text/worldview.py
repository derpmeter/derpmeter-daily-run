"""
Worldview AI Service - 세계관 확장

시스템 프롬프트 및 표준화된 언어 지시문 적용
"""
from google.genai import types
import json
import logging
from typing import List, Optional

from app.services.ai.base import BaseAIService
from app.services.ai.prompts import (
    WORLDVIEW_SYSTEM_PROMPT,
    get_language_instruction,
    get_genre_modifier,
)

logger = logging.getLogger(__name__)


class WorldviewAIService(BaseAIService):
    """세계관 관련 AI 기능"""
    
    def augment_worldview(
        self, 
        description: str, 
        title: str = None, 
        subtitle: str = None, 
        genres: List[str] = None, 
        language: str = "en"
    ) -> dict:
        """세계관 설명 확장 (3개 방향 제안)"""
        self._ensure_client()
        
        # Build context
        context_lines = []
        if title:
            context_lines.append(f"- Project Title: {title}")
        if subtitle:
            context_lines.append(f"- Subtitle: {subtitle}")
        if genres:
            context_lines.append(f"- Genres: {', '.join(genres)}")
        
        context_str = "\n".join(context_lines) if context_lines else "None specified"
        desc_str = f'"{description}"' if description else "(None provided, suggest based on project context)"
        
        # Genre-specific guidance
        genre_modifier = get_genre_modifier(genres) if genres else ""

        prompt = f"""
## Task
Create 3 distinct directions/variations for this webtoon world.
The 3 options MUST be clearly distinct in style, mood, and narrative focus.

## Project Context
{context_str}

## Original Description
{desc_str}

{genre_modifier}

## Instructions
Each option should have:
1. A catchy title representing the direction
2. Tone keywords (2-3 words)
3. Key features (3+ distinctive elements)
4. Short description (1-2 sentences)
5. Detailed enhanced worldview content (3-5 paragraphs)

Consider these variation approaches:
- Option 1: Darker/Grittier interpretation
- Option 2: Lighter/More accessible take
- Option 3: Unique/Experimental approach

{get_language_instruction(language)}

## Output Format
Return ONLY a JSON object:
{{
    "options": [
        {{
            "id": "option_1",
            "title": "Direction Title",
            "tone": ["Tone1", "Tone2"],
            "key_features": ["Feature 1", "Feature 2", "Feature 3"],
            "description": "Short summary of this direction",
            "content": "Full detailed enhanced worldview description..."
        }}
    ]
}}
"""
        
        try:
            logger.debug(f"PROMPT [augment_worldview]: {prompt[:500]}...")
            response = self.client.models.generate_content(
                model=self.model_config["worldview"],
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=WORLDVIEW_SYSTEM_PROMPT,
                    response_mime_type="application/json"
                )
            )
            cleaned_text = self._clean_json_text(response.text)
            return json.loads(cleaned_text)
        except Exception as e:
            logger.error(f"Worldview Augmentation Error: {e}")
            raise e


# 인스턴스는 AIService Facade에서 관리됨
