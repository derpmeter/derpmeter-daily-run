from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header, BackgroundTasks, Response
from sqlmodel import Session, select
from datetime import datetime
from uuid import UUID
import json

from app.api import deps
from app.core.config import settings
from app.core.logging import get_logger
from app.models import Episode, Project, WorkspaceMember, StoryCut, Character, EpisodeSuggestion
from app.services.ai import ai_service
from app.services.storage import storage
from app.schemas import (
    EpisodeCreate,
    EpisodeUpdate,
    EpisodeOut,
    EpisodeSuggestionOut,
    GenerateCutsRequest,
    GenerateImageRequest,
    BatchRegenerateRequest,
)
from app.tasks.episode_tasks import (
    generate_episode_cuts_task,
    generate_cut_task,
    generate_episode_images_sequentially,
    regenerate_selected_cuts_task,
)

logger = get_logger(__name__)

router = APIRouter()


@router.get("", response_model=List[EpisodeOut])
def list_episodes(
    *,
    session: Session = Depends(deps.get_session),
    project_id: UUID,
    current_user_id: str = Depends(deps.get_current_user_id),
) -> Any:
    """
    List episodes for a specific project.
    """
    # Verify access to project
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    statement = select(Episode).where(Episode.project_id == project_id).where(Episode.deleted_at == None).order_by(Episode.episode_order)
    episodes = session.exec(statement).all()
    
    # Fetch first cut image for each episode
    result = []
    for ep in episodes:
        first_cut = session.exec(
            select(StoryCut)
            .where(StoryCut.episode_id == ep.id)
            .where(StoryCut.image_path != None)
            .order_by(StoryCut.cut_order)
            .limit(1)
        ).first()
        
        # Build first_cut_image URL
        first_cut_image_url = None
        if first_cut and first_cut.image_path:
            path = first_cut.image_path
            if path.startswith("http://") or path.startswith("https://"):
                first_cut_image_url = path
            elif settings.STORAGE_HOST:
                first_cut_image_url = f"{settings.STORAGE_HOST}/{path}"
            else:
                first_cut_image_url = path
        
        ep_dict = {
            "id": ep.id,
            "title": ep.title,
            "episode_order": ep.episode_order,
            "project_id": ep.project_id,
            "story_summary": ep.story_summary or "",
            "status": ep.status,
            "created_at": ep.created_at,
            "background_info": ep.background_info,
            "character_outfits": ep.character_outfits,
            "first_cut_image": first_cut_image_url
        }
        result.append(ep_dict)
    
    return result


@router.post("", response_model=EpisodeOut)
def create_episode(
    *,
    session: Session = Depends(deps.get_session),
    episode_in: EpisodeCreate,
    current_user_id: str = Depends(deps.get_current_user_id),
) -> Any:
    """
    Create a new episode in a project.
    """
    episode = Episode(
        title=episode_in.title,
        project_id=episode_in.project_id,
        episode_order=episode_in.episode_order,
        story_summary=episode_in.story_summary
    )
    session.add(episode)
    session.commit()
    session.refresh(episode)
    
    return episode


@router.get("/{episode_id}", response_model=EpisodeOut)
def get_episode(
    *,
    session: Session = Depends(deps.get_session),
    episode_id: UUID,
    current_user_id: str = Depends(deps.get_current_user_id),
) -> Any:
    """
    Get episode by ID.
    """
    episode = session.get(Episode, episode_id)
    if not episode or episode.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Episode not found")
    return episode


@router.put("/{episode_id}", response_model=EpisodeOut)
def update_episode(
    *,
    session: Session = Depends(deps.get_session),
    episode_id: UUID,
    episode_in: EpisodeUpdate,
    current_user_id: str = Depends(deps.get_current_user_id),
) -> Any:
    """
    Update an episode.
    """
    episode = session.get(Episode, episode_id)
    if not episode or episode.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Episode not found")
    
    if episode_in.title is not None:
        episode.title = episode_in.title
    if episode_in.story_summary is not None:
        episode.story_summary = episode_in.story_summary
    if episode_in.background_info is not None:
        episode.background_info = episode_in.background_info
    if episode_in.character_outfits is not None:
        # 레퍼런스 보드가 이미 생성되었으면 의상 변경 불가
        if episode.character_reference_board_urls:
            raise HTTPException(
                status_code=400, 
                detail="Cannot change character outfits after reference board has been generated. Create a new episode instead."
            )
        episode.character_outfits = episode_in.character_outfits
        
    session.add(episode)
    session.commit()
    session.refresh(episode)
    return episode


@router.delete("/{episode_id}")
def delete_episode(
    *,
    session: Session = Depends(deps.get_session),
    episode_id: UUID,
    current_user_id: str = Depends(deps.get_current_user_id),
) -> Any:
    """
    Delete an episode.
    """
    episode = session.get(Episode, episode_id)
    if not episode or episode.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Episode not found")
    
    # Soft delete: set deleted_at
    episode.deleted_at = datetime.utcnow()
    session.add(episode)
    session.commit()
    
    return Response(status_code=204)

# Episode Suggestions CRUD
@router.get("/suggestions/{project_id}", response_model=List[EpisodeSuggestionOut])
def list_episode_suggestions(
    *,
    project_id: UUID,
    session: Session = Depends(deps.get_session),
    current_user_id: str = Depends(deps.get_current_user_id),
):
    """List all episode suggestions for a project."""
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    statement = select(EpisodeSuggestion).where(
        EpisodeSuggestion.project_id == project_id
    ).where(
        EpisodeSuggestion.deleted_at == None
    ).order_by(EpisodeSuggestion.created_at.desc())
    
    return session.exec(statement).all()

@router.delete("/suggestions/{suggestion_id}")
def delete_episode_suggestion(
    *,
    suggestion_id: UUID,
    session: Session = Depends(deps.get_session),
    current_user_id: str = Depends(deps.get_current_user_id),
):
    """Soft delete an episode suggestion."""
    suggestion = session.get(EpisodeSuggestion, suggestion_id)
    if not suggestion or suggestion.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    
    suggestion.deleted_at = datetime.utcnow()
    session.add(suggestion)
    session.commit()
    
    return Response(status_code=204)

@router.post("/generate-options")
def generate_episode_options(
    *,
    project_id: UUID,
    user_instruction: str = None,
    session: Session = Depends(deps.get_session),
    current_user_id: str = Depends(deps.get_current_user_id),
    accept_language: str = Header("en", alias="Accept-Language")
):
    """
    Generate 3 episode ideas based on project context and save to DB.
    """
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Fetch recent episodes for context
    statement = select(Episode).where(Episode.project_id == project_id).where(Episode.deleted_at == None).order_by(Episode.episode_order.desc()).limit(3)
    episodes = session.exec(statement).all()
    episodes.reverse()
    recent_summaries = "\n".join([f"Ep {ep.episode_order} - {ep.title}: {ep.story_summary}" for ep in episodes])

    worldview_str = json.dumps(project.worldview) if project.worldview else ""

    result = ai_service.generate_episode_ideas(
        project_title=project.title,
        worldview=worldview_str,
        recent_episodes=recent_summaries,
        language=project.language or accept_language.split(',')[0].strip()[:2],
        user_instruction=user_instruction
    )
    
    # Save generated ideas to DB
    saved_suggestions = []
    if result and "options" in result:
        for opt in result["options"]:
            suggestion = EpisodeSuggestion(
                project_id=project_id,
                title=opt.get("title", ""),
                summary=opt.get("summary", ""),
                reason=opt.get("reason"),
                user_instruction=user_instruction
            )
            session.add(suggestion)
            saved_suggestions.append(suggestion)
        session.commit()
        
        # Refresh to get IDs and created_at
        for s in saved_suggestions:
            session.refresh(s)
        
        # Return with IDs
        result["options"] = [
            {
                "id": str(s.id),
                "title": s.title,
                "summary": s.summary,
                "reason": s.reason,
                "created_at": s.created_at.isoformat()
            }
            for s in saved_suggestions
        ]
    
    return result

@router.post("/generate-prologue-options")
def generate_prologue_options(
    *,
    project_id: UUID,
    user_instruction: str = None,
    session: Session = Depends(deps.get_session),
    current_user_id: str = Depends(deps.get_current_user_id),
    accept_language: str = Header("en", alias="Accept-Language")
):
    """
    Generate 3 prologue episode ideas based on project context and save to DB.
    Prologue-specific prompts focus on:
    - World introduction
    - Tone/mood setting
    - Character introduction
    - Hook creation
    """
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Fetch available characters for context
    from app.models import Character
    statement = select(Character).where(
        Character.project_id == project_id
    ).where(Character.deleted_at == None)
    characters = session.exec(statement).all()
    
    characters_str = ""
    if characters:
        char_list = []
        for char in characters:
            char_info = f"- {char.name}"
            # role is in profile dict, not a direct attribute
            role = char.profile.get("role") if char.profile else None
            if role:
                char_info += f" ({role})"
            if char.description:
                char_info += f": {char.description[:100]}..."
            char_list.append(char_info)
        characters_str = "\n".join(char_list)

    worldview_str = json.dumps(project.worldview) if project.worldview else ""

    result = ai_service.generate_prologue_ideas(
        project_title=project.title,
        worldview=worldview_str,
        characters=characters_str,
        language=project.language or accept_language.split(',')[0].strip()[:2],
        user_instruction=user_instruction
    )
    
    # Save generated ideas to DB
    saved_suggestions = []
    if result and "options" in result:
        for opt in result["options"]:
            suggestion = EpisodeSuggestion(
                project_id=project_id,
                title=opt.get("title", ""),
                summary=opt.get("summary", ""),
                reason=opt.get("reason"),
                user_instruction=user_instruction
            )
            session.add(suggestion)
            saved_suggestions.append(suggestion)
        session.commit()
        
        # Refresh to get IDs and created_at
        for s in saved_suggestions:
            session.refresh(s)
        
        # Return with IDs and prologue_type
        result["options"] = [
            {
                "id": str(s.id),
                "title": s.title,
                "summary": s.summary,
                "reason": s.reason,
                "prologue_type": result["options"][i].get("prologue_type") if i < len(result["options"]) else None,
                "created_at": s.created_at.isoformat()
            }
            for i, s in enumerate(saved_suggestions)
        ]
    
    return result

@router.post("/generate-cuts")
def generate_episode_cuts(
    *,
    request: GenerateCutsRequest,
    background_tasks: BackgroundTasks,
    session: Session = Depends(deps.get_session),
    current_user_id: str = Depends(deps.get_current_user_id),
    accept_language: str = Header("en", alias="Accept-Language")
):
    """
    Generate and save initial cuts (script, dialogue, panel type) asynchronously.
    """
    style = request.style
    if not style:
        project = session.get(Project, request.project_id)
        style = project.style_preset if project else "Webtoon"

    # 1. Create Episode
    # Determine order: max order + 1
    statement = select(Episode).where(Episode.project_id == request.project_id).where(Episode.deleted_at == None).order_by(Episode.episode_order.desc()).limit(1)
    last_ep = session.exec(statement).first()
    new_order = (last_ep.episode_order + 1) if last_ep else 1

    episode = Episode(
        title=request.episode_title,
        story_summary=request.episode_summary,
        project_id=request.project_id,
        episode_order=new_order,
        status="generating"
    )
    session.add(episode)
    session.commit()
    session.refresh(episode)

    # Start Background Task
    background_tasks.add_task(
        generate_episode_cuts_task,
        episode_id=episode.id,
        project_id=request.project_id,
        episode_title=request.episode_title,
        episode_summary=request.episode_summary,
        style=style,
        num_cuts=request.num_cuts,
        language=project.language if project else "en"
    )

    return {
        "episode_id": episode.id,
        "title": episode.title,
        "status": "generating",
        "cuts_count": 0,
        "cuts": []
    }

@router.post("/{episode_id}/cuts/{cut_id}/generate-image")
def generate_cut_image(
    *,
    episode_id: UUID,
    cut_id: UUID,
    request: GenerateImageRequest,
    background_tasks: BackgroundTasks,
    session: Session = Depends(deps.get_session),
    current_user_id: str = Depends(deps.get_current_user_id),
    accept_language: str = Header("en", alias="Accept-Language")
):
    """
    Start background image generation for a specific cut.
    """
    cut = session.get(StoryCut, cut_id)
    if not cut:
        raise HTTPException(status_code=404, detail="Cut not found")
        
    episode = session.get(Episode, cut.episode_id)
    if not episode or episode.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Episode not found")

    # Pass everything needed to background task
    prompt_override = request.prompt_override
    use_previous_context = request.use_previous_context
    
    # Update status to generating
    cut.status = "generating"
    session.add(cut)
    session.commit()
    
    # We need to fetch project language.
    episode = session.get(Episode, cut.episode_id)
    project = session.get(Project, episode.project_id)
    lang = project.language if project else "en"

    background_tasks.add_task(generate_cut_task, cut_id, prompt_override, lang, use_previous_context)
    
    return {"message": "Generation started", "cut_id": cut_id}


@router.post("/{episode_id}/generate-images")
def generate_episode_images(
    *,
    session: Session = Depends(deps.get_session),
    episode_id: UUID,
    background_tasks: BackgroundTasks,
    current_user_id: str = Depends(deps.get_current_user_id),
) -> Any:
    """
    Trigger sequential image generation for all cuts in the episode (Skip existing).
    """
    episode = session.get(Episode, episode_id)
    if not episode:
        raise HTTPException(status_code=404, detail="Episode not found")
        
    # Set status to generating?
    episode.status = "generating"
    session.add(episode)
    session.commit()
    
    background_tasks.add_task(generate_episode_images_sequentially, episode_id)
    
    return {"message": "Sequential generation started"}


@router.post("/{episode_id}/regenerate-selected")
def regenerate_selected_cuts(
    *,
    session: Session = Depends(deps.get_session),
    episode_id: UUID,
    request: BatchRegenerateRequest,
    background_tasks: BackgroundTasks,
    current_user_id: str = Depends(deps.get_current_user_id),
) -> Any:
    """
    Regenerate selected cuts in an episode.
    """
    episode = session.get(Episode, episode_id)
    if not episode or episode.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Episode not found")
    
    # Validate cut IDs belong to this episode
    valid_cut_ids = []
    for cut_id in request.cut_ids:
        cut = session.get(StoryCut, cut_id)
        if cut and cut.episode_id == episode_id:
            valid_cut_ids.append(cut_id)
            # Set cut status to generating
            cut.status = "generating"
            session.add(cut)
    
    if not valid_cut_ids:
        raise HTTPException(status_code=400, detail="No valid cuts to regenerate")
    
    # Get project language
    project = session.get(Project, episode.project_id)
    language = project.language if project else "en"
    
    session.commit()
    
    # Start background task
    background_tasks.add_task(regenerate_selected_cuts_task, episode_id, valid_cut_ids, language)
    
    return {"message": f"Regenerating {len(valid_cut_ids)} cuts", "cut_ids": valid_cut_ids}

@router.post("/{episode_id}/export")
def export_episode(
    *,
    session: Session = Depends(deps.get_session),
    episode_id: UUID,
    format: str = "webtoon",
    current_user_id: str = Depends(deps.get_current_user_id),
):
    """
    Export episode as a stitched vertical image (Webtoon strip) or a ZIP of individual images.
    """
    from fastapi.responses import StreamingResponse
    from PIL import Image
    import io
    import base64
    import zipfile
    import requests
    import urllib.parse
    from app.core.config import settings
    
    # Fetch Episode & Cuts
    episode = session.get(Episode, episode_id)
    if not episode or episode.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Episode not found")
        
    statement = select(StoryCut).where(StoryCut.episode_id == episode_id).order_by(StoryCut.cut_order)
    cuts = session.exec(statement).all()
    
    if not cuts:
        raise HTTPException(status_code=400, detail="No cuts to export")

    # Helper to get image bytes
    def get_image_bytes(image_path: str) -> bytes | None:
        if not image_path:
            return None
        try:
            if image_path.startswith("data:image"):
                header, encoded = image_path.split(",", 1)
                return base64.b64decode(encoded)
            
            url = image_path
            if not url.startswith("http"):
                 # Prepend STORAGE_HOST if relative
                 url = f"{settings.STORAGE_HOST}/{image_path}"
                 
            # Fetch from URL (S3/MinIO)
            # Use Verify=False if using self-signed or internal minio without valid certs might be needed, but sticking to standard
            resp = requests.get(url, timeout=10)
            if resp.status_code == 200:
                return resp.content
            return None
        except Exception as e:
            logger.warning("Failed to fetch image", error=str(e))
            return None

    if format == "zip":
        logger.info("ZIP Export: Starting ZIP creation", episode_title=episode.title, cuts_count=len(cuts))
        
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            file_count = 0
            for cut in cuts:
                logger.debug("ZIP Export: Processing cut", cut_order=cut.cut_order)
                if not cut.image_path:
                    logger.debug("ZIP Export: Skipping cut - no image_path", cut_order=cut.cut_order)
                    continue
                    
                img_data = get_image_bytes(cut.image_path)
                if img_data:
                    # Naming: EpisodeTitle_CutNumber.png
                    # Sanitize title
                    safe_title = "".join(c for c in episode.title if c.isalnum() or c in (' ', '_', '-')).strip().replace(" ", "_")
                    filename = f"{safe_title}_{cut.cut_order:02d}.png"
                    zf.writestr(filename, img_data)
                    file_count += 1
                    logger.debug("ZIP Export: Added file", filename=filename, size=len(img_data))
                else:
                    logger.warning("ZIP Export: Failed to get image data", cut_order=cut.cut_order)
            
        logger.info("ZIP Export: Completed", file_count=file_count)
        
        if file_count == 0:
             raise HTTPException(status_code=400, detail="No valid images found to zip")
        
        # Ensure ZIP is fully written
        zip_buffer.seek(0)
        zip_content = zip_buffer.getvalue()
        logger.debug("ZIP Export: Final ZIP size", size=len(zip_content))
        
        zip_filename = f"{episode.title.replace(' ', '_')}_cuts.zip"
        encoded_zip_filename = urllib.parse.quote(zip_filename)
        
        # Use Response instead of StreamingResponse to ensure complete ZIP is sent
        from fastapi import Response
        return Response(
            content=zip_content,
            media_type="application/zip",
            headers={"Content-Disposition": f"attachment; filename*=UTF-8''{encoded_zip_filename}"}
        )

    # ... Webtoon Strip Logic ...
    # All images will be resized to match max_width for consistent strip
    
    raw_images = []
    max_width = 0
    
    # First pass: Load images and find max width
    for cut in cuts:
        img_data = get_image_bytes(cut.image_path)
        if img_data:
            try:
                img = Image.open(io.BytesIO(img_data))
                img.load()
                raw_images.append(img)
                max_width = max(max_width, img.width)
            except Exception as e:
                logger.warning("Failed to process image for cut", cut_id=str(cut.id), error=str(e))
                
    if not raw_images:
         raise HTTPException(status_code=400, detail="No valid images found in cuts")

    # Second pass: Resize all images to max_width while preserving aspect ratio
    resized_images = []
    total_height = 0
    
    for img in raw_images:
        if img.width != max_width:
            # Calculate new height preserving aspect ratio
            new_height = int(img.height * (max_width / img.width))
            img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
        resized_images.append(img)
        total_height += img.height

    # Create Canvas
    spacing = 50
    final_height = total_height + (len(resized_images) - 1) * spacing
    
    canvas = Image.new('RGB', (max_width, final_height), (255, 255, 255))
    
    y_offset = 0
    for img in resized_images:
        canvas.paste(img, (0, y_offset))
        y_offset += img.height + spacing
        
    # Output
    img_byte_arr = io.BytesIO()
    canvas.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)
    
    filename = f"{episode.title.replace(' ', '_')}_export.png"
    encoded_filename = urllib.parse.quote(filename)
    
    return StreamingResponse(
        img_byte_arr, 
        media_type="image/png",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}"}
    )
