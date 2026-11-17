from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks, Response
from sqlmodel import Session, select, col
from datetime import datetime
from uuid import UUID

from app.api import deps
from app.models import Character, Project, Asset
from app.core.logging import get_logger
from app.services.storage import storage
from app.services.ai import ai_service
from app.services.billing import billing_service
from app.schemas import (
    CharacterCreate,
    CharacterUpdate,
    CharacterAugmentRequest,
    CharacterOut,
    CharacterOption,
    CharacterAugmentResponse,
    SuggestionRequest,
    CharacterAnalysisRequest,
    BatchSuggestionRequest,
    SuggestionUseRequest,
)
from app.tasks.character_tasks import generate_character_image_task

logger = get_logger(__name__)

router = APIRouter()


@router.get("", response_model=List[CharacterOut])
def list_characters(
    *,
    session: Session = Depends(deps.get_session),
    project_id: UUID,
    current_user_id: str = Depends(deps.get_current_user_id),
) -> Any:
    """
    List characters for a specific project.
    """
    # Verify access
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    statement = select(Character).where(Character.project_id == project_id).where(Character.deleted_at == None)
    characters = session.exec(statement).all()
    return characters


@router.post("", response_model=CharacterOut)
def create_character(
    *,
    session: Session = Depends(deps.get_session),
    character_in: CharacterCreate,
    current_user_id: str = Depends(deps.get_current_user_id),
) -> Any:
    """
    Create a new character.
    """
    # Verify project exists
    project = session.get(Project, character_in.project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    character = Character(
        name=character_in.name,
        project_id=character_in.project_id,
        appearance_tags=character_in.appearance_tags,
        default_mood=character_in.default_mood,

        consistency_seed=0,
        profile_image_url=None,
        description=character_in.description,
        profile=character_in.profile
    )
    # Generate Embedding
    mood_str = " ".join(character_in.default_mood)
    combined_text = f"{character_in.name} {mood_str} {' '.join(character_in.appearance_tags)}"
    character.embedding = ai_service.get_embedding(combined_text)

    session.add(character)
    session.commit()
    session.refresh(character)
    return character


@router.patch("/{character_id}", response_model=CharacterOut)
def update_character(
    *,
    session: Session = Depends(deps.get_session),
    character_id: UUID,
    character_in: CharacterUpdate,
    current_user_id: str = Depends(deps.get_current_user_id),
) -> Any:
    """
    Update a character.
    """
    character = session.get(Character, character_id)
    if not character or character.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Character not found")
        
    character_data = character_in.dict(exclude_unset=True)
    should_update_embedding = any(k in character_data for k in ["name", "appearance_tags", "default_mood", "description"])
    
    for key, value in character_data.items():
        setattr(character, key, value)

    if should_update_embedding:
        tags = character.appearance_tags or []
        desc = character.description or ""
        moods = character.default_mood or []
        mood_str = " ".join(moods)
        combined_text = f"{character.name} {mood_str} {' '.join(tags)} {desc}"
        character.embedding = ai_service.get_embedding(combined_text)
        
    session.add(character)
    session.commit()
    session.refresh(character)
    session.refresh(character)
    return character


@router.get("/{character_id}", response_model=CharacterOut)
def get_character(
    *,
    session: Session = Depends(deps.get_session),
    character_id: UUID,
    current_user_id: str = Depends(deps.get_current_user_id),
) -> Any:
    """
    Get a specific character by ID.
    """
    character = session.get(Character, character_id)
    if not character or character.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Character not found")
    return character


@router.delete("/{character_id}")
def delete_character(
    *,
    session: Session = Depends(deps.get_session),
    character_id: UUID,
    current_user_id: str = Depends(deps.get_current_user_id),
) -> Any:
    """
    Soft delete a character.
    """
    character = session.get(Character, character_id)
    if not character or character.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Character not found")
        
    character.deleted_at = datetime.utcnow()
    session.add(character)
    session.commit()
    
    return Response(status_code=204)

@router.post("/augment", response_model=CharacterAugmentResponse)
def augment_character(
    *,
    request: CharacterAugmentRequest,
    session: Session = Depends(deps.get_session),
    current_user_id: str = Depends(deps.get_current_user_id),
):
    """
    Augments character tags and description into 3 distinct options.
    """
    project = session.get(Project, request.project_id)
    if not project:
         raise HTTPException(status_code=404, detail="Project not found")

    # Deduct Credits (Cost: 5)
    billing_service.deduct_credits(session, project.workspace_id, UUID(current_user_id), "augment_character_text")

    # Construct Context
    wv_desc = ""
    if project.worldview:
        if isinstance(project.worldview, dict):
            # Prefer 'content' or 'description'
            wv_desc = project.worldview.get("content") or project.worldview.get("description") or ""
        else:
             wv_desc = str(project.worldview)

    project_context = f"""
    Title: {project.title}
    Genre: {", ".join([g.name for g in project.genres]) if project.genres else 'Unknown'}
    Worldview: {wv_desc}
    """

    result = ai_service.augment_character_text(
        name=request.name,
        tags=request.tags,
        mood=request.mood,
        style=project.style_preset,
        project_context=project_context,
        language=request.language or project.language or "en"
    )
    return result



@router.post("/{character_id}/generate", response_model=CharacterOut)
def generate_character_image(
    *,
    session: Session = Depends(deps.get_session),
    character_id: UUID,
    background_tasks: BackgroundTasks,
    current_user_id: str = Depends(deps.get_current_user_id),
) -> Any:
    """
    Start background generation of character sheet.
    """
    character = session.get(Character, character_id)
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")
        
    project = session.get(Project, character.project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Deduct Credits (Cost: 20)
    billing_service.deduct_credits(session, project.workspace_id, UUID(current_user_id), "generate_character_sheet")

    # Set status to processing immediately
    character.sheet_status = "processing"
    session.add(character)
    session.commit()
    session.refresh(character)

    # Add background task
    background_tasks.add_task(generate_character_image_task, character_id, "")
    
    return character

@router.post("/suggest", response_model=Any)
def suggest_character_attribute(
    *,
    request: SuggestionRequest,
    session: Session = Depends(deps.get_session),
    current_user_id: str = Depends(deps.get_current_user_id),
):
    """
    Get AI suggestion for character attributes.
    """
    project = session.get(Project, request.project_id)
    if not project:
         raise HTTPException(status_code=404, detail="Project not found")

    # Deduct Credits (Cost: 1)
    billing_service.deduct_credits(session, project.workspace_id, UUID(current_user_id), "get_character_suggestion")

    # Construct Context
    wv_desc = ""
    if project.worldview:
        if isinstance(project.worldview, dict):
            wv_desc = project.worldview.get("content") or project.worldview.get("description") or ""
        else:
             wv_desc = str(project.worldview)

    project_context = f"""
    Title: {project.title}
    Genre: {", ".join([g.name for g in project.genres]) if project.genres else 'Unknown'}
    Worldview: {wv_desc}
    """

    current_data = {
        "name": request.current_name,
        "age": request.age,
        "role": request.role,
        "visual_keywords": request.visual_keywords,
        "personality": request.personality
    }

    try:
        result = ai_service.get_character_suggestion(
            suggestion_type=request.type,
            project_context=project_context,
            current_data=current_data,
            language=request.language or project.language or "en"
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@router.post("/analyze", response_model=Any)
def analyze_character(
    *,
    request: CharacterAnalysisRequest,
    session: Session = Depends(deps.get_session),
    current_user_id: str = Depends(deps.get_current_user_id),
):
    """
    Analyze character concept to suggest Role and Lore.
    """
    project = session.get(Project, request.project_id)
    if not project:
         raise HTTPException(status_code=404, detail="Project not found")

    # Deduct Credits (Cost: 1)
    billing_service.deduct_credits(session, project.workspace_id, UUID(current_user_id), "analyze_character_concept")

    # Construct Context
    wv_desc = ""
    if project.worldview:
        if isinstance(project.worldview, dict):
            wv_desc = project.worldview.get("content") or project.worldview.get("description") or ""
        else:
             wv_desc = str(project.worldview)

    project_context = f"""
    Title: {project.title}
    Genre: {", ".join([g.name for g in project.genres]) if project.genres else 'Unknown'}
    Worldview: {wv_desc}
    """

    try:
        result = ai_service.analyze_character_concept(
            project_context=project_context,
            name=request.name,
            age=request.age,
            visual_keywords=request.visual_keywords,
            personality=request.personality,
            language=request.language or project.language or "en"
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/suggestions/batch", response_model=Any)
def generate_batch_suggestions(
    *,
    request: BatchSuggestionRequest,
    session: Session = Depends(deps.get_session),
    current_user_id: str = Depends(deps.get_current_user_id),
):
    """
    Generate and store 10 character suggestions.
    """
    project = session.get(Project, request.project_id)
    if not project:
         raise HTTPException(status_code=404, detail="Project not found")

    # Deduct Credits (Cost: 5 for batch)
    billing_service.deduct_credits(session, project.workspace_id, UUID(current_user_id), "batch_character_suggestions")

    # Context
    wv_desc = ""
    if project.worldview:
        if isinstance(project.worldview, dict):
            wv_desc = project.worldview.get("content") or project.worldview.get("description") or ""
        else:
             wv_desc = str(project.worldview)
    
    project_context = f"""
    Title: {project.title}
    Genre: {", ".join([g.name for g in project.genres]) if project.genres else 'Unknown'}
    Worldview: {wv_desc}
    """

    try:
        from app.models import CharacterSuggestion
        
        result = ai_service.generate_character_batch_suggestions(
            project_context=project_context,
            count=10,
            language=request.language or project.language or "en"
        )
        
        suggestions_data = result.get("suggestions", [])
        saved_suggestions = []
        
        for item in suggestions_data:
            suggestion = CharacterSuggestion(
                project_id=project.id,
                name=item.get("name"),
                age=str(item.get("age")),
                visual_keywords=item.get("visual_keywords", []),
                personality=item.get("personality"),
                personality_tags=item.get("personality_tags", []),
                theme_color=item.get("theme_color"),
                bio=item.get("bio"),
                role=item.get("role"),
                recommended_role=item.get("recommended_role"),
                stats=item.get("stats"),
                is_used=False
            )
            session.add(suggestion)
            saved_suggestions.append(suggestion)
            
        session.commit()
        
        return saved_suggestions
        
    except Exception as e:
        logger.error("Batch gen failed", project_id=str(request.project_id), error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/suggestions/{project_id}", response_model=List[Any])
def list_suggestions(
    *,
    session: Session = Depends(deps.get_session),
    project_id: UUID,
    current_user_id: str = Depends(deps.get_current_user_id),
):
    """
    List unused suggestions for a project.
    """
    from app.models import CharacterSuggestion
    statement = select(CharacterSuggestion).where(
        CharacterSuggestion.project_id == project_id,
        CharacterSuggestion.is_used == False,
        CharacterSuggestion.deleted_at == None
    ).order_by(CharacterSuggestion.created_at.desc())
    
    suggestions = session.exec(statement).all()
    return suggestions

@router.post("/suggestions/{suggestion_id}/use", response_model=Any)
def use_suggestion(
    *,
    session: Session = Depends(deps.get_session),
    suggestion_id: UUID,
    current_user_id: str = Depends(deps.get_current_user_id),
):
    """
    Mark a suggestion as used.
    """
    from app.models import CharacterSuggestion
    suggestion = session.get(CharacterSuggestion, suggestion_id)
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion not found")
        
    suggestion.is_used = True
    session.add(suggestion)
    session.commit()
    return {"status": "success"}

@router.post("/suggestions/{suggestion_id}/reject", response_model=Any)
def reject_suggestion(
    *,
    session: Session = Depends(deps.get_session),
    suggestion_id: UUID,
    current_user_id: str = Depends(deps.get_current_user_id),
):
    """
    Soft delete a suggestion.
    """
    from app.models import CharacterSuggestion
    suggestion = session.get(CharacterSuggestion, suggestion_id)
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion not found")
        
    suggestion.deleted_at = datetime.utcnow()
    session.add(suggestion)
    session.commit()
    return {"status": "rejected"}

@router.post("/suggestions/{suggestion_id}/promote", response_model=Any)
def promote_suggestion(
    *,
    session: Session = Depends(deps.get_session),
    suggestion_id: UUID,
    current_user_id: str = Depends(deps.get_current_user_id),
    background_tasks: BackgroundTasks
):
    """
    Promote a suggestion to a real character and start image generation.
    Uses optimistic locking to prevent duplicate casting.
    """
    from app.models import CharacterSuggestion
    
    # 1. Get Suggestion with lock check
    suggestion = session.get(CharacterSuggestion, suggestion_id)
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    
    # 2. Check if already used (Optimistic Lock)
    if suggestion.is_used:
        raise HTTPException(
            status_code=409, 
            detail="ALREADY_CAST",
            headers={"X-Error-Code": "ALREADY_CAST"}
        )
    
    # 3. Check if deleted
    if suggestion.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Suggestion has been rejected")
    
    # 4. Immediately mark as used to prevent race conditions
    suggestion.is_used = True
    session.add(suggestion)
    session.flush()  # Flush to ensure the lock is acquired before proceeding
        
    # 5. Create Character
    character = Character(
        name=suggestion.name,
        project_id=suggestion.project_id,
        appearance_tags=suggestion.visual_keywords,
        default_mood=suggestion.personality_tags or ["Neutral"],
        consistency_seed=0,
        profile_image_url=None,
        description=suggestion.bio or f"Role: {suggestion.role}\nPersonality: {suggestion.personality}",
        profile={
            "age": suggestion.age,
            "role": suggestion.role,
            "personality": suggestion.personality,
            "stats": suggestion.stats
        },
        sheet_status="pending"
    )
    
    # Generate Embedding
    moods = character.default_mood or []
    tags = character.appearance_tags or []
    mood_str = " ".join(moods)
    combined_text = f"{character.name} {mood_str} {' '.join(tags)}"
    try:
        character.embedding = ai_service.get_embedding(combined_text)
    except Exception as e:
        logger.error("Embedding failed", character_name=character.name, error=str(e))

    session.add(character)
    
    session.commit()
    session.refresh(character)
    
    # 6. Trigger Image Generation
    background_tasks.add_task(generate_character_image_task, character.id, character.description)
    
    return character
