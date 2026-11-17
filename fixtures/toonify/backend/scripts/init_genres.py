import logging
import sys
import os

# Add parent directory to path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import Session, select, create_engine
from app.models.models import Genre
from app.core.config import settings

# Setup Sync Engine
# We use replace to switch from async driver to default sync driver for this script
SYNC_DATABASE_URL = settings.DATABASE_URL.replace("postgresql+asyncpg", "postgresql")
engine = create_engine(SYNC_DATABASE_URL)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

GENRES_DATA = [
    {"name": "Fantasy", "description": "Magic, supernatural elements, and imaginary worlds."},
    {"name": "Romance", "description": "Focus on romantic love relationships."},
    {"name": "Sci-Fi", "description": "Futuristic concepts, advanced science, and space exploration."},
    {"name": "Slice of Life", "description": "Realistic representation of everyday life experiences."},
    {"name": "Action", "description": "Physical challenges, movement, and high-energy conflicts."},
    {"name": "Thriller", "description": "Suspense, excitement, and anticipation."},
    {"name": "Historical", "description": "Settings and events from the past."},
    {"name": "Comedy", "description": "Humor and amusing situations."},
    {"name": "Mystery", "description": "Solving a crime or uncovering a secret."},
    {"name": "Horror", "description": "Intended to frighten, scare, or disgust."},
    {"name": "Variety", "description": "Entertainment focused on humor, games, and unscripted situations."},
    {"name": "Documentary", "description": "Factual record or report on a particular subject."},
]

def init_genres():
    with Session(engine) as session:
        for data in GENRES_DATA:
            genre_name = data["name"]
            statement = select(Genre).where(Genre.name == genre_name)
            existing_genre = session.exec(statement).first()

            if not existing_genre:
                logger.info(f"Creating genre: {genre_name}")
                genre = Genre(name=genre_name, description=data["description"])
                session.add(genre)
            else:
                logger.info(f"Genre already exists: {genre_name}")
        
        session.commit()
    logger.info("Genre initialization completed.")

if __name__ == "__main__":
    init_genres()
