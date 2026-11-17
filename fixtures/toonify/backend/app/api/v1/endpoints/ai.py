from typing import Any
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from app.api import deps
from app.models import User
from sqlmodel import Session, select
from app.services.ai import ai_service
from app.services.storage import storage
from app.core.logging import get_logger
import time

logger = get_logger(__name__)

router = APIRouter()

class GenerateRequest(BaseModel):
    prompt: str
    width: int
    height: int
    style_preset: str = "anime_webtoon"

from app.core.config import settings
from pydantic import BaseModel, validator

class GenerateResponse(BaseModel):
    image_url: str

    @validator("image_url", pre=True, always=True)
    def make_full_url(cls, v: str) -> str:
        if v and not v.startswith("http"):
             # If v is a relative path, prepend STORAGE_HOST
             return f"{settings.STORAGE_HOST}/{v}"
        return v

@router.post("/generate", response_model=GenerateResponse)
async def generate_image(
    *,
    request: GenerateRequest,
    session: Session = Depends(deps.get_session),
    current_user_id: str = Depends(deps.get_current_user_id),
) -> Any:
    """
    Generate image using Real AI (Gemini/Imagen) and store in MinIO.
    """
    try:
        # 1. Generate Image (Bytes)
        # Note: This is a blocking call if not careful. For production, offload to Celery/ARQ.
        # For prototype, we run it directly or in a thread. 
        # Since AIService mock is CPU bound (PIL) or Network bound (API), 
        # async handling depends on library. Fast API handles sync functions in threadpool.
        
        # We'll use the service synchronously for now.
        # Fetch User Language
        user = session.get(User, current_user_id)
        user_lang = user.language if user else "en"

        image_bytes = ai_service.generate_image(
            prompt=request.prompt, 
            width=request.width, 
            height=request.height,
            language=user_lang
        )
        
        # 2. Upload to Storage
        # For temp generation, use 'temp/generated'
        image_url = storage.upload_image(image_bytes, schema="temp", identifier="generated", content_type="image/png")
        
        return GenerateResponse(image_url=image_url)
        
    except Exception as e:
        logger.error("Generation failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

