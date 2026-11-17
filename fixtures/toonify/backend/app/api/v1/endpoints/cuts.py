from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from app.api import deps
from app.models import Episode, StoryCut, Project
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID

router = APIRouter()

class StoryCutCreate(BaseModel):
    episode_id: UUID
    cut_order: int
    script: str = ""
    selected_layout: str = "single"
    aspect_ratio: str = "1:1"
    dialogues: List[dict] = []
    appearing_characters: List[dict] = []
    refer_prev_cut: bool = True
    image_path: Optional[str] = None

class StoryCutUpdate(BaseModel):
    script: Optional[str] = None
    selected_layout: Optional[str] = None
    aspect_ratio: Optional[str] = None
    dialogues: Optional[List[dict]] = None
    appearing_characters: Optional[List[dict]] = None
    refer_prev_cut: Optional[bool] = None
    image_path: Optional[str] = None
    cut_order: Optional[int] = None

from app.core.config import settings
from pydantic import BaseModel, validator

# ...

class StoryCutOut(BaseModel):
    id: Any
    episode_id: Any
    cut_order: int
    script: str
    selected_layout: str
    aspect_ratio: str
    dialogues: List[dict]
    appearing_characters: List[Any] = []
    refer_prev_cut: bool = True
    image_path: Optional[str] = None
    status: str = "idle"
    created_at: datetime

    @validator("image_path", pre=True, always=True)
    def make_full_url(cls, v: str | None) -> str | None:
        if v and not v.startswith("http") and not v.startswith("data:"):
             return f"{settings.STORAGE_HOST}/{v}"
        return v

@router.get("", response_model=List[StoryCutOut])
def list_cuts(
    *,
    session: Session = Depends(deps.get_session),
    episode_id: UUID,
    current_user_id: str = Depends(deps.get_current_user_id),
) -> Any:
    """
    List cuts for a specific episode.
    """
    # Check if episode is deleted
    episode = session.get(Episode, episode_id)
    if not episode or episode.deleted_at is not None:
        return []
        
    statement = select(StoryCut).where(StoryCut.episode_id == episode_id).order_by(StoryCut.cut_order)
    cuts = session.exec(statement).all()
    return cuts

@router.post("", response_model=StoryCutOut)
def create_cut(
    *,
    session: Session = Depends(deps.get_session),
    cut_in: StoryCutCreate,
    current_user_id: str = Depends(deps.get_current_user_id),
) -> Any:
    """
    Create a new story cut.
    """
    # Check if episode is deleted
    episode = session.get(Episode, cut_in.episode_id)
    if not episode or episode.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Episode not found")
        
    # Generate Embedding for RAG
    from app.services.ai import ai_service
    embedding = None
    if cut_in.script:
        embedding = ai_service.get_embedding(cut_in.script)

    cut = StoryCut(
        episode_id=cut_in.episode_id,
        cut_order=cut_in.cut_order,
        script=cut_in.script,
        selected_layout=cut_in.selected_layout,
        aspect_ratio=cut_in.aspect_ratio,
        dialogues=cut_in.dialogues,
        image_path=cut_in.image_path,
        embedding=embedding
    )
    session.add(cut)
    session.commit()
    session.refresh(cut)
    return cut

@router.get("/{cut_id}", response_model=StoryCutOut)
def get_cut(
    *,
    session: Session = Depends(deps.get_session),
    cut_id: UUID,
    current_user_id: str = Depends(deps.get_current_user_id),
) -> Any:
    """
    Get a specific story cut.
    """
    cut = session.get(StoryCut, cut_id)
    if not cut:
        raise HTTPException(status_code=404, detail="Cut not found")
        
    episode = session.get(Episode, cut.episode_id)
    if not episode or episode.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Cut not found (episode deleted)")
        
    return cut

@router.put("/{cut_id}", response_model=StoryCutOut)
def update_cut(
    *,
    session: Session = Depends(deps.get_session),
    cut_id: UUID,
    cut_in: StoryCutUpdate,
    current_user_id: str = Depends(deps.get_current_user_id),
) -> Any:
    """
    Update a story cut.
    """
    cut = session.get(StoryCut, cut_id)
    if not cut:
        raise HTTPException(status_code=404, detail="Cut not found")
        
    episode = session.get(Episode, cut.episode_id)
    if not episode or episode.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Cut not found (episode deleted)")
        
    cut_data = cut_in.dict(exclude_unset=True)
    
    # Update Embedding if script changed
    if "script" in cut_data:
        from app.services.ai import ai_service
        cut.embedding = ai_service.get_embedding(cut_data["script"])

    for key, value in cut_data.items():
        setattr(cut, key, value)
        
    session.add(cut)
    session.commit()
    session.refresh(cut)
    return cut


@router.delete("/{cut_id}")
def delete_cut(
    *,
    session: Session = Depends(deps.get_session),
    cut_id: UUID,
    current_user_id: str = Depends(deps.get_current_user_id),
) -> Any:
    """
    Delete a story cut.
    """
    cut = session.get(StoryCut, cut_id)
    if not cut:
        raise HTTPException(status_code=404, detail="Cut not found")
        
    episode = session.get(Episode, cut.episode_id)
    if not episode or episode.deleted_at is not None:
         raise HTTPException(status_code=404, detail="Cut not found (episode deleted)")
        
    session.delete(cut)
    session.commit()
    from fastapi import Response
    return Response(status_code=204)
