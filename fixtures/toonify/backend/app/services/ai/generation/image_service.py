"""
Image Generation AI Service - 범용 이미지 생성 및 수정
"""
from google.genai import types
from typing import List, Optional

from app.services.ai.base import BaseAIService


class ImageAIService(BaseAIService):
    """범용 이미지 생성 AI 서비스"""
    
    def generate_image(
        self, 
        prompt: str, 
        width: int = 1024, 
        height: int = 1024, 
        seed: int = None, 
        language: str = "en", 
        reference_image_urls: List[str] = None, 
        prev_image_url: str = None
    ) -> bytes:
        """범용 이미지 생성"""
        self._ensure_client()

        try:
            aspect_ratio = self._get_aspect_ratio(width, height)
            
            print(f"Generating image with prompt: {prompt[:50]}..., ratio: {aspect_ratio}")
            
            # Inject language instruction
            if language and language.startswith('ko'):
                prompt += " (Any text inside the image must be in Korean Hangul)"
            
            contents = prompt
            has_images = bool(reference_image_urls or prev_image_url)
            
            if has_images:
                parts = []
                
                # Previous Cut (High Priority for Continuity)
                if prev_image_url:
                    print(f"Using previous image reference: {prev_image_url}")
                    img_bytes = self._download_image(prev_image_url)
                    if img_bytes:
                        parts.append(types.Part.from_bytes(data=img_bytes, mime_type="image/png"))
                        prompt += "\n\n[Visual Continuity]: The image provided FIRST is the previous scene. Maintain style, lighting, and character appearance from it."

                # Reference Images
                if reference_image_urls:
                    for url in reference_image_urls:
                        img_bytes = self._download_image(url)
                        if img_bytes:
                            parts.append(types.Part.from_bytes(data=img_bytes, mime_type="image/png"))
                
                if parts:
                    prompt_part = types.Part.from_text(text=prompt)
                    contents = [
                        types.Content(
                            role="user",
                            parts=parts + [prompt_part]
                        )
                    ]
            
            config = types.GenerateContentConfig(
                response_modalities=['IMAGE'], 
                safety_settings=self._get_safety_settings(),
                image_config=types.ImageConfig(
                    aspect_ratio=aspect_ratio,
                )
            )

            print(f"DEBUG PROMPT [generate_image]: \n{prompt}")
            response = self.client.models.generate_content(
                model=self.model_config["image"],
                contents=contents,
                config=config,
            )
            
            if response.candidates and response.candidates[0].content and response.candidates[0].content.parts:
                for part in response.candidates[0].content.parts:
                    if part.inline_data:
                        return part.inline_data.data
                    if part.text:
                        print(f"Model refused to generate image. Reason/Message: {part.text}")
                        raise Exception(f"Model refusal: {part.text}")
            
            print(f"No image returned. Prompt feedback: {response.prompt_feedback}")
            raise Exception("No image part found in response")
                  
        except Exception as e:
            print(f"GenAI Generation Error: {e}")
            raise e
    
    def modify_image(
        self, 
        original_image_url: str, 
        instruction: str, 
        language: str = "en"
    ) -> bytes:
        """이미지 수정 (인페인팅)"""
        self._ensure_client()
        
        print(f"Modifying image with instruction: {instruction}")
        
        try:
            img_bytes = self._download_image(original_image_url)
            
            if not img_bytes:
                raise Exception("Could not retrieve source image bytes")

            image_part = types.Part.from_bytes(data=img_bytes, mime_type="image/png") 
            
            lang_instruction = f" Ensure any text is in {language}." if language else ""
            text_part = types.Part.from_text(text=f"Edit this image: {instruction}{lang_instruction}")
            
            contents = [
                types.Content(
                    role="user",
                    parts=[image_part, text_part]
                )
            ]
            
            config = types.GenerateContentConfig(
                response_modalities=['IMAGE'],
                image_config=types.ImageConfig(
                    aspect_ratio="1:1" 
                )
            )

            print(f"DEBUG PROMPT [modify_image]: {instruction}")
            response = self.client.models.generate_content(
                model=self.model_config["image"],
                contents=contents,
                config=config
            )
            
            if response.candidates and response.candidates[0].content and response.candidates[0].content.parts:
                for part in response.candidates[0].content.parts:
                    if part.inline_data:
                        return part.inline_data.data

            raise Exception("No modified image returned")
                 
        except Exception as e:
            print(f"Modification Error: {e}")
            raise e
    
    def get_embedding(self, text: str) -> List[float]:
        """텍스트 임베딩 생성"""
        self._ensure_client()
        
        try:
            response = self.client.models.embed_content(
                model="gemini-embedding-001",
                contents=text
            )
            if response.embeddings:
                return response.embeddings[0].values
            return []
        except Exception as e:
            print(f"Embedding failed: {e}")
            return [0.0] * 768
    
    def generate_project_cover_image(
        self, 
        title: str, 
        genre: str, 
        worldview: str, 
        style: str, 
        tones: List[str] = None, 
        style_ref_url: str = None, 
        character_image_urls: List[str] = None, 
        language: str = "en"
    ) -> bytes:
        """프로젝트 커버 이미지 생성"""
        self._ensure_client()
        
        tone_str = f"Tone: {', '.join(tones)}" if tones else ""

        prompt = f"""
        Create a high-quality webtoon cover illustration.
        
        Title: {title}
        Genre: {genre}
        Art Style: {style}
        {tone_str}
        
        Worldview/Setting:
        {worldview}
        
        Requirements:
        - The image should be eye-catching and representative of the genre and story.
        - Use the user-defined art style: {style}.
        - Aspect Ratio: Wide (16:9).
        - Composition: Cinematic, showing the atmosphere.
        - Place the title ("{title}") and subtitle (if any) logo in the center of the cover image in a way that suits the cover aesthetic.
        {f'- Ensure the title text is in {language} language if possible.' if language and language.startswith('ko') else ''}
        """
        
        if character_image_urls:
            prompt += f"\n- INCLUDE the characters provided in the reference images. Place them naturally in the scene according to the worldview."
        
        try:
            # Prepare Multimodal Input
            prompt, parts = self._prepare_multimodal_inputs(prompt, style_ref_url, character_image_urls)

            if parts:
                print(f"Generating multimodal cover with {len(parts)} images.")
                text_part = types.Part.from_text(text=prompt)
                 
                contents = [
                    types.Content(
                        role="user",
                        parts=parts + [text_part]
                    )
                ]
                 
                # System instruction for style consistency in cover
                cover_system_instruction = (
                    "You are a professional webtoon cover artist. "
                    "Your PRIMARY OBJECTIVE is to create an eye-catching cover that perfectly matches the specified art style. "
                    "If a STYLE REFERENCE IMAGE is provided, replicate its exact visual aesthetic. "
                    f"TARGET ART STYLE: {style}"
                )
                
                config = types.GenerateContentConfig(
                    system_instruction=cover_system_instruction,
                    response_modalities=['IMAGE'], 
                    image_config=types.ImageConfig(
                        aspect_ratio="16:9",
                    )
                )

                print(f"DEBUG PROMPT [generate_project_cover_image (multimodal)]: \n{prompt}")
                response = self.client.models.generate_content(
                    model=self.model_config["image"],
                    contents=contents,
                    config=config,
                )
                 
                if response.candidates and response.candidates[0].content and response.candidates[0].content.parts:
                    for part in response.candidates[0].content.parts:
                        if part.inline_data:
                            return part.inline_data.data
                 
                print("Multimodal generation returned no image, falling back to text-only.")

        except Exception as e:
            print(f"Multimodal Cover Generation Error: {e}. Falling back to text-only.")

        # Fallback: text-only generation
        return self.generate_image(prompt, width=1920, height=1080)
    
    def generate_character_sheet(
        self, 
        name: str, 
        description: str, 
        style: str, 
        style_ref_url: str = None
    ) -> bytes:
        """캐릭터 시트 생성"""
        self._ensure_client()
        
        prompt = f"""
        Create a Character Reference Sheet for a {style} webtoon character named {name}.
        
        Character Description:
        {description}
        
        Composition Requirements:
        - Vertical Layout (9:16 Portrait aspect ratio).
        - TOP HALF: High-quality detailed Portrait/Close-up of the character's face (showing expression and facial features).
        - BOTTOM HALF: Horizontally divided into 4 equal vertical sections (side-by-side). Each section must show the character in a DIFFERENT outfit and DIFFERENT pose to showcase their personality and fashion versatility.
        - Background: Pure white, empty, whitespace. No background elements.
        - Style: {style} (High quality, professional concept art).
        
        NEGATIVE PROMPT: Do NOT include any text, logos, watermarks, signature, charts, buildings, scenery, trees, furniture, or complex background.
        
        CRITICAL: If a style reference image is provided, ONLY use it for the art style (line work, coloring, shading technique). Do NOT copy or reproduce any characters from the style reference image. Generate a completely NEW character based solely on the description above.
        """
        
        try:
            prompt, parts = self._prepare_multimodal_inputs(prompt, style_ref_url)

            if parts:
                print(f"Generating multimodal character sheet with {len(parts)} images.")
                text_part = types.Part.from_text(text=prompt)
                 
                contents = [
                    types.Content(
                        role="user",
                        parts=parts + [text_part]
                    )
                ]
                 
                # System instruction for style consistency in character sheet
                sheet_system_instruction = (
                    "You are a professional character concept artist. "
                    "Your PRIMARY OBJECTIVE is to create a consistent character reference sheet. "
                    "If a STYLE REFERENCE IMAGE is provided, replicate its exact visual aesthetic (line work, coloring technique, shading style). "
                    f"TARGET ART STYLE: {style}. "
                    "CRITICAL: Do NOT copy or reproduce any characters from the style reference image. "
                    "The style reference is ONLY for art style, NOT for character design. "
                    "Generate a completely NEW and UNIQUE character based solely on the character description provided. "
                    "IMPORTANT: Use a pure white background with NO scenery or complex elements."
                )
                
                config = types.GenerateContentConfig(
                    system_instruction=sheet_system_instruction,
                    response_modalities=['IMAGE'], 
                    image_config=types.ImageConfig(
                        aspect_ratio="9:16",
                    )
                )

                print(f"DEBUG PROMPT [generate_character_sheet (multimodal)]: \n{prompt}")
                response = self.client.models.generate_content(
                    model=self.model_config["image"],
                    contents=contents,
                    config=config,
                )
                 
                if response.candidates and response.candidates[0].content and response.candidates[0].content.parts:
                    for part in response.candidates[0].content.parts:
                        if part.inline_data:
                            return part.inline_data.data
                 
                print("Multimodal generation returned no image, falling back to text-only.")

        except Exception as e:
            print(f"Multimodal Sheet Generation Error: {e}. Falling back to text-only.")

        # Fallback
        return self.generate_image(prompt, width=576, height=1024)

    def generate_character_outfit_image(
        self,
        character_name: str,
        character_description: str,
        outfit_description: str,
        style: str,
        profile_image_url: str = None,
        style_ref_url: str = None
    ) -> bytes:
        """
        에피소드 특정 의상을 입은 캐릭터 이미지 생성
        
        Args:
            character_name: 캐릭터 이름
            character_description: 캐릭터 외모 설명
            outfit_description: 에피소드 의상 설명
            style: 아트 스타일
            profile_image_url: 기존 캐릭터 프로필 이미지 URL (참조용)
            style_ref_url: 스타일 참조 이미지 URL
        
        Returns:
            생성된 이미지 바이트
        """
        self._ensure_client()
        
        prompt = f"""
Create a character portrait for a webtoon/manhwa.

CHARACTER: {character_name}
APPEARANCE: {character_description}
OUTFIT: {outfit_description}
ART STYLE: {style}

Requirements:
- Single character, upper body or full body portrait
- Clean, simple background (white or light gradient)
- Character facing forward or slightly angled (3/4 view)
- The character MUST be wearing the specified OUTFIT exactly
- Maintain consistency with the reference image if provided
- Do NOT include any text, labels, or watermarks
- High quality, professional webtoon art style
"""
        
        try:
            # Try multimodal generation with reference images
            has_refs = bool(profile_image_url or style_ref_url)
            
            if has_refs:
                parts = []
                
                # Style reference first (highest priority)
                if style_ref_url:
                    print(f"[OutfitGen] Using style reference: {style_ref_url[:60]}...")
                    style_img = self._download_image_as_pil(style_ref_url)
                    if style_img:
                        parts.append(style_img)
                        prompt += "\n[Reference Image 1] is the ART STYLE reference. Replicate this exact visual style (line work, coloring, shading). Do NOT copy any characters from this reference - only use it for art style."
                
                # Character profile reference
                if profile_image_url:
                    print(f"[OutfitGen] Using character profile: {profile_image_url[:60]}...")
                    char_img = self._download_image_as_pil(profile_image_url)
                    if char_img:
                        parts.append(char_img)
                        prompt += f"\n[Reference Image {len(parts)}] is the CHARACTER reference. This is {character_name}. Draw this same character but wearing the new outfit."
                
                if parts:
                    contents = parts + [prompt]
                    
                    system_instruction = (
                        "You are a professional webtoon/manhwa character artist. "
                        "Your task is to draw a character portrait with a SPECIFIC OUTFIT. "
                        "Maintain character identity from the reference but apply the new outfit exactly. "
                        "Use a clean, simple background. NO text or labels."
                    )
                    
                    config = types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        response_modalities=['IMAGE'],
                        image_config=types.ImageConfig(
                            aspect_ratio="3:4",  # Portrait orientation
                        )
                    )
                    
                    print(f"[OutfitGen] Generating outfit image for {character_name}...")
                    response = self.client.models.generate_content(
                        model=self.model_config["image"],
                        contents=contents,
                        config=config,
                    )
                    
                    if response.candidates and response.candidates[0].content and response.candidates[0].content.parts:
                        for part in response.candidates[0].content.parts:
                            if part.inline_data:
                                print(f"[OutfitGen] Successfully generated outfit image for {character_name}")
                                return part.inline_data.data
                    
                    print("[OutfitGen] Multimodal generation returned no image, falling back to text-only.")
                    
        except Exception as e:
            print(f"[OutfitGen] Multimodal generation error: {e}. Falling back to text-only.")
        
        # Fallback to text-only generation
        return self.generate_image(prompt, width=768, height=1024)


# 인스턴스는 AIService Facade에서 관리됨
