from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from uuid import UUID

from app.api import deps
from app.models import Workspace, WorkspaceMember, User
from pydantic import BaseModel
from datetime import datetime
from app.services.billing import billing_service

router = APIRouter()

class WorkspaceCreate(BaseModel):
    name: str

class WorkspaceOut(BaseModel):
    id: UUID
    name: str
    owner_id: UUID
    tier: str
    credits: int
    created_at: datetime
    role: str | None = None # Current user's role

@router.get("", response_model=List[WorkspaceOut])
def list_workspaces(
    session: Session = Depends(deps.get_session),
    current_user_id: str = Depends(deps.get_current_user_id),
) -> Any:
    """
    List all workspaces the current user is a member of.
    """
    # Join workspace and member to get details
    statement = (
        select(Workspace, WorkspaceMember.role)
        .join(WorkspaceMember, Workspace.id == WorkspaceMember.workspace_id)
        .where(WorkspaceMember.user_id == current_user_id)
    )
    results = session.exec(statement).all()
    
    workspaces = []
    for ws, role in results:
        ws_out = WorkspaceOut(
            id=ws.id,
            name=ws.name,
            owner_id=ws.owner_id,
            tier=ws.tier,
            credits=ws.credits,
            created_at=ws.created_at,
            role=role
        )
        workspaces.append(ws_out)
        
    return workspaces

@router.post("", response_model=WorkspaceOut)
def create_workspace(
    *,
    session: Session = Depends(deps.get_session),
    workspace_in: WorkspaceCreate,
    current_user_id: str = Depends(deps.get_current_user_id),
) -> Any:
    """
    Create a new workspace.
    """
    # 1. Create Workspace
    workspace = Workspace(
        name=workspace_in.name,
        owner_id=current_user_id,
        tier="free",
        credits=500 # Default starting credits (Welcome Bonus)
    )
    session.add(workspace)
    session.commit()
    session.refresh(workspace)

    # 2. Add Member as Owner
    member = WorkspaceMember(
        workspace_id=workspace.id,
        user_id=current_user_id,
        role="owner"
    )
    session.add(member)
    session.commit()
    
    return WorkspaceOut(
        id=workspace.id,
        name=workspace.name,
        owner_id=workspace.owner_id,
        tier=workspace.tier,
        credits=workspace.credits,
        created_at=workspace.created_at,
        role="owner"
    )

@router.get("/{workspace_id}", response_model=WorkspaceOut)
def get_workspace(
    *,
    session: Session = Depends(deps.get_session),
    workspace_id: UUID,
    current_user_id: str = Depends(deps.get_current_user_id),
) -> Any:
    """
    Get workspace details.
    """
    # Check membership
    member = session.exec(
        select(WorkspaceMember)
        .where(WorkspaceMember.workspace_id == workspace_id)
        .where(WorkspaceMember.user_id == current_user_id)
    ).first()
    
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this workspace")
        
    workspace = session.get(Workspace, workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Check for Daily Refill
    if billing_service.check_daily_refill(session, workspace_id):
        session.refresh(workspace) # Refresh to get updated credits
        
    return WorkspaceOut(
        id=workspace.id,
        name=workspace.name,
        owner_id=workspace.owner_id,
        tier=workspace.tier,
        credits=workspace.credits,
        created_at=workspace.created_at,
        role=member.role
    )


@router.get("/{workspace_id}/credits/history")
def credit_history(
    *,
    session: Session = Depends(deps.get_session),
    workspace_id: UUID,
    current_user_id: str = Depends(deps.get_current_user_id),
) -> Any:
    """The workspace's credit changes, newest first."""
    from app.models.models import CreditTransaction
    member = session.exec(
        select(WorkspaceMember)
        .where(WorkspaceMember.workspace_id == workspace_id)
        .where(WorkspaceMember.user_id == current_user_id)
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Workspace not found")
    rows = session.exec(select(CreditTransaction).where(CreditTransaction.workspace_id == workspace_id)
                        .order_by(CreditTransaction.timestamp.desc())).all()
    return [{"amount": r.amount, "action": r.action_type, "created_at": r.timestamp.isoformat()} for r in rows]
