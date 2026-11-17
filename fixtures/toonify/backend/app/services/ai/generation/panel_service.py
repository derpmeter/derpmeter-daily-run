"""
Panel Image Generation AI Service - 웹툰 패널 이미지 생성

개선된 시스템 프롬프트 및 Multimodal Priority Rules 적용
"""
from google.genai import types
import logging
from typing import List, Optional

from app.services.ai.base import BaseAIService
from app.services.ai.prompts import PANEL_IMAGE_SYSTEM_PROMPT

logger = logging.getLogger(__name__)


class PanelAIService(BaseAIService):
    """패널 이미지 생성 AI 서비스"""
    
    # Aspect Ratio 매핑
    ASPECT_RATIO_MAPPING = {
        "wide": "16:9",
        "vertical": "9:16",
        "square": "1:1",
        "21:9": "16:9",
        "3:2": "4:3",
        "2:3": "3:4",
        "4:5": "3:4",
        "5:4": "4:3",
        "1:1": "1:1",
        "16:9": "16:9",
        "9:16": "9:16",
        "3:4": "3:4",
        "4:3": "4:3"
    }
    
    def generate_panel_image(
        self, 
        prompt: str, 
        width: int = 1024, 
        height: int = 1024, 
        aspect_ratio: str = None,
        style_ref_url: str = None, 
        character_data: List[dict] = None, 
        prev_scene_url: str = None,
        language: str = "en",
        art_style: str = None,
        reference_board_urls: List[str] = None,
        reference_board_prompt: str = None,
        cached_content_name: str = None  # GenAI Context Cache name for style/character refs
    ) -> bytes:
        """
        웹툰 패널 이미지 생성
        
        Args:
            prompt: 장면 설명
            width, height: 이미지 크기
            aspect_ratio: 비율 문자열 (예: "16:9", "wide")
            style_ref_url: 스타일 참조 이미지 URL
            character_data: 캐릭터 참조 정보 목록 (레퍼런스 보드 없을 때 사용)
            prev_scene_url: 이전 장면 이미지 URL (연속성 유지)
            language: 언어 코드
            art_style: 아트 스타일 설명 텍스트
            reference_board_urls: 캐릭터 레퍼런스 보드 URL 리스트 (있으면 character_data 대신 사용)
            reference_board_prompt: 레퍼런스 보드 설명 프롬프트
            cached_content_name: GenAI 캐시된 컨텐츠 이름 (있으면 style_ref, reference_boards 스킵)
        """
        self._ensure_client()

        # 1. Art Style Instruction (TOP PRIORITY)
        style_instruction = ""
        if art_style:
            style_instruction = f"""
*** ART STYLE (HIGHEST PRIORITY) ***
You MUST draw this panel in the following art style: {art_style}
This style instruction takes precedence over all other visual directions.
"""
        
        # 2. Base Prompt Construction
        full_prompt = f"""
## Panel Generation Request

{style_instruction}

## Scene Description
{prompt}

## Visual Requirements
- STRICTLY follow the specified art style{f': {art_style}' if art_style else ' of the provided Style Reference'}.
- Maintain visual consistency with the Previous Scene (if any).
- Include the specific characters provided (if mentioned in scene).
- Optimize for vertical scroll reading format.
{f'- Any speech bubbles or text in the image MUST be in {language}.' if language and language.startswith('ko') else ''}
"""
        
        try:
            # Collect PIL Image objects for multimodal input
            image_parts = []
            
            # If cached_content is provided, skip style/reference board download
            # (they are already cached in GenAI)
            use_cache = bool(cached_content_name)
            
            if use_cache:
                logger.info(f"Using GenAI cached content: {cached_content_name}")
                # Add cache reference instruction to prompt
                full_prompt += """
## Cached Context
Style reference and character reference boards are provided via cached context.
Follow the style and character appearances from the cached references.
"""
            else:
                # 2. Add Style Reference (Priority 1 for style)
                if style_ref_url:
                    logger.info(f"Adding Style Reference: {style_ref_url}")
                    style_img = self._download_image_as_pil(style_ref_url)
                    if style_img:
                        image_parts.append(style_img)
                        full_prompt += """
## [Reference Image 1] - ART STYLE REFERENCE (HIGHEST PRIORITY)
*** THIS IS THE STYLE YOU MUST REPLICATE ***
- Copy the EXACT art style: line thickness, brushwork, coloring technique, shading method
- Match the color palette: use the same tones, saturation levels, and color harmony
- Apply the same rendering aesthetic: cell-shading, soft shading, or realistic style
- This reference defines how the ENTIRE panel should look
- Do NOT copy any people, characters, or figures from this image - ONLY the style
"""
                        logger.info("Style reference image added successfully")
                    else:
                        logger.warning(f"Failed to download style reference image: {style_ref_url}")
                else:
                    logger.warning("No style_ref_url provided for panel generation")

            # 3. Add Previous Scene (for continuity)
            if prev_scene_url:
                logger.info(f"Adding Previous Scene: {prev_scene_url}")
                prev_img = self._download_image_as_pil(prev_scene_url)
                if prev_img:
                    image_parts.append(prev_img)
                    full_prompt += f"""
## Reference Image {len(image_parts)}: PREVIOUS SCENE
- Maintain continuity: lighting direction, color temperature, environment details
- Ensure character positions make spatial sense
"""

            # 4. Add Character References (Board or Individual) - Skip if using cache
            if not use_cache and reference_board_urls:
                # Use Reference Board(s) - preferred method for consistency
                logger.info(f"Adding {len(reference_board_urls)} Reference Board(s)")
                boards_added = 0
                for idx, board_url in enumerate(reference_board_urls):
                    board_img = self._download_image_as_pil(board_url)
                    if board_img:
                        image_parts.append(board_img)
                        boards_added += 1
                    else:
                        logger.warning(f"Failed to download reference board {idx + 1}: {board_url}")
                logger.info(f"Reference boards added: {boards_added}/{len(reference_board_urls)}")
                
                # Add board description to prompt
                if reference_board_prompt:
                    full_prompt += f"\n\n{reference_board_prompt}"
                else:
                    full_prompt += """
## Character Reference Board(s)
- Each character MUST wear their EXACT outfit as shown
- Maintain character facial features, hair, and body proportions
- Do NOT improvise or modify established character appearances
"""
            elif character_data:
                # Fallback to individual character references
                logger.info(f"Adding {len(character_data)} Character References")
                for char in character_data:
                    c_url = char.get("url")
                    c_name = char.get("name")
                    if c_url:
                        c_img = self._download_image_as_pil(c_url)
                        if c_img:
                            image_parts.append(c_img)
                            full_prompt += f"""
## Reference Image {len(image_parts)}: Character '{c_name}'
- Maintain exact visual features: face shape, hair style/color, eye color
- Include in scene if mentioned in description
"""

            # 5. Determine Aspect Ratio
            final_ratio = "1:1"
            if aspect_ratio:
                r_lower = aspect_ratio.lower()
                final_ratio = self.ASPECT_RATIO_MAPPING.get(r_lower, "1:1")
            else:
                final_ratio = self._get_aspect_ratio(width, height)

            # 6. Call API with PIL Images directly
            logger.info(
                f"Generating Panel: images={len(image_parts)}, ratio={final_ratio}, "
                f"style_ref={'YES' if style_ref_url else 'NO'}, cache={'YES' if use_cache else 'NO'}, "
                f"art_style={art_style[:50] if art_style else 'None'}..."
            )
            
            contents = image_parts + [full_prompt]
            
            # Build enhanced System Instruction
            system_instruction = PANEL_IMAGE_SYSTEM_PROMPT
            if art_style:
                system_instruction += f"\n\n## CURRENT TARGET STYLE\n{art_style}"
            
            # Add stronger style instruction when style reference is provided (or cached)
            if (style_ref_url and len(image_parts) > 0) or use_cache:
                system_instruction += """

## CRITICAL STYLE INSTRUCTION
The FIRST image provided (or cached) is the ART STYLE REFERENCE. You MUST:
1. Match its exact visual style in every aspect of this panel
2. Use the same color palette, line work, and shading technique
3. This style takes absolute precedence over any other visual direction
"""
            
            # Build config with optional cached_content
            config_params = {
                "system_instruction": system_instruction,
                "response_modalities": ['IMAGE'],
                "image_config": types.ImageConfig(aspect_ratio=final_ratio)
            }
            
            # Add cached_content if available
            if use_cache and cached_content_name:
                config_params["cached_content"] = cached_content_name
                logger.info(f"Using cached_content in config: {cached_content_name}")
            
            config = types.GenerateContentConfig(**config_params)

            logger.debug(f"PROMPT [generate_panel_image]: {full_prompt[:500]}...")
            response = self.client.models.generate_content(
                model=self.model_config["image"],
                contents=contents,
                config=config,
            )
            
            if response.candidates and response.candidates[0].content and response.candidates[0].content.parts:
                for part in response.candidates[0].content.parts:
                    if part.inline_data:
                        return part.inline_data.data
            
            raise Exception("No image returned from Multimodal Generation")

        except Exception as e:
            logger.error(f"Panel Generation Error: {e}. Falling back to text-only.")
            # Fallback to simple generation
            from app.services.ai.generation.image_service import ImageAIService
            image_service = ImageAIService()
            return image_service.generate_image(prompt, width, height, language=language)


# 인스턴스는 AIService Facade에서 관리됨
