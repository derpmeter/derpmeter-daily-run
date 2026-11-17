"""
Base schemas and common mixins for Pydantic models.
"""
from pydantic import BaseModel, validator
from app.core.config import settings


class FullUrlMixin:
    """Mixin to convert relative URLs to full URLs."""
    
    @classmethod
    def _make_full_url(cls, v: str | None) -> str | None:
        """Convert a relative path to a full URL using STORAGE_HOST."""
        if v and not v.startswith("http"):
            return f"{settings.STORAGE_HOST}/{v}"
        return v


class OrmConfig:
    """Common ORM configuration for Pydantic models."""
    from_attributes = True
