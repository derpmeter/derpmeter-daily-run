from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlmodel import Session, select, col
from uuid import UUID

from app.api import deps
from app.models.models import Asset, WorkspaceMember
from app.services.storage import storage
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

from app.core.config import settings
from pydantic import BaseModel, validator

class AssetOut(BaseModel):
    id: UUID
    filename: str
    file_url: str
    file_type: str
    created_at: datetime
    workspace_id: UUID

    @validator("file_url", pre=True, always=True)
    def make_full_url(cls, v: str) -> str:
        if v and not v.startswith("http"):
             return f"{settings.STORAGE_HOST}/{v}"
        return v
    
@router.get("/", response_model=List[AssetOut])
def list_assets(
    session: Session = Depends(deps.get_session),
    current_user_id: str = Depends(deps.get_current_user_id),
) -> Any:
    # ... (existing code)

# ...

    # Upload to storage
    try:
        url = storage.upload_image(contents, schema="workspaces", identifier=str(workspace_id), content_type=file.content_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload to storage: {str(e)}")
    
    asset = Asset(
        workspace_id=workspace_id,
        user_id=UUID(current_user_id),
        filename=file.filename,
        file_url=url,
        file_type=file.content_type
    )
    session.add(asset)
    session.commit()
    session.refresh(asset)
    
    return asset
