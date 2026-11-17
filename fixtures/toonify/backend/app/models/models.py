from typing import List, Optional
from uuid import UUID, uuid4
from datetime import datetime
from sqlmodel import Field, SQLModel, Relationship
from sqlalchemy import Column, JSON, Text
# from pgvector.sqlalchemy import Vector # Disabled for compatibility

# --- Associations ---
class WorkspaceMember(SQLModel, table=True):
    workspace_id: UUID = Field(foreign_key="workspace.id", primary_key=True)
    user_id: UUID = Field(foreign_key="user.id", primary_key=True)
    role: str = "member"  # owner, admin, member

# --- Core Models ---

class User(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    email: str = Field(unique=True, index=True)
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    language: str = Field(default="en")
    auth_provider: str = Field(default="email") # email, clerk
    clerk_id: Optional[str] = Field(default=None, index=True)
    
    workspaces: List["Workspace"] = Relationship(back_populates="members", link_model=WorkspaceMember)

class UserRead(SQLModel):
    id: UUID
    email: str
    language: str
    created_at: datetime

class UserUpdate(SQLModel):
    email: Optional[str] = None
    language: Optional[str] = None
    password: Optional[str] = None

class Workspace(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str
    owner_id: UUID  # Creator/Primary Owner
    tier: str = "free"
    credits: int = 500
    created_at: datetime = Field(default_factory=datetime.utcnow)

    members: List[User] = Relationship(back_populates="workspaces", link_model=WorkspaceMember)
    projects: List["Project"] = Relationship(back_populates="workspace")
    transactions: List["CreditTransaction"] = Relationship(back_populates="workspace")
    assets: List["Asset"] = Relationship(back_populates="workspace")
    custom_styles: List["CustomStyle"] = Relationship(back_populates="workspace")


class ProjectGenreLink(SQLModel, table=True):
    project_id: UUID = Field(foreign_key="project.id", primary_key=True)
    genre_id: UUID = Field(foreign_key="genre.id", primary_key=True)


class Genre(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str = Field(unique=True)
    description: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)


    projects: List["Project"] = Relationship(back_populates="genres", link_model=ProjectGenreLink)


class Asset(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    workspace_id: Optional[UUID] = Field(foreign_key="workspace.id", default=None) # Optional for system files
    user_id: Optional[UUID] = None # Optional for system files
    filename: str
    file_url: str
    file_type: str # image/png, etc.
    created_at: datetime = Field(default_factory=datetime.utcnow)

    workspace: Optional[Workspace] = Relationship(back_populates="assets")

class CreditTransaction(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    workspace_id: UUID = Field(foreign_key="workspace.id")
    user_id: UUID
    amount: int
    action_type: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    workspace: Workspace = Relationship(back_populates="transactions")

class Project(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    title: str
    subtitle: Optional[str] = None
    
    # genre_id: Optional[UUID] = Field(foreign_key="genre.id", default=None) # DEPRECATED
    
    worldview: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    workspace_id: UUID = Field(foreign_key="workspace.id")
    owner_id: UUID
    style_preset: str
    art_style: Optional[str] = None # Detailed style description or name
    style_reference_url: Optional[str] = None # URL of the selected style image
    language: str = Field(default="en")
    
    cover_image_status: str = "pending" # pending, processing, completed, failed
    suggestions_status: str = "pending" # pending, processing, completed, failed
    
    # File References
    cover_image_asset_id: Optional[UUID] = Field(foreign_key="asset.id", default=None)
    thumbnail_asset_id: Optional[UUID] = Field(foreign_key="asset.id", default=None)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    deleted_at: Optional[datetime] = Field(default=None)

    workspace: Workspace = Relationship(back_populates="projects")
    # genre: Optional[Genre] = Relationship(back_populates="projects") # DEPRECATED
    genres: List[Genre] = Relationship(back_populates="projects", link_model=ProjectGenreLink)
    
    cover_image_asset: Optional["Asset"] = Relationship(
        sa_relationship_kwargs={
            "primaryjoin": "Project.cover_image_asset_id==Asset.id",
            "uselist": False
        }
    )
    thumbnail_asset: Optional["Asset"] = Relationship(
        sa_relationship_kwargs={
            "primaryjoin": "Project.thumbnail_asset_id==Asset.id",
            "uselist": False
        }
    )

    characters: List["Character"] = Relationship(back_populates="project")
    episodes: List["Episode"] = Relationship(back_populates="project")
    clues: List["Clue"] = Relationship(back_populates="project")
    suggestions: List["CharacterSuggestion"] = Relationship(back_populates="project")
    episode_suggestions: List["EpisodeSuggestion"] = Relationship(back_populates="project")

class Character(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    project_id: UUID = Field(foreign_key="project.id")
    name: str
    appearance_tags: List[str] = Field(sa_column=Column(JSON), default=[])
    default_mood: List[str] = Field(sa_column=Column(JSON), default=[])
    consistency_seed: int
    
    # File Reference
    profile_image_asset_id: Optional[UUID] = Field(foreign_key="asset.id", default=None)
    
    description: Optional[str] = Field(default=None, sa_column=Column(Text))
    
    # Character Sheet Generation
    character_sheet_asset_id: Optional[UUID] = Field(foreign_key="asset.id", default=None)
    sheet_status: str = "pending" # pending, processing, completed, failed
    
    height_cm: Optional[int] = None
    body_type: Optional[str] = None
    
    # Structured Profile
    profile: Optional[dict] = Field(sa_column=Column(JSON), default={})
    
    # RAG Embedding
    embedding: List[float] = Field(sa_column=Column(JSON), default=None)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    deleted_at: Optional[datetime] = Field(default=None)

    project: Project = Relationship(back_populates="characters")
    
    profile_image_asset: Optional["Asset"] = Relationship(
        sa_relationship_kwargs={
            "primaryjoin": "Character.profile_image_asset_id==Asset.id",
            "uselist": False
        }
    )
    character_sheet_asset: Optional["Asset"] = Relationship(
        sa_relationship_kwargs={
            "primaryjoin": "Character.character_sheet_asset_id==Asset.id",
            "uselist": False
        }
    )

    @property
    def profile_image_url(self) -> Optional[str]:
        if self.profile_image_asset:
            return self.profile_image_asset.file_url
        return None


class Episode(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    project_id: UUID = Field(foreign_key="project.id")
    title: str
    story_summary: Optional[str] = None
    episode_order: int
    created_at: datetime = Field(default_factory=datetime.utcnow)
    status: str = Field(default="ready", sa_column_kwargs={"server_default": "ready"}) # ready, generating, failed
    
    # Context for consistency
    background_info: Optional[str] = Field(default=None, sa_column=Column(Text))
    character_outfits: Optional[dict] = Field(sa_column=Column(JSON), default={}) # {CharacterName: Description}
    character_reference_board_urls: List[str] = Field(sa_column=Column(JSON), default=[])  # Cached reference board images (max 4 chars each)
    
    # GenAI Context Caching for consistent style/character rendering
    context_cache_name: Optional[str] = None  # GenAI cached content name (e.g., "cachedContents/xxx")
    context_cache_expires_at: Optional[datetime] = None  # Cache expiration time
    
    deleted_at: Optional[datetime] = Field(default=None)

    project: Project = Relationship(back_populates="episodes")
    cuts: List["StoryCut"] = Relationship(back_populates="episode")

class StoryCut(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    episode_id: UUID = Field(foreign_key="episode.id")
    cut_order: int
    script: str
    location: Optional[str] = None
    time_of_day: Optional[str] = None
    transition_ref: Optional[str] = None # Notes for transition from prev cut
    selected_layout: str
    aspect_ratio: str
    
    # File Reference
    image_path: Optional[str] = None # Direct URL/Path for MVP
    image_asset_id: Optional[UUID] = Field(foreign_key="asset.id", default=None)
    
    # Status Tracking
    status: str = Field(default="idle") # idle, generating, completed, failed
    
    dialogues: List[dict] = Field(sa_column=Column(JSON), default=[]) # JSON List of {speaker, text}
    appearing_characters: List[dict] = Field(sa_column=Column(JSON), default=[]) # List of {id, name}
    
    # RAG Embedding (Stored as JSON array for compatibility)
    embedding: List[float] = Field(sa_column=Column(JSON), default=None)
    
    refer_prev_cut: bool = Field(default=True)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)

    episode: Episode = Relationship(back_populates="cuts")

    image_asset: Optional["Asset"] = Relationship(
        sa_relationship_kwargs={
            "primaryjoin": "StoryCut.image_asset_id==Asset.id",
            "uselist": False
        }
    )

class Clue(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    project_id: UUID = Field(foreign_key="project.id")
    description: str
    status: str = "active" # active, resolved
    created_episode_id: Optional[UUID] = None
    resolved_episode_id: Optional[UUID] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    project: Project = Relationship(back_populates="clues")

class ProjectTemplate(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    title: str
    description: str
    thumbnail_url: Optional[str] = None
    style_preset: str
    initial_structure: dict = Field(sa_column=Column(JSON), default={}) # JSON defining initial episodes/cuts
    category: str = "general" # webtoon, insta, 4koma, etc.
    is_premium: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CustomStyle(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    workspace_id: UUID = Field(foreign_key="workspace.id")
    name: str
    description: str # Used as prompt
    image_url: Optional[str] = None # Generated preview
    status: str = "pending" # pending, processing, completed, failed
    created_at: datetime = Field(default_factory=datetime.utcnow)

    workspace: Workspace = Relationship(back_populates="custom_styles")

class CharacterSuggestion(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    project_id: UUID = Field(foreign_key="project.id")
    
    # Suggested Data
    name: str
    age: str
    visual_keywords: List[str] = Field(sa_column=Column(JSON), default=[])
    personality: str # Summary
    personality_tags: List[str] = Field(sa_column=Column(JSON), default=[])
    theme_color: Optional[str] = None
    bio: Optional[str] = Field(default=None, sa_column=Column(Text))
    role: Optional[str] = None # Suggested role text
    recommended_role: Optional[str] = None # Internal archetype ID (e.g. protagonist)
    stats: Optional[dict] = Field(sa_column=Column(JSON), default=None)
    
    is_used: bool = False
    deleted_at: Optional[datetime] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)

    project: Project = Relationship(back_populates="suggestions")


class EpisodeSuggestion(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    project_id: UUID = Field(foreign_key="project.id")
    
    title: str
    summary: str = Field(sa_column=Column(Text))
    reason: Optional[str] = Field(default=None, sa_column=Column(Text))
    user_instruction: Optional[str] = None
    
    is_used: bool = False
    deleted_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    project: Project = Relationship(back_populates="episode_suggestions")
