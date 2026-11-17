from sqlmodel import create_engine
from app.core.config import settings

# Create engine (Sync for now, as used in deps and background tasks)
# We replace postgresql+asyncpg with postgresql because we are using blocking Session in deps/tasks
engine = create_engine(settings.DATABASE_URL.replace("postgresql+asyncpg", "postgresql"), echo=True)
