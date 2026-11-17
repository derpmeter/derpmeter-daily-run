from typing import List, Union
from pydantic import AnyHttpUrl, validator
from pydantic_settings import BaseSettings
import os
import sys

class Settings(BaseSettings):
    PROJECT_NAME: str
    API_V1_STR: str
    DEBUG: bool
    
    # CORS
    BACKEND_CORS_ORIGINS: Union[List[str], str] = []
    SECRET_KEY: str

    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # Database
    POSTGRES_SERVER: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    DATABASE_URL: str | None = None

    @validator("DATABASE_URL", pre=True)
    def assemble_db_connection(cls, v: str | None, values: dict[str, any]) -> str:
        if isinstance(v, str):
            return v
        return str(
            f"postgresql+asyncpg://{values.get('POSTGRES_USER')}:{values.get('POSTGRES_PASSWORD')}@"
            f"{values.get('POSTGRES_SERVER')}/{values.get('POSTGRES_DB')}"
        )

    # MinIO (optional for GCS)
    MINIO_ENDPOINT: str | None = None
    MINIO_ACCESS_KEY: str | None = None
    MINIO_SECRET_KEY: str | None = None
    MINIO_BUCKET: str = "toonify-prod-assets"
    MINIO_SECURE: bool = False
    
    # Storage Host (Global)
    STORAGE_HOST: str | None = None

    @validator("STORAGE_HOST", pre=True, always=True)
    def assemble_storage_host(cls, v: str | None, values: dict[str, any]) -> str:
        if isinstance(v, str) and v:
            return v.rstrip("/")
        # Fallback to MinIO endpoint if not set
        base_url = values.get("MINIO_ENDPOINT")
        secure = values.get("MINIO_SECURE", False)
        bucket = values.get("MINIO_BUCKET")
        protocol = "https" if secure else "http"
        # If base_url, assume it points to root host, we append bucket later?
        # WAIT: storage.py logic currently is: http://{MINIO_ENDPOINT}/{bucket_name}/{filename}
        # So host is http://{MINIO_ENDPOINT}
        return f"{protocol}://{base_url}/{bucket}"

    # AI
    GEMINI_API_KEY: str
    GOOGLE_CLOUD_PROJECT: str
    GOOGLE_CLOUD_LOCATION: str

    class Config:
        case_sensitive = True
        env_file = ".env.local"
        # Allow missing .env.local for Cloud Run deployment (uses env vars)
        env_file_encoding = 'utf-8'
        extra = 'ignore'

settings = Settings()
