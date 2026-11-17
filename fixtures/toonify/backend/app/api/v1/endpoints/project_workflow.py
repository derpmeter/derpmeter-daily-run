from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlmodel import Session, select
from app.api import deps
from app.models.models import Project, ProjectTemplate, User, Character, StoryCut, Episode, WorkspaceMember, Asset
from app.services.ai import ai_service
from app.services.billing import billing_service
from app.services.storage import storage
import uuid
import base64
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter()

# --- Request Models ---

class StyleUpdateRequest(BaseModel):
    art_style: str

class CastingInitRequest(BaseModel):
    initial_character_name: str = "New Character"

class TextAugmentRequest(BaseModel):
    name: str
    tags: List[str]
    mood: str
    style: str

class GenerateSheetRequest(BaseModel):
    character_id: uuid.UUID
    name: str
    description: str
    style: str

class GenerateIdeaRequest(BaseModel):
    project_id: uuid.UUID

class CreateEpisodeRequest(BaseModel):
    project_id: uuid.UUID
    title: str
    summary: str
    num_cuts: int = 6

class GenerateCutImageRequest(BaseModel):
    cut_id: uuid.UUID


# --- Background Tasks ---

async def bg_generate_cover(project_id: uuid.UUID, style: str, session_factory):
    from app.api.deps import engine
    from sqlmodel import Session
    
    with Session(engine) as session:
        project = session.get(Project, project_id)
        if not project:
            return

        try:
            print(f"Starting Cover Generation for {project_id}...")
            worldview_text = str(project.worldview) if project.worldview else ""
            
            image_bytes = ai_service.generate_project_cover_image(
                title=project.title,
                genre=project.genre.name if project.genre else "General",
                worldview=worldview_text,
                style=style,
                language=project.language or "en"
            )
            
            try:
                data_url = storage.upload_image(image_bytes, schema="projects", identifier=str(project_id))
            except Exception as s3_e:
                print(f"Storage upload failed, using Data URL fallback: {s3_e}")
                b64_img = base64.b64encode(image_bytes).decode('utf-8')
                data_url = f"data:image/png;base64,{b64_img}"

            # Create Asset
            asset = Asset(
                workspace_id=project.workspace_id,
                user_id=project.owner_id,
                filename=f"cover_{project_id}.png",
                file_url=data_url,
                file_type="image/png"
            )
            session.add(asset)
            session.flush()

            project.cover_image_asset_id = asset.id
            project.cover_image_status = "completed"
            session.add(project)
            session.commit()
            print(f"Cover Generation Completed for {project_id}")
            
        except Exception as e:
            print(f"Cover Generation Failed: {e}")
            project.cover_image_status = "failed"
            session.add(project)
            session.commit()

async def bg_generate_character_sheet(character_id: uuid.UUID, name: str, desc: str, style: str):
    from app.api.deps import engine
    from sqlmodel import Session
    
    with Session(engine) as session:
        char = session.get(Character, character_id)
        if not char or char.deleted_at is not None:
            return
            
        try:
            print(f"Starting Character Sheet for {character_id}...")
            
            image_bytes = ai_service.generate_character_sheet(name, desc, style)
            
            try:
                data_url = storage.upload_image(image_bytes, schema="characters", identifier=str(character_id))
            except Exception as s3_e:
                 print(f"Storage upload failed, using Data URL fallback: {s3_e}")
                 b64_img = base64.b64encode(image_bytes).decode('utf-8')
                 data_url = f"data:image/png;base64,{b64_img}"

            project = session.get(Project, char.project_id)
            if project:
                asset = Asset(
                    workspace_id=project.workspace_id,
                    user_id=project.owner_id,
                    filename=f"character_{character_id}_sheet.png",
                    file_url=data_url,
                    file_type="image/png"
                )
                session.add(asset)
                session.flush()
                char.profile_image_asset_id = asset.id # Link asset

            embedding_text = f"Name: {name}\nStyle: {style}\nDescription: {desc}"
            embedding_vector = ai_service.get_embedding(embedding_text)
            
            char.sheet_status = "completed"
            char.embedding = embedding_vector
            session.add(char)
            session.commit()
            print(f"Sheet & Embedding Generation Completed for {character_id}")

        except Exception as e:
             print(f"Sheet Generation Failed: {e}")
             char.sheet_status = "failed"
             session.add(char)
             session.commit()

async def bg_generate_cut_image(cut_id: uuid.UUID):
    from app.api.deps import engine
    from sqlmodel import Session
    
    with Session(engine) as session:
        cut = session.get(StoryCut, cut_id)
        if not cut:
            return
            
        try:
            print(f"Starting Cut Image for {cut_id}...")
            episode = session.get(Episode, cut.episode_id)
            project = session.get(Project, episode.project_id)
            
            prompt = f"{cut.script}, Style: {project.art_style or project.style_preset}"
            
            image_bytes = ai_service.generate_image(prompt, width=1024, height=1024, language=project.language or "en") 
            
            try:
                data_url = storage.upload_image(image_bytes, schema="cuts", identifier=str(cut_id))
            except Exception as s3_e:
                print(f"Storage upload failed, using Data URL fallback: {s3_e}")
                b64_img = base64.b64encode(image_bytes).decode('utf-8')
                data_url = f"data:image/png;base64,{b64_img}"

            asset = Asset(
                workspace_id=project.workspace_id,
                user_id=project.owner_id,
                filename=f"cut_{cut_id}.png",
                file_url=data_url,
                file_type="image/png"
            )
            session.add(asset)
            session.flush()

            cut.image_asset_id = asset.id
            cut.image_path = data_url # Keep for compatibility for now
            
            if not cut.embedding and cut.script:
                 cut.embedding = ai_service.get_embedding(cut.script)

            session.add(cut)
            session.commit()
            print(f"Cut Image Completed for {cut_id}")
            
        except Exception as e:
             print(f"Cut Image Failed: {e}")


# --- Endpoints ---

@router.post("/projects/{project_id}/art-style")
def set_project_art_style(
    project_id: uuid.UUID, 
    request: StyleUpdateRequest,
    background_tasks: BackgroundTasks,
    session: Session = Depends(deps.get_session),
    current_user_id: str = Depends(deps.get_current_user_id),
):
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Deduct credits (Cost: 15 for cover gen)
    billing_service.deduct_credits(session, project.workspace_id, uuid.UUID(current_user_id), "generate_project_cover_image")
        
    # Update style
    project.art_style = request.art_style
    project.cover_image_status = "processing"
    session.add(project)
    session.commit()
    session.refresh(project)
    
    # Trigger Async Task
    background_tasks.add_task(bg_generate_cover, project.id, request.art_style, None)
    
    return project

@router.post("/projects/{project_id}/characters/casting/augment")
def augment_character_concept(
    project_id: uuid.UUID,
    request: TextAugmentRequest,
    session: Session = Depends(deps.get_session),
    current_user_id: str = Depends(deps.get_current_user_id),
):
    project = session.get(Project, project_id)
    if not project:
         raise HTTPException(status_code=404, detail="Project not found")

    # Deduct credits (Cost: 5)
    billing_service.deduct_credits(session, project.workspace_id, uuid.UUID(current_user_id), "augment_character_text")

    result = ai_service.augment_character_text(
        name=request.name,
        tags=request.tags,
        mood=request.mood,
        style=request.style,
        language=project.language if project else "en"
    )
    return result

@router.post("/projects/{project_id}/characters/casting/generate")
def generate_character_sheet_endpoint(
    project_id: uuid.UUID,
    request: GenerateSheetRequest,
    background_tasks: BackgroundTasks,
    session: Session = Depends(deps.get_session),
    current_user_id: str = Depends(deps.get_current_user_id),
):
    char = session.get(Character, request.character_id)
    if not char or char.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Character not found")
        
    project = session.get(Project, project_id)
    if not project:
         raise HTTPException(status_code=404, detail="Project not found")

    # Deduct credits (Cost: 20)
    billing_service.deduct_credits(session, project.workspace_id, uuid.UUID(current_user_id), "generate_character_sheet")
        
    char.sheet_status = "processing"
    char.description = request.description
    session.add(char)
    session.commit()
    
    background_tasks.add_task(bg_generate_character_sheet, char.id, request.name, request.description, request.style)
    
    return {"status": "processing", "character_id": char.id}

@router.post("/projects/{project_id}/episodes/ideas")
def generate_episode_ideas_endpoint(
    project_id: uuid.UUID,
    session: Session = Depends(deps.get_session),
    current_user_id: str = Depends(deps.get_current_user_id),
):
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Deduct credits (Cost: 3)
    billing_service.deduct_credits(session, project.workspace_id, uuid.UUID(current_user_id), "generate_episode_ideas")
        
    recent_eps = session.exec(select(Episode).where(Episode.project_id == project_id).where(Episode.deleted_at == None).order_by(Episode.episode_order.desc()).limit(3)).all()
    recent_context = "\n".join([f"{ep.title}: {ep.story_summary}" for ep in recent_eps])
    
    ideas = ai_service.generate_episode_ideas(
        project_title=project.title,
        worldview=str(project.worldview) if project.worldview else "",
        recent_episodes=recent_context,
        language=project.language or "en"
    )
    return ideas

@router.post("/projects/{project_id}/episodes/create")
def create_episode_with_cuts(
    project_id: uuid.UUID,
    request: CreateEpisodeRequest,
    session: Session = Depends(deps.get_session),
    current_user_id: str = Depends(deps.get_current_user_id),
):
    project = session.get(Project, project_id)
    if not project:
         raise HTTPException(status_code=404, detail="Project not found")

    # Deduct credits (Cost: 5)
    billing_service.deduct_credits(session, project.workspace_id, uuid.UUID(current_user_id), "generate_initial_cuts")

    # 1. Create Episode
    last_episode = session.exec(select(Episode).where(Episode.project_id == project_id).where(Episode.deleted_at == None).order_by(Episode.episode_order.desc()).limit(1)).first()
    new_order = (last_episode.episode_order + 1) if last_episode else 1
    
    episode = Episode(
        project_id=project_id,
        title=request.title,
        story_summary=request.summary,
        episode_order=new_order
    )
    session.add(episode)
    session.commit()
    session.refresh(episode)
    
    # 2. Generate Initial Cuts Plan (Sync)
    cuts_data = ai_service.generate_initial_cuts(
        episode_title=request.title,
        summary=request.summary,
        style=project.art_style or project.style_preset,
        num_cuts=request.num_cuts,
        language=project.language or "en"
    )
    
    created_cuts = []
    for c_data in cuts_data:
        cut = StoryCut(
            episode_id=episode.id,
            cut_order=c_data.get("cut_order", 0),
            script=c_data.get("script", ""),
            selected_layout=c_data.get("panel_type", "Square"),
            aspect_ratio="1:1", 
            dialogues=c_data.get("dialogues", []),
            appearing_characters=c_data.get("appearing_characters", [])
        )
        session.add(cut)
        created_cuts.append(cut)
    
    session.commit()
    
    return {"episode_id": episode.id, "cuts_count": len(created_cuts)}

@router.post("/episodes/{episode_id}/cuts/{cut_id}/generate-image")
def generate_cut_image_endpoint(
    episode_id: uuid.UUID,
    cut_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    session: Session = Depends(deps.get_session),
    current_user_id: str = Depends(deps.get_current_user_id),
):
    cut = session.get(StoryCut, cut_id)
    if not cut:
        raise HTTPException(status_code=404, detail="Cut not found")
        
    episode = session.get(Episode, cut.episode_id)
    project = session.get(Project, episode.project_id)
    
    # Deduct credits (Cost: 8)
    billing_service.deduct_credits(session, project.workspace_id, uuid.UUID(current_user_id), "bg_generate_cut_image")

    background_tasks.add_task(bg_generate_cut_image, cut.id)
    return {"status": "processing", "cut_id": cut.id}
