from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.api import deps
from app.models import Clue, Project
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID

router = APIRouter()

class ClueCreate(BaseModel):
    project_id: UUID
    description: str
    created_episode_id: Optional[UUID] = None

class ClueUpdate(BaseModel):
    description: Optional[str] = None
    status: Optional[str] = None # "active", "resolved"
    resolved_episode_id: Optional[UUID] = None

class ClueOut(BaseModel):
    id: Any
    project_id: Any
    description: str
    status: str
    created_episode_id: Optional[Any] = None
    resolved_episode_id: Optional[Any] = None
    created_at: datetime

@router.get("/", response_model=List[ClueOut])
def list_clues(
    *,
    session: Session = Depends(deps.get_session),
    project_id: UUID,
    status: Optional[str] = None,
    current_user_id: str = Depends(deps.get_current_user_id),
) -> Any:
    """
    List clues for a specific project.
    """
    query = select(Clue).where(Clue.project_id == project_id)
    if status:
        query = query.where(Clue.status == status)
    
    clues = session.exec(query).all()
    return clues

@router.post("", response_model=ClueOut)
def create_clue(
    *,
    session: Session = Depends(deps.get_session),
    clue_in: ClueCreate,
    current_user_id: str = Depends(deps.get_current_user_id),
) -> Any:
    """
    Create a new clue (foreshadowing).
    """
    # Verify project exists
    project = session.get(Project, clue_in.project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    clue = Clue(
        project_id=clue_in.project_id,
        description=clue_in.description,
        created_episode_id=clue_in.created_episode_id,
        status="active"
    )
    session.add(clue)
    session.commit()
    session.refresh(clue)
    return clue

@router.patch("/{clue_id}", response_model=ClueOut)
def update_clue(
    *,
    session: Session = Depends(deps.get_session),
    clue_id: UUID,
    clue_in: ClueUpdate,
    current_user_id: str = Depends(deps.get_current_user_id),
) -> Any:
    """
    Update a clue (e.g., mark as resolved).
    """
    clue = session.get(Clue, clue_id)
    if not clue:
        raise HTTPException(status_code=404, detail="Clue not found")
        
    clue_data = clue_in.dict(exclude_unset=True)
    for key, value in clue_data.items():
        setattr(clue, key, value)
        
    session.add(clue)
    session.commit()
    session.refresh(clue)
    return clue

@router.delete("/{clue_id}")
def delete_clue(
    *,
    session: Session = Depends(deps.get_session),
    clue_id: UUID,
    current_user_id: str = Depends(deps.get_current_user_id),
) -> Any:
    """
    Delete a clue.
    """
    clue = session.get(Clue, clue_id)
    if not clue:
        raise HTTPException(status_code=404, detail="Clue not found")
        
    session.delete(clue)
    session.commit()
    from fastapi import Response
    return Response(status_code=204)
