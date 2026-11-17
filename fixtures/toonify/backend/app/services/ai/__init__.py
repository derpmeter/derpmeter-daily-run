"""
AI Service Package - 통합 Facade

이 패키지는 모든 AI 관련 기능을 도메인별로 분리하여 제공합니다.

Usage:
    from app.services.ai import ai_service
    
    # 기존 방식과 동일하게 사용 (역호환성 유지)
    ai_service.recommend_style(...)
    ai_service.generate_image(...)
    
    # 또는 도메인별 서비스 클래스 직접 사용
    from app.services.ai.text import CharacterAIService
    char_service = CharacterAIService()
    char_service.augment_character_text(...)
"""
from typing import List, Optional

from app.services.ai.text.character import CharacterAIService
from app.services.ai.text.episode import EpisodeAIService
from app.services.ai.text.style import StyleAIService
from app.services.ai.text.worldview import WorldviewAIService
from app.services.ai.generation.image_service import ImageAIService
from app.services.ai.generation.panel_service import PanelAIService


class AIService:
    """
    AI 서비스 통합 Facade
    
    기존 코드와의 역호환성을 유지하면서 내부적으로 
    도메인별 서비스에 위임합니다.
    
    모든 도메인 서비스 인스턴스는 여기서 생성되고 관리됩니다.
    """
    
    def __init__(self):
        # 도메인별 서비스 인스턴스 생성
        self._character = CharacterAIService()
        self._episode = EpisodeAIService()
        self._style = StyleAIService()
        self._worldview = WorldviewAIService()
        self._image = ImageAIService()
        self._panel = PanelAIService()
    
    # ========================================
    # Style 관련 메서드
    # ========================================
    
    def recommend_style(self, description: str, language: str = "en") -> dict:
        return self._style.recommend_style(description, language)
    
    def augment_style_description(
        self, 
        current_prompt: str, 
        project_context: dict = None, 
        language: str = "en"
    ) -> str:
        return self._style.augment_style_description(current_prompt, project_context, language)
    
    # ========================================
    # Worldview 관련 메서드
    # ========================================
    
    def augment_worldview(
        self, 
        description: str, 
        title: str = None, 
        subtitle: str = None, 
        genres: List[str] = None, 
        language: str = "en"
    ) -> dict:
        return self._worldview.augment_worldview(description, title, subtitle, genres, language)
    
    # ========================================
    # Character 관련 메서드
    # ========================================
    
    def augment_character_text(
        self, 
        name: str, 
        tags: List[str], 
        mood: list | str, 
        style: str, 
        project_context: str = "", 
        language: str = "en"
    ) -> dict:
        return self._character.augment_character_text(name, tags, mood, style, project_context, language)
    
    def get_character_suggestion(
        self, 
        suggestion_type: str, 
        project_context: str, 
        current_data: dict, 
        language: str = "en"
    ) -> dict:
        return self._character.get_character_suggestion(suggestion_type, project_context, current_data, language)
    
    def generate_character_batch_suggestions(
        self, 
        project_context: str, 
        count: int = 10, 
        language: str = "en",
        include_protagonist: bool = False
    ) -> dict:
        return self._character.generate_character_batch_suggestions(
            project_context, count, language, include_protagonist
        )
    
    def analyze_character_concept(
        self, 
        project_context: str, 
        name: str, 
        age: str, 
        visual_keywords: List[str], 
        personality: str, 
        language: str = "en"
    ) -> dict:
        return self._character.analyze_character_concept(
            project_context, name, age, visual_keywords, personality, language
        )
    
    # ========================================
    # Episode 관련 메서드
    # ========================================
    
    def generate_direction_options(
        self, 
        script: str, 
        character_context: str = "", 
        language: str = "en"
    ) -> dict:
        return self._episode.generate_direction_options(script, character_context, language)
    
    def generate_episode_ideas(
        self, 
        project_title: str, 
        worldview: str, 
        recent_episodes: str, 
        language: str = "en", 
        user_instruction: str = None
    ) -> dict:
        return self._episode.generate_episode_ideas(
            project_title, worldview, recent_episodes, language, user_instruction
        )
    
    def generate_prologue_ideas(
        self, 
        project_title: str, 
        worldview: str, 
        characters: str,
        language: str = "en", 
        user_instruction: str = None
    ) -> dict:
        return self._episode.generate_prologue_ideas(
            project_title, worldview, characters, language, user_instruction
        )
    
    def generate_initial_cuts(
        self, 
        episode_title: str, 
        summary: str, 
        style: str, 
        num_cuts: int = 6, 
        language: str = "en",
        available_characters: List[dict] = None,
        project_context: dict = None
    ) -> dict:
        return self._episode.generate_initial_cuts(
            episode_title, summary, style, num_cuts, language, 
            available_characters, project_context
        )
    
    # ========================================
    # Image 관련 메서드  
    # ========================================
    
    def generate_image(
        self, 
        prompt: str, 
        width: int = 1024, 
        height: int = 1024, 
        seed: int = None, 
        language: str = "en", 
        reference_image_urls: List[str] = None, 
        prev_image_url: str = None
    ) -> bytes:
        return self._image.generate_image(
            prompt, width, height, seed, language, reference_image_urls, prev_image_url
        )
    
    def modify_image(
        self, 
        original_image_url: str, 
        instruction: str, 
        language: str = "en"
    ) -> bytes:
        return self._image.modify_image(original_image_url, instruction, language)
    
    def get_embedding(self, text: str) -> List[float]:
        return self._image.get_embedding(text)
    
    def generate_project_cover_image(
        self, 
        title: str, 
        genre: str, 
        worldview: str, 
        style: str, 
        tones: List[str] = None, 
        style_ref_url: str = None, 
        character_image_urls: List[str] = None, 
        language: str = "en"
    ) -> bytes:
        return self._image.generate_project_cover_image(
            title, genre, worldview, style, tones, style_ref_url, 
            character_image_urls, language
        )
    
    def generate_character_sheet(
        self, 
        name: str, 
        description: str, 
        style: str, 
        style_ref_url: str = None
    ) -> bytes:
        return self._image.generate_character_sheet(name, description, style, style_ref_url)
    
    def generate_character_outfit_image(
        self,
        character_name: str,
        character_description: str,
        outfit_description: str,
        style: str,
        profile_image_url: str = None,
        style_ref_url: str = None
    ) -> bytes:
        """에피소드 특정 의상을 입은 캐릭터 이미지 생성"""
        return self._image.generate_character_outfit_image(
            character_name, character_description, outfit_description, 
            style, profile_image_url, style_ref_url
        )
    
    # Legacy async wrapper methods (for backward compatibility)
    def generate_project_cover_async(
        self, 
        project_id: str, 
        title: str, 
        genre: str, 
        worldview: str, 
        style: str
    ):
        return self.generate_project_cover_image(title, genre, worldview, style)
    
    def generate_character_sheet_async(
        self, 
        character_id: str, 
        name: str, 
        description: str, 
        style: str
    ):
        return self.generate_character_sheet(name, description, style)
    
    # ========================================
    # Panel 관련 메서드
    # ========================================
    
    def generate_panel_image(
        self, 
        prompt: str, 
        width: int = 1024, 
        height: int = 1024, 
        aspect_ratio: str = None,
        style_ref_url: str = None, 
        character_data: List[dict] = None, 
        prev_scene_url: str = None,
        language: str = "en",
        art_style: str = None,
        reference_board_urls: List[str] = None,
        reference_board_prompt: str = None,
        cached_content_name: str = None
    ) -> bytes:
        return self._panel.generate_panel_image(
            prompt, width, height, aspect_ratio, style_ref_url, 
            character_data, prev_scene_url, language, art_style,
            reference_board_urls, reference_board_prompt, cached_content_name
        )


# 싱글톤 인스턴스 (기존 코드 호환)
ai_service = AIService()


# 편의를 위한 서비스 클래스 export
__all__ = [
    # 통합 Facade
    "AIService",
    "ai_service",
    # 도메인별 서비스 클래스
    "CharacterAIService",
    "EpisodeAIService",
    "StyleAIService",
    "WorldviewAIService",
    "ImageAIService",
    "PanelAIService",
]
