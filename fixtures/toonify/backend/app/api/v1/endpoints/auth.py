from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select

from app.api import deps
from app.core import security
from app.models import User, Workspace, WorkspaceMember
from pydantic import BaseModel, EmailStr

router = APIRouter()

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    username: str # Just for display if needed, but model only has email. Wait, model has no username.
    # Let's check models. User has email, password_hash. No username.
    # We can omit username or add it to DB later. For now, let's use email as ID.

class UserOut(BaseModel):
    id: Any
    email: EmailStr
    
class Token(BaseModel):
    access_token: str
    token_type: str

@router.post("/signup", response_model=UserOut)
def create_user(
    *,
    session: Session = Depends(deps.get_session),
    user_in: UserCreate,
) -> Any:
    """
    Create new user without the need to be logged in.
    Also creates a default Workspace.
    """
    user = session.exec(
        select(User).where(User.email == user_in.email)
    ).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system",
        )
    
    # 1. Create User
    user = User(
        email=user_in.email,
        password_hash=security.get_password_hash(user_in.password)
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    # 2. Create Default Workspace
    workspace = Workspace(
        name=f"{user_in.email.split('@')[0]}'s Workspace",
        owner_id=user.id,
        tier="free",
        credits=500  # Welcome Bonus: 500 Credits (PLANS.md)
    )
    session.add(workspace)
    session.commit()
    session.refresh(workspace)

    # 3. Add User to Workspace as Member (Role: Owner)
    member = WorkspaceMember(
        workspace_id=workspace.id,
        user_id=user.id,
        role="owner"
    )
    session.add(member)
    session.commit()

    return user

@router.post("/login/access-token", response_model=Token)
def login_access_token(
    session: Session = Depends(deps.get_session),
    form_data: OAuth2PasswordRequestForm = Depends(),
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    user = session.exec(
        select(User).where(User.email == form_data.username)
    ).first()
    if not user or not security.verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token = security.create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
    }

class UserSync(BaseModel):
    email: EmailStr
    clerk_id: str
    name: Optional[str] = None

@router.post("/sync-clerk", response_model=Any)
def sync_clerk_user(
    *,
    session: Session = Depends(deps.get_session),
    user_in: UserSync,
) -> Any:
    """
    Sync Clerk user to local DB.
    """
    user = session.exec(
        select(User).where(User.email == user_in.email)
    ).first()

    if user:
        # Update existing user if needed (ensure marked as clerk)
        # Note: We only overwrite if not already clerk or just to ensure consistency
        if user.auth_provider != "clerk" or user.clerk_id != user_in.clerk_id:
             user.auth_provider = "clerk"
             user.clerk_id = user_in.clerk_id
             user.password_hash = "!CLERK_LOGIN_ONLY" # Disable password login
             session.add(user)
             session.commit()
             session.refresh(user)
    else:
        # Create new user
        user = User(
            email=user_in.email,
            password_hash="!CLERK_LOGIN_ONLY",
            auth_provider="clerk",
            clerk_id=user_in.clerk_id,
            language="ko" # Default to Korean for this user base
        )
        session.add(user)
        session.commit()
        session.refresh(user)
    
    # Ensure Workspace exists
    # We need to refresh to check relationships? 
    # Or just query WorkspaceMember
    
    # Re-fetch user with workspaces loaded or check manually
    # User.workspaces is a relationship, might fail if lazy loaded in sync context without refresh
    # But sync_clerk_user returned user so session is likely active.
    
    # Let's check if user has any workspace via relationship
    # Note: If we just committed, we should refresh to get clean state
    # But usually lazy load works if session open.
    
    # Safe check:
    member_check = session.exec(select(WorkspaceMember).where(WorkspaceMember.user_id == user.id)).first()
    
    if not member_check:
        # Create Default Workspace
        # Use name or email
        ws_name = f"{user_in.name or user_in.email.split('@')[0]}'s Workspace"
        
        workspace = Workspace(
            name=ws_name,
            owner_id=user.id,
            tier="free",
            credits=500  # Welcome Bonus: 500 Credits (PLANS.md)
        )
        session.add(workspace)
        session.commit()
        session.refresh(workspace)

        member = WorkspaceMember(
            workspace_id=workspace.id,
            user_id=user.id,
            role="owner"
        )
        session.add(member)
        session.commit()
    
    # Generate Access Token
    access_token = security.create_access_token(subject=user.id)
    
    return {
        "user": user,
        "access_token": access_token,
        "token_type": "bearer"
    }
