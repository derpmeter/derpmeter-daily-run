"""
Style AI Service - 스타일 추천 및 확장

시스템 프롬프트 및 표준화된 언어 지시문 적용
"""
from google.genai import types
import json
import logging
from typing import Optional

from app.services.ai.base import BaseAIService
from app.services.ai.prompts import (
    STYLE_SYSTEM_PROMPT,
    get_language_instruction,
)
from app.services.storage import storage

logger = logging.getLogger(__name__)


class StyleAIService(BaseAIService):
    """스타일 관련 AI 기능"""
    
    def recommend_style(self, description: str, language: str = "en") -> dict:
        """프로젝트 설명 기반 스타일 추천 (3개 옵션)"""
        self._ensure_client()

        prompt = f"""
## Task
Recommend 3 distinct art styles that would suit this webtoon project.

## Story/Worldview Description
"{description}"

## Instructions
For each style option, provide:
1. A descriptive label (e.g., "Clean Line Romance", "Painterly Fantasy")
2. Why this style fits the story (2-3 sentences)
3. Technical notes on the style approach

{get_language_instruction(language)}

## Output Format
Return ONLY a JSON object:
{{
    "options": [
        {{
            "id": "style_A",
            "label": "Style Name",
            "description": "Why this fits the story.",
            "technical_notes": "Linework, coloring, shading approach...",
            "reference_works": ["Similar webtoon examples"]
        }}
    ]
}}
"""
        
        try:
            logger.debug(f"PROMPT [recommend_style]: {prompt[:500]}...")
            response = self.client.models.generate_content(
                model=self.model_config["style"],
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=STYLE_SYSTEM_PROMPT,
                    response_mime_type="application/json"
                )
            )
            cleaned_text = self._clean_json_text(response.text)
            parsed_json = json.loads(cleaned_text)
            
            # Generate images for each style
            if "options" in parsed_json:
                for option in parsed_json["options"]:
                    # Remove any hallucinated URL
                    option.pop("sample_image_url", None)
                    
                    try:
                        style_label = option.get("label", "Art Style")
                        style_desc = option.get("description", "")
                        technical = option.get("technical_notes", "")
                        
                        # More specific prompt for style sample (no faces/figures)
                        image_prompt = f"""A high-quality representative illustration showcasing the art style: {style_label}. 
{style_desc} {technical}
Focus on: landscape, environment, or abstract composition. 
Do NOT include any human faces or full figures - focus purely on the visual style, brushwork, and aesthetic.
Visual composition: atmospheric scene demonstrating color palette and rendering technique."""
                        
                        logger.info(f"Generating sample for style: {style_label}")
                        # Import here to avoid circular dependency
                        from app.services.ai.generation.image_service import ImageAIService
                        image_service = ImageAIService()
                        img_bytes = image_service.generate_image(image_prompt, width=768, height=1024)
                        
                        # Upload to storage
                        url = storage.upload_image(img_bytes, schema="styles", identifier=style_label)
                        option["sample_image_url"] = url
                    except Exception as e:
                        logger.warning(f"Failed to generate sample for {style_label}: {e}")
                        
            return parsed_json
            
        except Exception as e:
            logger.error(f"Error in recommend_style: {e}")
            return {"options": []}
    
    def augment_style_description(
        self, 
        current_prompt: str, 
        project_context: dict = None, 
        language: str = "en"
    ) -> str:
        """스타일 설명 확장 (이미지 생성용 프롬프트 최적화)"""
        self._ensure_client()
        
        # Build context
        context_str = ""
        if project_context:
            context_str = f"""
## Project Context
- Title: {project_context.get('title', 'Unknown')}
- Genres: {', '.join(project_context.get('genres', [])) if project_context.get('genres') else 'Not specified'}
- Worldview: {project_context.get('worldview', 'Not specified')}
"""

        prompt = f"""
## Task
Improve the user's rough art style description into a high-quality, detailed prompt suitable for image generation.

{context_str}

## User's Rough Description
"{current_prompt}"

## Instructions
1. Expand on valid aesthetic keywords (lighting, texture, composition)
2. If project context is provided, ensure the style fits the genre and tone
3. Keep it concise but descriptive (under 100 words)
4. Return ONLY the improved prompt text, no quotes or explanations

{get_language_instruction(language) if language and language != 'en' else ''}
"""
        
        try:
            logger.debug(f"PROMPT [augment_style_description]: {prompt[:500]}...")
            response = self.client.models.generate_content(
                model=self.model_config["style"],
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=STYLE_SYSTEM_PROMPT
                )
            )
            return response.text.strip()
        except Exception as e:
            logger.error(f"Error in augment_style_description: {e}")
            raise e


# 인스턴스는 AIService Facade에서 관리됨
