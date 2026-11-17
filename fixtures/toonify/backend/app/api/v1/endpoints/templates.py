from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from uuid import UUID

from app.api import deps
from app.models.models import ProjectTemplate
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class TemplateOut(BaseModel):
    id: UUID
    title: str
    description: str
    thumbnail_url: str | None
    style_preset: str
    category: str
    is_premium: bool

@router.get("", response_model=List[TemplateOut])
def list_templates(
    session: Session = Depends(deps.get_session),
    category: str | None = Query(None, description="Filter by category"),
) -> Any:
    """
    List available project templates.
    """
    query = select(ProjectTemplate)
    if category:
        query = query.where(ProjectTemplate.category == category)
    
    templates = session.exec(query).all()
    
    # If no templates exist (first run), let's return some mock data or seed it
    # Ideally, migration scripts handle seeding. But for MVP let's return a hardcoded list if empty for demo.
    if not templates:
        return [
            TemplateOut(
                id=UUID('00000000-0000-0000-0000-000000000001'),
                title="4-Koma Starter",
                description="Classic 4-panel vertical comic layout.",
                thumbnail_url=None,
                style_preset="simple_webtoon",
                category="4koma",
                is_premium=False
            ),
             TemplateOut(
                id=UUID('00000000-0000-0000-0000-000000000002'),
                title="Instagram Story",
                description="Vertical layout optimized for social media.",
                thumbnail_url=None,
                style_preset="clean_line",
                category="insta",
                is_premium=False
            ),
            TemplateOut(
                id=UUID('00000000-0000-0000-0000-000000000003'),
                title="Action Webtoon",
                description="Dynamic layouts for action sequences.",
                thumbnail_url=None,
                style_preset="anime_action",
                category="webtoon",
                is_premium=False
            )
        ]

    return templates
