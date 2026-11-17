"""
Common schemas used across multiple domains.
"""
from typing import Any, List, Optional
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID


class SuccessResponse(BaseModel):
    """Standard success response."""
    status: str = "success"
    message: Optional[str] = None


class ErrorResponse(BaseModel):
    """Standard error response."""
    detail: str
    code: Optional[str] = None


class PaginatedResponse(BaseModel):
    """Base schema for paginated responses."""
    total: int
    page: int
    page_size: int
    items: List[Any]
