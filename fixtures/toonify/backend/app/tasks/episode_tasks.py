"""
Episode Background Tasks
Cut generation, image generation, and sequential processing tasks.
"""
from typing import Optional
from uuid import UUID
from sqlmodel import Session, select

from app.core.logging import get_logger
from app.db.engine import engine
from app.models import Episode, Project, Character, StoryCut
from app.services.ai import ai_service
from app.services.ai.caching import context_cache_service
from app.services.storage import storage
from app.services.reference_board import (
    create_reference_boards, 
    generate_board_prompt_description
)

logger = get_logger(__name__)


def generate_episode_cuts_task(
    episode_id: UUID,
    project_id: UUID,
    episode_title: str,
    episode_summary: str,
    style: str,
    num_cuts: int,
    language: str
):
    """Background task to generate initial cuts (script, dialogue, panel type) for an episode."""
    logger.info("Background task: Generating cuts for episode", episode_id=str(episode_id))
    with Session(engine) as session:
        episode = session.get(Episode, episode_id)
        if not episode: return
        
        # Fetch Project for Worldview/Context
        project = session.get(Project, project_id)
        project_context = {}
        if project:
            genres = [g.name for g in project.genres] if project.genres else []
            project_context = {
                "title": project.title,
                "genres": genres, 
                "worldview": project.worldview or {},
                "art_style": project.art_style or project.style_preset
            }

        # Fetch project characters for AI context
        characters = session.exec(select(Character).where(Character.project_id == project_id).where(Character.deleted_at == None)).all()
        
        char_details = []
        for c in characters:
            personality = c.profile.get("personality") if c.profile else None
            # ... existing character logic ...
            if not personality and c.default_mood:
                personality = ", ".join(c.default_mood)
                
            char_details.append({
                "id": str(c.id),
                "name": c.name,
                "personality": personality,
                "appearance": c.appearance_tags,
                "description": c.description
            })

        # Generate Cuts via AI
        try:
            response_data = ai_service.generate_initial_cuts(
                episode_title=episode_title,
                summary=episode_summary,
                style=style,
                num_cuts=num_cuts,
                language=language,
                available_characters=char_details,
                project_context=project_context
            )
            
            # Save Episode Context (Background & Outfits)
            if isinstance(response_data, dict):
                episode.background_info = response_data.get("background_info")
                episode.character_outfits = response_data.get("character_outfits")
                cuts_list = response_data.get("cuts", [])
            else:
                 # Fallback for legacy behavior if AI returns list
                cuts_list = response_data
                
            session.add(episode)

            # Save Cuts
            created_cuts = []
            for cut_item in cuts_list:
                story_cut = StoryCut(
                    episode_id=episode.id,
                    cut_order=cut_item.get("cut_order", 1),
                    script=cut_item.get("script", ""),
                    selected_layout=cut_item.get("panel_type", "Square"),
                    aspect_ratio=cut_item.get("panel_type", "1:1"),
                    dialogues=cut_item.get("dialogues", []),
                    appearing_characters=cut_item.get("appearing_characters", []),
                    refer_prev_cut=cut_item.get("refer_prev_cut", True),
                    location=cut_item.get("location"),
                    time_of_day=cut_item.get("time_of_day"),
                    transition_ref=cut_item.get("transition_ref"),
                    image_path=None
                )
                
                # Refine aspect ratio
                ptype = cut_item.get("panel_type", "").lower()
                if ":" in ptype:
                     story_cut.aspect_ratio = ptype
                elif "wide" in ptype:
                    story_cut.aspect_ratio = "16:9"
                elif "vertical" in ptype:
                     story_cut.aspect_ratio = "9:16"
                elif "square" in ptype:
                     story_cut.aspect_ratio = "1:1"
                else:
                    story_cut.aspect_ratio = "1:1"
                    
                session.add(story_cut)
                created_cuts.append(story_cut)
            
            episode.status = "ready"
            session.add(episode)
            session.commit()
            logger.info("Task complete: Generated cuts for episode", episode_id=str(episode_id), count=len(created_cuts))
            
            # Note: Automatic image generation triggering removed per user request.
            # Images will be generated manually or via 'Generate All' in frontend.
            
        except Exception as e:
            logger.error("Error generating cuts", episode_id=str(episode_id), error=str(e))
            episode.status = "failed"
            session.add(episode)
            session.commit()


def generate_reference_boards_for_episode(
    episode_id: UUID,
    session: Session = None
) -> tuple[list[str], list[dict]]:
    """
    에피소드에 등장하는 캐릭터들의 레퍼런스 보드를 생성하고 캐싱.
    
    1. 에피소드에 등장하는 캐릭터만 추출 (character_outfits 기준)
    2. 각 캐릭터별로 의상 반영 이미지 AI 생성
    3. PIL로 레퍼런스 보드 합성
    4. GCS 업로드 및 캐싱
    
    Returns:
        (board_urls, characters_info) - 보드 URL 리스트와 캐릭터 정보 리스트
    """
    close_session = False
    if session is None:
        session = Session(engine)
        close_session = True
    
    try:
        episode = session.get(Episode, episode_id)
        if not episode:
            return [], []
        
        # 이미 캐싱된 보드가 있으면 반환
        if episode.character_reference_board_urls:
            logger.info("Using cached reference boards", episode_id=str(episode_id))
            # 캐릭터 정보는 다시 수집
            episode_outfits = episode.character_outfits or {}
            project = session.get(Project, episode.project_id)
            all_chars = session.exec(
                select(Character)
                .where(Character.project_id == project.id)
                .where(Character.deleted_at == None)
            ).all()
            
            # Only include characters that appear in this episode
            appearing_char_names = set(k.lower() for k in episode_outfits.keys())
            chars_info = []
            for c in all_chars:
                if c.name.lower() in appearing_char_names:
                    chars_info.append({
                        "name": c.name,
                        "description": c.description or "",
                        "outfit": episode_outfits.get(c.name.lower(), "")
                    })
            
            return episode.character_reference_board_urls, chars_info
        
        # 에피소드 의상 정보 확인
        episode_outfits = episode.character_outfits or {}
        if not episode_outfits:
            logger.info("No character_outfits defined for episode", episode_id=str(episode_id))
            return [], []
        
        # 프로젝트 및 캐릭터 조회
        project = session.get(Project, episode.project_id)
        all_chars = session.exec(
            select(Character)
            .where(Character.project_id == project.id)
            .where(Character.deleted_at == None)
        ).all()
        
        # 캐릭터 이름 -> 캐릭터 객체 매핑
        char_by_name = {c.name.lower(): c for c in all_chars}
        
        # 에피소드에 등장하는 캐릭터만 추출
        appearing_characters = []
        for char_name_lower, outfit_desc in episode_outfits.items():
            if char_name_lower in char_by_name:
                c = char_by_name[char_name_lower]
                appearing_characters.append({
                    "character": c,
                    "outfit": outfit_desc
                })
        
        if not appearing_characters:
            logger.info("No matching characters for episode outfits", episode_id=str(episode_id))
            return [], []
        
        logger.info(
            "Generating outfit images for episode characters", 
            episode_id=str(episode_id), 
            char_count=len(appearing_characters)
        )
        
        # 프로젝트 스타일 정보
        art_style = project.art_style or project.style_preset or "Webtoon"
        style_ref_url = project.style_reference_url
        
        # 각 캐릭터별로 의상 이미지 AI 생성
        characters_for_board = []
        for item in appearing_characters:
            c = item["character"]
            outfit = item["outfit"]
            
            logger.info(f"Generating outfit image for {c.name}: {outfit[:50]}...")
            
            try:
                # AI로 의상 이미지 생성
                outfit_image_bytes = ai_service.generate_character_outfit_image(
                    character_name=c.name,
                    character_description=c.description or ", ".join(c.appearance_tags or []),
                    outfit_description=outfit,
                    style=art_style,
                    profile_image_url=c.profile_image_url,
                    style_ref_url=style_ref_url
                )
                
                # 생성된 이미지를 임시로 GCS에 업로드
                outfit_image_url = storage.upload_image(
                    outfit_image_bytes,
                    schema="outfit_refs",
                    identifier=f"{episode_id}_{c.id}"
                )
                
                characters_for_board.append({
                    "name": c.name,
                    "image_url": outfit_image_url,
                    "description": c.description or "",
                    "outfit": outfit
                })
                
                logger.info(f"Outfit image generated for {c.name}")
                
            except Exception as e:
                logger.error(f"Failed to generate outfit image for {c.name}", error=str(e))
                # 실패 시 기존 프로필 이미지 사용
                if c.profile_image_url:
                    characters_for_board.append({
                        "name": c.name,
                        "image_url": c.profile_image_url,
                        "description": c.description or "",
                        "outfit": outfit
                    })
        
        if not characters_for_board:
            logger.info("No outfit images generated", episode_id=str(episode_id))
            return [], []
        
        logger.info("Creating reference boards from outfit images", char_count=len(characters_for_board))
        
        # PIL로 보드 생성
        board_bytes_list = create_reference_boards(characters_for_board)
        
        # GCS에 업로드
        board_urls = []
        for idx, board_bytes in enumerate(board_bytes_list):
            url = storage.upload_image(
                board_bytes, 
                schema="reference_boards", 
                identifier=f"{episode_id}_{idx}"
            )
            board_urls.append(url)
        
        # 에피소드에 캐싱
        episode.character_reference_board_urls = board_urls
        session.add(episode)
        session.commit()
        
        logger.info("Reference boards created and cached", episode_id=str(episode_id), board_count=len(board_urls))
        
        return board_urls, characters_for_board
        
    except Exception as e:
        logger.error("Failed to generate reference boards", episode_id=str(episode_id), error=str(e))
        return [], []
    
    finally:
        if close_session:
            session.close()

def generate_cut_task(cut_id: UUID, prompt_override: Optional[str], language: str = "en", use_previous_context: bool = True, prev_image_url_override: str = None) -> str | None:
    """Background task to generate image for a single story cut."""
    logger.info("Background task: Generating image for cut", cut_id=str(cut_id), language=language)
    with Session(engine) as session:
        cut = session.get(StoryCut, cut_id)
        if not cut: return None
        
        try:
             # Ensure status is generating if missed
            if cut.status != "generating":
                cut.status = "generating"
                session.add(cut)
                session.commit()

            episode = session.get(Episode, cut.episode_id)
            project = session.get(Project, episode.project_id)
            
            # 1. Context Gathering
            
            # A. Style Reference
            style_ref_url = project.style_reference_url
            if not style_ref_url:
                 pass 
    
            # A2. Episode Global Context
            episode_bg_info = episode.background_info
            episode_char_outfits = episode.character_outfits or {}
            
            # A3. Character Reference Board (for consistency)
            reference_board_urls, board_characters = generate_reference_boards_for_episode(
                episode.id, session
            )
            reference_board_prompt = None
            if reference_board_urls and board_characters:
                # 보드 설명 프롬프트 생성
                prompt_lines = []
                for idx in range(len(reference_board_urls)):
                    prompt_lines.append(generate_board_prompt_description(board_characters, idx))
                reference_board_prompt = "\n\n".join(prompt_lines)
            
            # A4. Context Caching - Get or create cache for style + reference boards
            cached_content_name = None
            from datetime import datetime
            
            # Check if existing cache is valid
            if episode.context_cache_name and episode.context_cache_expires_at:
                if episode.context_cache_expires_at > datetime.utcnow():
                    cached_content_name = episode.context_cache_name
                    logger.info(f"Using existing context cache: {cached_content_name}")
                else:
                    logger.info("Context cache expired, will create new one")
            
            # Create new cache if needed and we have content to cache
            if not cached_content_name and (style_ref_url or reference_board_urls):
                try:
                    from app.services.ai.prompts import PANEL_IMAGE_SYSTEM_PROMPT
                    
                    cache_name, expires_at = context_cache_service.create_episode_cache(
                        episode_id=episode.id,
                        style_ref_url=style_ref_url,
                        reference_board_urls=reference_board_urls,
                        system_instruction=PANEL_IMAGE_SYSTEM_PROMPT
                    )
                    
                    if cache_name:
                        # Save cache info to episode
                        episode.context_cache_name = cache_name
                        episode.context_cache_expires_at = expires_at
                        session.add(episode)
                        session.commit()
                        cached_content_name = cache_name
                        logger.info(f"Created new context cache: {cache_name}")
                except Exception as cache_err:
                    logger.warning(f"Failed to create context cache: {cache_err}. Continuing without cache.")

            # B. Previous Scene (for continuity)
            prev_scene_url = prev_image_url_override # Priority to override
            
            # Check if reference logic is enabled
            should_refer = use_previous_context and cut.refer_prev_cut
            
            # If no override provided, look up in DB
            if not prev_scene_url and should_refer and cut.cut_order > 1:
                prev_cut = session.exec(
                    select(StoryCut)
                    .where(StoryCut.episode_id == cut.episode_id)
                    .where(StoryCut.cut_order == cut.cut_order - 1)
                ).first()
                if prev_cut and prev_cut.image_path:
                    prev_scene_url = prev_cut.image_path
            
            # C. Characters (Max 6)
            # 1. Start with characters explicitly listed for this cut
            raw_appearing = cut.appearing_characters or []
            appearing_names = []
            
            # Initialize with global outfits, then override with specific ones
            char_outfits = episode_char_outfits.copy() 
            
            for item in raw_appearing:
                if isinstance(item, dict):
                    if "name" in item:
                        lower_name = item["name"].lower()
                        appearing_names.append(lower_name)
                        if "clothing" in item and item["clothing"]:
                            char_outfits[lower_name] = item["clothing"]
                elif isinstance(item, str):
                    appearing_names.append(item.lower())

            # 2. Add characters from dialogues
            suggested_names = [d.get("speaker", "").lower() for d in (cut.dialogues or []) if d.get("speaker")]
            appearing_names.extend(suggested_names)
            
            # 3. Deduplicate and filter project characters
            occurring_names = list(set(appearing_names))
            
            # Fetch characters from project
            all_chars = session.exec(select(Character).where(Character.project_id == project.id).where(Character.deleted_at == None)).all()
            
            char_data = []
            char_visuals = []

            # Identify characters who already appeared in previous cuts
            prev_cuts = session.exec(select(StoryCut).where(StoryCut.episode_id == cut.episode_id).where(StoryCut.cut_order < cut.cut_order)).all()
            prev_appearing_names = set()
            for pc in prev_cuts:
                # Extract names from appearing_characters (list of dicts or strings)
                if pc.appearing_characters:
                     for item in pc.appearing_characters:
                        if isinstance(item, dict) and "name" in item:
                            prev_appearing_names.add(item["name"].lower())
                        elif isinstance(item, str):
                            prev_appearing_names.add(item.lower())
                # Also from dialogues
                if pc.dialogues:
                    for d in pc.dialogues:
                         if isinstance(d, dict) and d.get("speaker"):
                             prev_appearing_names.add(d["speaker"].lower())

            # Priority 1: Specifically matched characters
            matched_chars = [c for c in all_chars if c.name.lower() in occurring_names and c.profile_image_url]
            for c in matched_chars[:6]:
                char_data.append({"name": c.name, "url": c.profile_image_url})
                
                # Append visual description for text prompt
                visual_desc_parts = []
                if c.appearance_tags:
                    visual_desc_parts.append(f"Visuals({', '.join(c.appearance_tags)})")
                if c.description:
                    # Truncate description to keep prompt concise
                    desc_short = c.description[:100] + "..." if len(c.description) > 100 else c.description
                    visual_desc_parts.append(f"Traits({desc_short})")
                
                # Only add text description if character is NEW to the episode (First Appearance)
                # to avoid repetitive naming which can cause text artifacts (name tags) in images.
                is_first_appearance = c.name.lower() not in prev_appearing_names
                
                if is_first_appearance and visual_desc_parts:
                    char_visuals.append(f"{c.name}: {' '.join(visual_desc_parts)}")
                
            # Priority 2: Fallback REMOVED to avoid polluting context with irrelevant characters
            # if len(char_data) < 3: ...
            
            # 2. Prompt Construction
            
            # Common Context Components
            setting_info = []
            if cut.location: setting_info.append(f"Location: {cut.location}")
            if cut.time_of_day: setting_info.append(f"Time: {cut.time_of_day}")
            if episode_bg_info: setting_info.append(f"Episode Context: {episode_bg_info}")
            setting_str = ", ".join(setting_info)
            
            outfit_str = ""
            if char_outfits:
                 outfit_list = [f"{name.capitalize()}: {desc}" for name, desc in char_outfits.items()]
                 outfit_str = f"Character Outfits: {', '.join(outfit_list)}"

            char_visuals_str = ""
            if char_visuals:
                # Use narrative descriptions instead of Name: Label to avoid text bleeding
                # Format: "Character [Name] appearance: [Desc]" 
                char_visuals_str = "Character Descriptions:\n" + "\n".join([f"- {cv}" for cv in char_visuals])
                 
            transition_str = ""
            if cut.transition_ref:
                 transition_str = f"Transition Note: {cut.transition_ref}"

            # Worldview Context
            worldview_context = ""
            if project.worldview:
                wv_items = [f"{k}: {v}" for k, v in project.worldview.items()]
                if wv_items:
                    worldview_context = "Worldview/Context: " + ", ".join(wv_items)

            # Determine Scene Action (Unified Logic)
            # If prompt_override is provided (Regenerate with custom text), use it as the main instruction
            # Otherwise use the cut script and dialogues
            
            # Always process dialogues from DB (not from prompt_override)
            has_dialogues = False
            dialogue_parts = []
            for d in cut.dialogues or []:
                speaker = d.get('speaker', 'Unknown')
                text = d.get('text', '')
                dtype = d.get('type', 'speech')
                
                if not text:
                    continue
                
                has_dialogues = True
                
                # Legacy fallback
                if "(속마음)" in text or "(thought)" in text:
                     text = text.replace("(속마음)", "").replace("(thought)", "").strip()
                     dtype = 'thought'
                
                if dtype == 'thought':
                    dialogue_parts.append(f"- {speaker}'s INNER THOUGHT (use cloud bubble): \"{text}\"")
                elif dtype == 'shout':
                    dialogue_parts.append(f"- {speaker} SHOUTS (use spiky speech bubble): \"{text}\"")
                else:
                    dialogue_parts.append(f"- {speaker} says (use speech bubble): \"{text}\"")
            dialogue_text = "\n                ".join(dialogue_parts)
            
            # Scene instruction: use prompt_override if provided, otherwise use cut.script
            scene_description = prompt_override if prompt_override else cut.script
            scene_instruction = f"""
            Action/Scene: {scene_description}
            """
            
            if dialogue_parts:
                scene_instruction += f"""
            DIALOGUES TO INCLUDE IN IMAGE:
            {dialogue_text}
            """

            # Build prompt
            dialogue_instruction = ""
            if has_dialogues:
                dialogue_instruction = """
            4. INCLUDE SPEECH BUBBLES: Draw proper speech bubbles containing the dialogue text.
               - For THOUGHTS: Use cloud-shaped thought bubbles
               - For SHOUTS: Use spiky/jagged speech bubbles
               - For normal speech: Use smooth oval speech bubbles
               - The dialogue text MUST appear inside the bubbles in the image
            """
            else:
                dialogue_instruction = """
            4. This scene has no dialogue. Focus on the visual action and emotion.
            """

            # 스타일 참조 이미지가 있으면 강조
            style_emphasis = ""
            if style_ref_url:
                style_emphasis = """
            *** CRITICAL: The FIRST reference image is the ART STYLE you must replicate exactly. ***
            Match its line work, coloring, shading, and overall aesthetic in this panel.
            """

            prompt = f"""
            {style_emphasis}
            Style: {project.style_preset} {f'({project.art_style})' if project.art_style else ''}
            {worldview_context}
            Setting: {setting_str}
            
            {scene_instruction}
            
            {outfit_str}
            {char_visuals_str}
            {transition_str}
            
            IMPORTANT INSTRUCTIONS:
            1. STRICTLY follow the art style shown in the FIRST reference image. This is the most important requirement.
            2. Panel borders/frames should ONLY be included when dramatically necessary for storytelling effect. Otherwise, draw without borders.
            3. Do NOT include Name Tags, Character Labels, or Watermarks.
            {dialogue_instruction}
            """
    
            # 3. Determine Dimensions
            width, height = 1024, 1024
            ratio = cut.aspect_ratio.lower() if cut.aspect_ratio else "square"
            
            if ratio in ["wide", "16:9"]:
                width, height = 1536, 1024 # 3:2
            elif ratio in ["vertical", "9:16"]:
                width, height = 1024, 1536 # 2:3
            
            # Using generate_panel_image which now supports prev_scene_url and art_style
            # Combine style_preset and art_style for complete style instruction
            combined_art_style = project.art_style or project.style_preset
            if project.art_style and project.style_preset:
                combined_art_style = f"{project.style_preset} - {project.art_style}"
            
            # Use reference board if available, otherwise fallback to individual character data
            # If cache is available, style_ref and reference_boards will be skipped
            img_bytes = ai_service.generate_panel_image(
                prompt=prompt,
                width=width,
                height=height,
                aspect_ratio=ratio,
                style_ref_url=style_ref_url,
                character_data=char_data if not reference_board_urls else None,
                prev_scene_url=prev_scene_url,
                language=language,
                art_style=combined_art_style,
                reference_board_urls=reference_board_urls,
                reference_board_prompt=reference_board_prompt,
                cached_content_name=cached_content_name  # GenAI Context Cache
            )
            
            url = storage.upload_image(img_bytes, schema="cuts", identifier=str(cut_id))
            cut.image_path = url

            # Update status to completed
            cut.status = "completed"
            session.add(cut)
            session.commit()
            
            logger.info("Task complete: Generated image for cut", cut_id=str(cut_id), url=url)
            return url

        except Exception as e:
            logger.error("Cut gen failed", cut_id=str(cut_id), error=str(e))
            cut.status = "failed"
            session.add(cut)
            session.commit()
            return None


def generate_episode_images_sequentially(episode_id: UUID):
    """Background task to generate images for all cuts in an episode sequentially."""
    logger.info("Background task: Starting sequential image generation for episode", episode_id=str(episode_id))
    try:
        with Session(engine) as session:
            # Fetch episode and project for language
            episode = session.get(Episode, episode_id)
            if not episode:
                logger.error("Episode not found", episode_id=str(episode_id))
                return
            
            project = session.get(Project, episode.project_id)
            language = project.language if project else "en"
            
            # Fetch cuts
            cuts = session.exec(select(StoryCut).where(StoryCut.episode_id == episode_id).order_by(StoryCut.cut_order)).all()
            
            for cut in cuts:
                 # Check if image already exists
                if cut.image_path:
                    logger.debug("Skipping cut (already exists)", cut_order=cut.cut_order)
                    continue

                logger.debug("Sequentially generating cut", cut_order=cut.cut_order)
                
                # Call generation task (synchronously)
                # This function handles its own DB session for the cut update, 
                # but we are calling it directly.
                generate_cut_task(cut.id, prompt_override=None, language=language, use_previous_context=True)

            # After loop finishes, update episode status to 'ready'
            logger.info("Sequential generation finished for episode", episode_id=str(episode_id))
            episode = session.get(Episode, episode_id)
            if episode:
                episode.status = "ready"
                session.add(episode)
                session.commit()
                
    except Exception as e:
        logger.error("Sequential generation error", episode_id=str(episode_id), error=str(e))
        # Ensure status is reset even on error
        with Session(engine) as session:
             episode = session.get(Episode, episode_id)
             if episode:
                 episode.status = "ready" # Or 'failed'
                 session.add(episode)
                 session.commit()


def regenerate_selected_cuts_task(episode_id: UUID, cut_ids: list[UUID], language: str = "en"):
    """Background task to regenerate selected cuts in an episode sequentially."""
    logger.info("Starting sequential batch regeneration", episode_id=str(episode_id), cut_count=len(cut_ids))
    
    try:
        # Sort cuts by cut_order to ensure correct previous cut reference
        with Session(engine) as session:
            cuts = session.exec(
                select(StoryCut)
                .where(StoryCut.id.in_(cut_ids))
                .order_by(StoryCut.cut_order)
            ).all()
            sorted_cut_ids = [cut.id for cut in cuts]
        
        # Generate sequentially in order
        for cut_id in sorted_cut_ids:
            logger.debug("Regenerating cut (sequential)", cut_id=str(cut_id))
            generate_cut_task(cut_id, prompt_override=None, language=language, use_previous_context=True)
        
        logger.info("Sequential batch regeneration completed", episode_id=str(episode_id), cut_count=len(cut_ids))
        
    except Exception as e:
        logger.error("Batch regeneration error", episode_id=str(episode_id), error=str(e))
        # Reset status for remaining cuts
        with Session(engine) as session:
            for cut_id in cut_ids:
                cut = session.get(StoryCut, cut_id)
                if cut and cut.status == "generating":
                    cut.status = "failed"
                    session.add(cut)
            session.commit()
