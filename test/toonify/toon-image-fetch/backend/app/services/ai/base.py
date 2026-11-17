"""
Base AI Service - 공통 클라이언트 및 유틸리티
"""
from google import genai
from google.genai import types
from app.core.config import settings
from PIL import Image
import io
import base64
import requests
import re
import os
from typing import List, Optional

# 모듈 레벨 공유 클라이언트 (싱글톤)
_shared_client = None
_shared_model_config = None


def _get_shared_client():
    """공유 GenAI 클라이언트 반환 (싱글톤)"""
    global _shared_client, _shared_model_config
    
    if _shared_client is not None:
        return _shared_client, _shared_model_config
    
    try:
        api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")
        project = settings.GOOGLE_CLOUD_PROJECT or os.environ.get("GOOGLE_CLOUD_PROJECT")
        location = settings.GOOGLE_CLOUD_LOCATION or os.environ.get("GOOGLE_CLOUD_LOCATION", "global")
        
        # Determine if we should use Vertex AI or direct API Key mode
        use_vertexai = os.environ.get("STORAGE_TYPE") == "gcs" or not api_key
        
        if use_vertexai:
            print(f"AI Service: Initializing Vertex AI for project '{project}' in '{location}'")
            _shared_client = genai.Client(
                vertexai=True,
                project=project,
                location=location
            )
        else:
            print(f"AI Service: Using API Key mode")
            _shared_client = genai.Client(api_key=api_key)
        
        # Models Configuration
        _shared_model_config = {
            "style": "gemini-3-flash-preview",
            "worldview": "gemini-3-flash-preview",
            "director": "gemini-3-flash-preview",
            "image": "gemini-3-pro-image-preview",
            "embedding": "gemini-embedding-001",
            "lite": "gemini-3-flash-preview",
            "analysis": "gemini-3-flash-preview"
        }
        
        return _shared_client, _shared_model_config
        
    except Exception as e:
        print(f"GenAI Client Init Failed: {e}")
        return None, {}


class BaseAIService:
    """
    AI 서비스의 기본 클래스
    
    모든 도메인별 AI 서비스가 상속하는 베이스 클래스입니다.
    GenAI 클라이언트 초기화 및 공통 유틸리티 메서드를 제공합니다.
    """
    
    def __init__(self):
        # 모듈 레벨 공유 클라이언트 사용
        self.client, self.model_config = _get_shared_client()
    
    def _ensure_client(self):
        """클라이언트 초기화 확인"""
        if not self.client:
            raise Exception("AI Service not initialized")
    
    def _clean_json_text(self, text: str) -> str:
        """JSON 문자열에서 마크다운 코드 블록 제거"""
        if not text:
            return "{}"
        text = re.sub(r'^```json\s*', '', text, flags=re.MULTILINE)
        text = re.sub(r'^```\s*', '', text, flags=re.MULTILINE)
        text = re.sub(r'```\s*$', '', text, flags=re.MULTILINE)
        return text.strip()
    
    def _download_image(self, url: str) -> Optional[bytes]:
        from app.services.storage import load_image_ref
        return load_image_ref(url)

    def _download_image_as_pil(self, url: str) -> Optional[Image.Image]:
        """이미지 URL에서 PIL Image로 다운로드"""
        if not url:
            return None
        try:
            img_bytes = self._download_image(url)
            if img_bytes:
                return Image.open(io.BytesIO(img_bytes))
            return None
        except Exception as e:
            print(f"Error converting to PIL Image: {e}")
            return None
    
    def _prepare_multimodal_inputs(
        self, 
        prompt: str, 
        style_ref_url: str = None, 
        character_image_urls: List[str] = None
    ) -> tuple[str, List[types.Part]]:
        """
        멀티모달 생성을 위한 프롬프트 및 이미지 파트 준비
        
        Returns:
            (updated_prompt, parts_list)
        """
        parts = []
        
        # 1. Style Reference
        if style_ref_url:
            print(f"Using style reference image: {style_ref_url}")
            ref_img_bytes = self._download_image(style_ref_url)
            if ref_img_bytes:
                parts.append(types.Part.from_bytes(data=ref_img_bytes, mime_type="image/png"))
                prompt += "\nIMPORTANT: Mimic the art style (line work, coloring, shading technique) of the first provided image exactly. However, do NOT copy or reproduce any characters from the style reference image. Only use it for art style reference."

        # 2. Character Images
        if character_image_urls:
            print(f"Using {len(character_image_urls)} character reference images.")
            for idx, url in enumerate(character_image_urls):
                char_bytes = self._download_image(url)
                if char_bytes:
                    parts.append(types.Part.from_bytes(data=char_bytes, mime_type="image/png"))
                    prompt += f"\n[Reference Image {len(parts)}] is a main character. Include them."
        
        return prompt, parts
    
    def _get_aspect_ratio(self, width: int, height: int) -> str:
        """width, height에서 Gemini 지원 aspect ratio 문자열 반환"""
        ratio = width / height
        if abs(ratio - 3/4) < 0.01:
            return "3:4"
        elif abs(ratio - 9/16) < 0.01:
            return "9:16"
        elif abs(ratio - 4/3) < 0.01:
            return "4:3"
        elif abs(ratio - 16/9) < 0.01:
            return "16:9"
        return "1:1"
    
    def _get_safety_settings(self) -> List[types.SafetySetting]:
        """이미지 생성용 Safety Settings 반환"""
        return [
            types.SafetySetting(
                category="HARM_CATEGORY_HATE_SPEECH",
                threshold="BLOCK_ONLY_HIGH"
            ),
            types.SafetySetting(
                category="HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold="BLOCK_ONLY_HIGH"
            ),
            types.SafetySetting(
                category="HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold="BLOCK_ONLY_HIGH"
            ),
            types.SafetySetting(
                category="HARM_CATEGORY_HARASSMENT",
                threshold="BLOCK_ONLY_HIGH"
            )
        ]
