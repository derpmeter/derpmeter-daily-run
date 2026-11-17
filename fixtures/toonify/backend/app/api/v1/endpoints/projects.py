from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlmodel import Session, select, col
from uuid import UUID
from datetime import datetime

from app.api import deps
from app.core import security
from app.core.errors import AppException, ErrorCode
from app.core.logging import get_logger
from app.models import Project, Workspace, WorkspaceMember, User, Character, Genre, Asset
from app.services.ai import ai_service
from app.services.billing import billing_service
from app.services.storage import storage
from app.schemas import (
    ProjectCreate,
    ProjectUpdate,
    ProjectOut,
    ProjectDetailOut,
    WorldviewAugmentRequest,
    StyleRecommendRequest,
)
from app.tasks.project_tasks import (
    generate_project_cover_task,
    generate_suggestions_bg_task,
)

logger = get_logger(__name__)

router = APIRouter()


@router.get("", response_model=List[ProjectOut])
def list_projects(
    session: Session = Depends(deps.get_session),
    current_user_id: str = Depends(deps.get_current_user_id),
) -> Any:
    """
    List all projects in workspaces the user is a member of.
    """
    statement = select(WorkspaceMember.workspace_id).where(WorkspaceMember.user_id == current_user_id)
    workspace_ids = session.exec(statement).all()
    
    if not workspace_ids:
        return []

    statement = select(Project).where(
        col(Project.workspace_id).in_(workspace_ids),
        Project.deleted_at == None
    )
    projects = session.exec(statement).all()

    # Manual mapping to valid dicts for ProjectOut
    results = []
    for p in projects:
        # Resolve Genres
        g_names = [g.name for g in p.genres] if p.genres else []
        g_ids = [g.id for g in p.genres] if p.genres else []
        
        # Resolve Thumbnail
        thumb = None
        if p.thumbnail_asset_id:
             if not p.thumbnail_asset: 
                 pass 
             thumb = p.thumbnail_asset.file_url if p.thumbnail_asset else None
        
        p_dict = p.dict()
        p_dict['genres'] = g_names
        p_dict['genre_ids'] = g_ids
        # Backward compatibility for frontend
        p_dict['genre'] = ", ".join(g_names)
        
        p_dict['thumbnail_url'] = thumb
        p_dict['cover_image_status'] = p.cover_image_status
        results.append(p_dict)
    
    return results

@router.post("", response_model=ProjectOut)
def create_project(
    *,
    session: Session = Depends(deps.get_session),
    project_in: ProjectCreate,
    background_tasks: BackgroundTasks,
    current_user_id: str = Depends(deps.get_current_user_id),
) -> Any:
    """
    Create a new project.
    """
    logger.debug("create_project called", title=project_in.title)
    try:
        # Get user's default workspace
        ws_statement = select(WorkspaceMember).where(WorkspaceMember.user_id == current_user_id)
        member = session.exec(ws_statement).first()
        
        if not member:
             raise AppException(error_code=ErrorCode.NOT_FOUND_WORKSPACE)
        
        workspace_id = member.workspace_id

        # Handle worldview
        final_worldview = project_in.worldview
        if isinstance(final_worldview, str):
            final_worldview = {"content": final_worldview, "title": f"{project_in.title} World", "tone": []}
        elif isinstance(final_worldview, dict):
             if "tone" not in final_worldview:
                 final_worldview["tone"] = []
             if isinstance(final_worldview.get("tone"), str):
                  final_worldview["tone"] = [final_worldview["tone"]]

        # Get User Language
        user = session.get(User, current_user_id)
        user_lang = user.language if user else "en"

        project = Project(
            title=project_in.title,
            subtitle=project_in.subtitle,
            # genre_id=project_in.genre_id, # Deprecated
            worldview=final_worldview,
            style_preset=project_in.style_preset,
            style_reference_url=project_in.style_reference_url,
            workspace_id=workspace_id,
            owner_id=current_user_id,
            language=project_in.language or user_lang
        )
        session.add(project)
        session.commit()
        session.refresh(project)

        # Handle Genres
        if project_in.genre_ids:
            for gid in project_in.genre_ids:
                if isinstance(gid, str):
                    gid = UUID(gid)
                genre = session.get(Genre, gid)
                if genre:
                    project.genres.append(genre)
            session.add(project)
            session.commit()
            session.refresh(project)
        
        p_dict = project.dict()
        p_dict['genres'] = [g.name for g in project.genres]
        p_dict['genre_ids'] = [g.id for g in project.genres]
        p_dict['genre'] = ", ".join([g.name for g in project.genres])
        
        p_dict['thumbnail_url'] = project.thumbnail_asset.file_url if project.thumbnail_asset else None
        p_dict['cover_image_status'] = project.cover_image_status

        # Async Character Suggestions Trigger
        if project.worldview:
            wv_desc = ""
            if isinstance(project.worldview, dict):
                wv_desc = project.worldview.get("content") or project.worldview.get("description") or ""
            else:
                wv_desc = str(project.worldview)
            
            context = f"""
            Title: {project.title}
            Genre: {", ".join([g.name for g in project.genres])}
            Worldview: {wv_desc}
            """
            background_tasks.add_task(generate_suggestions_bg_task, str(project.id), context, project.language)
            project.suggestions_status = "processing"
            session.add(project)
            session.commit()
            session.refresh(project)

        return p_dict
    except Exception as e:
        raise e

@router.post("/worldview/augment")
def augment_worldview(
    *,
    session: Session = Depends(deps.get_session),
    request: WorldviewAugmentRequest,
    current_user_id: str = Depends(deps.get_current_user_id),
) -> Any:
    """
    Augment the worldview description using AI.
    """
    try:
        # Deduct Credits (Cost: 5)
        ws_statement = select(WorkspaceMember).where(WorkspaceMember.user_id == current_user_id)
        member = session.exec(ws_statement).first()
        if not member:
             raise HTTPException(status_code=404, detail="No workspace found for user.")
        
        billing_service.deduct_credits(session, member.workspace_id, UUID(current_user_id), "augment_worldview")
        
        user = session.get(User, current_user_id)
        # Prioritize request language, then user language, then default 'en'
        lang = request.language or (user.language if user else "en")

        result = ai_service.augment_worldview(
            description=request.description,
            title=request.title,
            subtitle=request.subtitle,
            genres=request.genres,
            language=lang
        )
        return result
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{project_id}", response_model=ProjectDetailOut)
def get_project(
    *,
    session: Session = Depends(deps.get_session),
    project_id: str,
    current_user_id: str = Depends(deps.get_current_user_id),
) -> Any:
    """
    Get project details.
    """
    try:
        project_uuid = UUID(project_id)
    except ValueError:
        raise AppException(error_code=ErrorCode.VALIDATION_INVALID_UUID)

    project = session.get(Project, project_uuid)
    if not project:
        raise AppException(error_code=ErrorCode.NOT_FOUND_PROJECT)
    
    p_dict = project.dict()
    g_names = [g.name for g in project.genres] if project.genres else []
    p_dict['genres'] = g_names
    p_dict['genre_ids'] = [g.id for g in project.genres] if project.genres else []
    p_dict['genre'] = ", ".join(g_names)

    p_dict['thumbnail_url'] = project.thumbnail_asset.file_url if project.thumbnail_asset else None
    p_dict['cover_image_status'] = project.cover_image_status
    
    # Robust serialization - exclude heavy embedding fields
    chars_data = []
    try:
        if project.characters:
            for c in project.characters:
                if c.deleted_at is not None:
                    continue
                try:
                    # Exclude 'embedding' field to prevent massive JSON response
                    char_dict = c.dict(exclude={'embedding'})
                    chars_data.append(char_dict)
                except Exception as e:
                    logger.warning("Failed to serialize character", character_id=str(c.id), error=str(e))
    except Exception as e:
        logger.warning("Failed to load characters", error=str(e))
        
    p_dict['characters'] = chars_data
    
    return p_dict

@router.patch("/{project_id}", response_model=ProjectOut)
def update_project(
    *,
    session: Session = Depends(deps.get_session),
    project_id: str,
    project_in: ProjectUpdate,
    background_tasks: BackgroundTasks,
    current_user_id: str = Depends(deps.get_current_user_id),
) -> Any:
    """
    Update a project.
    """
    try:
        project_uuid = UUID(project_id)
    except ValueError:
        raise AppException(error_code=ErrorCode.VALIDATION_INVALID_UUID)

    project = session.get(Project, project_uuid)
    if not project:
        raise AppException(error_code=ErrorCode.NOT_FOUND_PROJECT)

    project_data = project_in.dict(exclude_unset=True)
    
    if 'worldview' in project_data and project_data['worldview']:
         wv = project_data['worldview']
         if isinstance(wv, dict):
             if "tone" not in wv:
                 wv["tone"] = []
             if isinstance(wv.get("tone"), str):
                  wv["tone"] = [wv["tone"]]
         project_data['worldview'] = wv

    # Update basic fields
    for key, value in project_data.items():
        if key in ['genre_ids', 'characters']: continue # skip special fields
        if hasattr(project, key):
            setattr(project, key, value)

    # Update Genres if provided
    if project_in.genre_ids is not None:
        project.genres = [] # Clear existing
        for gid in project_in.genre_ids:
             if isinstance(gid, str): gid = UUID(gid)
             genre = session.get(Genre, gid)
             if genre:
                 project.genres.append(genre)

    session.add(project)
    session.commit()
    session.refresh(project)
    
    p_dict = project.dict()
    g_names = [g.name for g in project.genres] if project.genres else []
    p_dict['genres'] = g_names
    p_dict['genre_ids'] = [g.id for g in project.genres] if project.genres else []
    p_dict['genre'] = ", ".join(g_names)

    p_dict['thumbnail_url'] = project.thumbnail_asset.file_url if project.thumbnail_asset else None
    p_dict['cover_image_status'] = project.cover_image_status

    return p_dict

@router.post("/{project_id}/cover", response_model=Any)
def generate_cover(
    *,
    session: Session = Depends(deps.get_session),
    project_id: str,
    background_tasks: BackgroundTasks,
    current_user_id: str = Depends(deps.get_current_user_id),
) -> Any:
    """
    Trigger AI cover image generation for the project.
    """
    try:
        project_uuid = UUID(project_id)
    except ValueError:
        raise AppException(error_code=ErrorCode.VALIDATION_INVALID_UUID)

    project = session.get(Project, project_uuid)
    if not project:
        raise AppException(error_code=ErrorCode.NOT_FOUND_PROJECT)

    # Deduct Credits (Cost: 15)
    billing_service.deduct_credits(session, project.workspace_id, UUID(current_user_id), "generate_project_cover_image")

    wv_content = ""
    tones = []
    if project.worldview:
        if isinstance(project.worldview, dict):
             wv_content = project.worldview.get("content", "") or project.worldview.get("description", "")
             tones = project.worldview.get("tone", [])
             if isinstance(tones, str):
                 tones = [tones]
             wv_content = str(project.worldview)
    
    # genre_name = project.genre.name if project.genre else "Fantasy"
    genre_names = [g.name for g in project.genres] if project.genres else ["Fantasy"]
    genre_name = ", ".join(genre_names)
    
    char_statement = select(Character).where(Character.project_id == project.id).where(Character.deleted_at == None).limit(6)
    chars = session.exec(char_statement).all()
    char_urls = []
    for c in chars:
        if c.profile_image_url:
            char_urls.append(c.profile_image_url)
    
    logger.debug("Found character images for cover generation", count=len(char_urls))

    project.cover_image_status = "processing"
    session.add(project)
    session.commit()
    session.refresh(project)

    background_tasks.add_task(
        generate_project_cover_task, 
        str(project.id), 
        project.title, 
        genre_name, 
        wv_content, 
        project.style_preset,
        tones,
        project.style_reference_url if project.style_reference_url else None,
        char_urls,
        language=project.language
    )

    return {"message": "Cover generation started"}

@router.post("/styles/recommend")
def recommend_styles(
    *,
    session: Session = Depends(deps.get_session),
    request: StyleRecommendRequest,
    current_user_id: str = Depends(deps.get_current_user_id),
) -> Any:
    """
    Recommend 3 style options based on description using AI.
    """
    try:
        # Deduct Credits (Cost: 1)
        ws_statement = select(WorkspaceMember).where(WorkspaceMember.user_id == current_user_id)
        member = session.exec(ws_statement).first()
        if not member:
             raise HTTPException(status_code=404, detail="No workspace found for user.")
        
        billing_service.deduct_credits(session, member.workspace_id, UUID(current_user_id), "recommend_style")

        user = session.get(User, current_user_id)
        user_lang = user.language if user else "en"

        styles = ai_service.recommend_style(request.description, language=user_lang)
        return styles
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{project_id}", response_model=Any)
def delete_project(
    *,
    session: Session = Depends(deps.get_session),
    project_id: str,
    current_user_id: str = Depends(deps.get_current_user_id),
) -> Any:
    """
    Soft delete a project.
    """
    try:
        project_uuid = UUID(project_id)
    except ValueError:
        raise AppException(error_code=ErrorCode.VALIDATION_INVALID_UUID)

    project = session.get(Project, project_uuid)
    if not project:
        raise AppException(error_code=ErrorCode.NOT_FOUND_PROJECT)

    # Verify Workspace Membership
    ws_member = session.get(WorkspaceMember, (project.workspace_id, UUID(current_user_id)))
    if not ws_member:
        raise AppException(error_code=ErrorCode.FORBIDDEN_WORKSPACE)

    # Soft Delete
    project.deleted_at = datetime.utcnow()
    session.add(project)
    session.commit()
    
    return {"message": "Project deleted successfully"}
