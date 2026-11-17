from app.services.billing import billing_service
"""
Character Background Tasks
Character sheet generation and related image processing tasks.
"""
from uuid import UUID
from sqlmodel import Session

from app.core.logging import get_logger
from app.db.engine import engine
from app.models import Character, Project, Asset
from app.services.ai import ai_service
from app.services.storage import storage

logger = get_logger(__name__)


def generate_character_image_task(character_id: UUID, prompt: str):
    """
    Background task to generate character sheet and save it.
    """
    try:
        logger.info("Starting background character generation", character_id=str(character_id))
        
        with Session(engine) as session:
            character = session.get(Character, character_id)
            if not character:
                logger.warning("Character not found via background task", character_id=str(character_id))
                return
            
            # Update status to processing
            character.sheet_status = "processing"
            session.add(character)
            session.commit()
            
            project = session.get(Project, character.project_id)
            if not project:
                logger.warning("Project for character not found", character_id=str(character_id))
                return

            try:
                # Using the specialized character sheet generation
                # Fallback to name if no description or tags
                desc_for_img = character.description or ", ".join(character.appearance_tags) or character.name
                
                # Retrieve Style Reference
                style_ref = project.style_reference_url
                
                img_bytes = ai_service.generate_character_sheet(
                    name=character.name, 
                    description=desc_for_img, 
                    style=project.style_preset,
                    style_ref_url=style_ref
                )
                
                if img_bytes:
                    url = storage.upload_image(img_bytes, schema="characters", identifier=str(character_id))
                    
                    # Create Asset record
                    asset = Asset(
                        filename=f"character_{character.id}_sheet.png",
                        file_url=url,
                        file_type="image/png",
                        workspace_id=project.workspace_id
                    )
                    session.add(asset)
                    session.flush() # Get asset.id
                    
                    character.profile_image_asset_id = asset.id
                    character.sheet_status = "completed"
                    session.add(character)
                    session.commit()
                    logger.info("Character image updated", character_id=str(character_id), url=url)
                else:
                    logger.warning("No image bytes returned for character generation", character_id=str(character_id))
                    character.sheet_status = "failed"
                    session.add(character)
                    session.commit()
                    
            except Exception as e:
                logger.error("Generation logic error", character_id=str(character_id), error=str(e))
                character.sheet_status = "failed"
                session.add(character)
                session.commit()
                billing_service.refund_last(session, project.workspace_id, "generate_character_sheet")
                
    except Exception as e:
        logger.error("Background character gen task error", character_id=str(character_id), error=str(e))
