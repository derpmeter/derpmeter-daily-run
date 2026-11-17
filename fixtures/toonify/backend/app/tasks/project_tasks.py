"""
Project Background Tasks
Cover image generation and character suggestion generation tasks.
"""
from typing import List
from uuid import UUID
from sqlmodel import Session

from app.core.logging import get_logger
from app.db.engine import engine
from app.models import Project, Asset, CharacterSuggestion
from app.services.ai import ai_service
from app.services.storage import storage

logger = get_logger(__name__)


def generate_project_cover_task(
    project_id: str, 
    title: str, 
    genre_name: str, 
    worldview_content: str, 
    style: str, 
    tones: List[str] = None, 
    style_ref_url: str = None, 
    character_image_urls: List[str] = None, 
    language: str = "en"
):
    """
    Background task to generate and update project cover image.
    """
    try:
        logger.info("Starting background cover generation", project_id=project_id)
        # Generate Image
        img_bytes = ai_service.generate_project_cover_image(title, genre_name, worldview_content, style, tones, style_ref_url, character_image_urls, language=language)
        
        # Upload to Storage
        if img_bytes:
            url = storage.upload_image(img_bytes, schema="projects", identifier=project_id) # uuid string passed in
            logger.info("Cover image uploaded", project_id=project_id, url=url)
            
            # Update Project in DB
            with Session(engine) as session:
                p_uuid = UUID(project_id)
                project = session.get(Project, p_uuid)
                if project:
                    # Create Asset
                    asset = Asset(
                        workspace_id=project.workspace_id,
                        user_id=project.owner_id,
                        filename=f"cover_{project_id}.png",
                        file_url=url,
                        file_type="image/png"
                    )
                    session.add(asset)
                    session.commit()
                    session.refresh(asset)

                    # Update Project
                    project.thumbnail_asset_id = asset.id
                    project.cover_image_asset_id = asset.id
                    project.cover_image_status = "completed"
                    session.add(project)
                    session.commit()
                    logger.info("Project thumbnail updated", project_id=project_id)
    except Exception as e:
        logger.error("Background task error", project_id=project_id, error=str(e))
        # Update status to failed
        with Session(engine) as session:
            try:
                p_uuid = UUID(project_id)
                project = session.get(Project, p_uuid)
                if project:
                    project.cover_image_status = "failed"
                    session.add(project)
                    session.commit()
            except Exception as db_e:
                logger.error("Failed to update error status", project_id=project_id, error=str(db_e))


def generate_suggestions_bg_task(project_id: str, context: str, language: str):
    """
    Background task to generate initial character suggestions.
    """
    try:
        with Session(engine) as session:
            # Generate - 프로젝트 초기 생성이므로 주인공 포함
            result = ai_service.generate_character_batch_suggestions(
                context, count=10, language=language, include_protagonist=True
            )
            items = result.get('suggestions', [])
            
            p_uuid = UUID(project_id)
            
            for item in items:
                s = CharacterSuggestion(
                    project_id=p_uuid,
                    name=item.get("name"),
                    age=str(item.get("age")),
                    visual_keywords=item.get("visual_keywords", []),
                    personality=item.get("personality", ""),
                    personality_tags=item.get("personality_tags", []),
                    theme_color=item.get("theme_color"),
                    bio=item.get("bio"),
                    role=item.get("role"),
                    recommended_role=item.get("recommended_role"),
                    stats=item.get("stats"),
                    is_used=False
                )
                session.add(s)
            
            # Update project status
            project = session.get(Project, p_uuid)
            if project:
                project.suggestions_status = "completed"
                session.add(project)
            
            session.commit()
            logger.info("Async suggestions generated", project_id=project_id, count=len(items))
            
    except Exception as e:
        logger.error("Async suggestion error", project_id=project_id, error=str(e))
        try:
            with Session(engine) as session:
                project = session.get(Project, UUID(project_id))
                if project:
                    project.suggestions_status = "failed"
                    session.add(project)
                    session.commit()
        except:
            pass
