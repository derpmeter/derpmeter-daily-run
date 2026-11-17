"""
GenAI Context Caching Service - 스타일 및 캐릭터 레퍼런스 캐싱

에피소드 컷 생성 시 일관된 스타일과 캐릭터 렌더링을 위해
GenAI Context Caching을 사용합니다.
"""
from datetime import datetime, timedelta
from typing import Optional, List, Tuple
from uuid import UUID
import logging

from google.genai import types

from app.services.ai.base import BaseAIService

logger = logging.getLogger(__name__)


# 캐시 TTL 설정 (1시간)
DEFAULT_CACHE_TTL_SECONDS = 3600


class ContextCacheService(BaseAIService):
    """
    GenAI Context Caching 서비스
    
    스타일 참조 이미지와 캐릭터 레퍼런스 보드를 GenAI에 캐시하여
    비용 절감 및 일관된 스타일 렌더링을 제공합니다.
    """
    
    def create_episode_cache(
        self,
        episode_id: UUID,
        style_ref_url: Optional[str],
        reference_board_urls: List[str],
        system_instruction: str,
        ttl_seconds: int = DEFAULT_CACHE_TTL_SECONDS
    ) -> Tuple[Optional[str], Optional[datetime]]:
        """
        에피소드용 컨텍스트 캐시 생성
        
        Args:
            episode_id: 에피소드 ID
            style_ref_url: 스타일 참조 이미지 URL
            reference_board_urls: 캐릭터 레퍼런스 보드 URL 목록
            system_instruction: 시스템 프롬프트
            ttl_seconds: 캐시 유효 시간 (초)
        
        Returns:
            (cache_name, expires_at) - 캐시 이름/ID와 만료 시간
        """
        self._ensure_client()
        
        try:
            # 이미지 다운로드 및 준비
            contents = []
            
            # 1. 스타일 참조 이미지 (최우선순위)
            if style_ref_url:
                logger.info(f"[ContextCache] Adding style reference: {style_ref_url[:60]}...")
                style_img = self._download_image_as_pil(style_ref_url)
                if style_img:
                    contents.append(style_img)
                    logger.info("[ContextCache] Style reference added to cache contents")
                else:
                    logger.warning("[ContextCache] Failed to download style reference image")
            
            # 2. 레퍼런스 보드 이미지들
            for idx, board_url in enumerate(reference_board_urls):
                logger.info(f"[ContextCache] Adding reference board {idx + 1}: {board_url[:60]}...")
                board_img = self._download_image_as_pil(board_url)
                if board_img:
                    contents.append(board_img)
                    logger.info(f"[ContextCache] Reference board {idx + 1} added to cache contents")
                else:
                    logger.warning(f"[ContextCache] Failed to download reference board {idx + 1}")
            
            if not contents:
                logger.warning("[ContextCache] No images to cache, skipping cache creation")
                return None, None
            
            # 3. 컨텍스트 캐시 생성
            # 모델은 이미지 생성 모델과 동일하게 사용 (버전 명시 필요)
            # gemini-2.0-flash-001 처럼 명시적 버전 필요
            cache_model = "models/gemini-2.0-flash-001"  # Context caching 지원 모델
            
            logger.info(f"[ContextCache] Creating cache with {len(contents)} images, TTL={ttl_seconds}s")
            
            cache = self.client.caches.create(
                model=cache_model,
                config=types.CreateCachedContentConfig(
                    display_name=f"episode_{episode_id}_context",
                    system_instruction=system_instruction,
                    contents=contents,
                    ttl=f"{ttl_seconds}s"
                )
            )
            
            cache_name = cache.name
            expires_at = datetime.utcnow() + timedelta(seconds=ttl_seconds)
            
            logger.info(f"[ContextCache] Cache created successfully: {cache_name}, expires at {expires_at}")
            
            return cache_name, expires_at
            
        except Exception as e:
            logger.error(f"[ContextCache] Failed to create cache: {e}")
            return None, None
    
    def get_or_refresh_cache(
        self,
        episode_id: UUID,
        current_cache_name: Optional[str],
        current_expires_at: Optional[datetime],
        style_ref_url: Optional[str],
        reference_board_urls: List[str],
        system_instruction: str,
        refresh_margin_seconds: int = 300  # 5분 이내 만료 시 갱신
    ) -> Tuple[Optional[str], Optional[datetime], bool]:
        """
        기존 캐시를 확인하고 필요시 갱신
        
        Args:
            episode_id: 에피소드 ID
            current_cache_name: 현재 저장된 캐시 이름
            current_expires_at: 현재 캐시 만료 시간
            style_ref_url: 스타일 참조 이미지 URL
            reference_board_urls: 캐릭터 레퍼런스 보드 URL 목록
            system_instruction: 시스템 프롬프트
            refresh_margin_seconds: 이 시간 이내 만료 시 갱신
        
        Returns:
            (cache_name, expires_at, was_refreshed) - 캐시 정보 및 갱신 여부
        """
        self._ensure_client()
        
        # 1. 기존 캐시가 유효한지 확인
        if current_cache_name and current_expires_at:
            time_until_expiry = (current_expires_at - datetime.utcnow()).total_seconds()
            
            if time_until_expiry > refresh_margin_seconds:
                # 캐시가 아직 유효함
                logger.info(f"[ContextCache] Using existing cache: {current_cache_name}, expires in {time_until_expiry:.0f}s")
                return current_cache_name, current_expires_at, False
            else:
                logger.info(f"[ContextCache] Cache expiring soon ({time_until_expiry:.0f}s), refreshing...")
                # 기존 캐시 삭제 시도
                try:
                    self.client.caches.delete(name=current_cache_name)
                    logger.info(f"[ContextCache] Deleted expiring cache: {current_cache_name}")
                except Exception as e:
                    logger.warning(f"[ContextCache] Failed to delete old cache: {e}")
        
        # 2. 새 캐시 생성
        cache_name, expires_at = self.create_episode_cache(
            episode_id=episode_id,
            style_ref_url=style_ref_url,
            reference_board_urls=reference_board_urls,
            system_instruction=system_instruction
        )
        
        return cache_name, expires_at, True
    
    def delete_cache(self, cache_name: str) -> bool:
        """
        캐시 삭제
        
        Args:
            cache_name: 삭제할 캐시 이름
        
        Returns:
            성공 여부
        """
        self._ensure_client()
        
        try:
            self.client.caches.delete(name=cache_name)
            logger.info(f"[ContextCache] Cache deleted: {cache_name}")
            return True
        except Exception as e:
            logger.warning(f"[ContextCache] Failed to delete cache: {e}")
            return False


# 싱글톤 인스턴스
context_cache_service = ContextCacheService()
