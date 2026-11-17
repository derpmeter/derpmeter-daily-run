# Reload trigger
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.errors import AppException
from app.api.v1.api import api_router
from app.core.logging import configure_logging, get_logger
from app.core.middleware import LoggingMiddleware

from contextlib import asynccontextmanager

# Configure structured logging for Google Cloud
configure_logging(project_id=settings.GOOGLE_CLOUD_PROJECT, debug=settings.DEBUG)
logger = get_logger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Init DB
    from sqlmodel import Session, select, SQLModel, text
    from app.api.deps import engine
    from app.models.models import User, Workspace, WorkspaceMember, ProjectTemplate
    from app.core.security import get_password_hash
    
    # Enable pgvector extension
    try:
        with Session(engine) as session:
            session.exec(text("CREATE EXTENSION IF NOT EXISTS vector"))
            session.commit()
    except Exception as e:
        logger.warning("Could not enable pgvector extension", error=str(e))

    # Create tables if they don't exist
    SQLModel.metadata.create_all(engine)
    
    try:
        with Session(engine) as session:
            user = session.exec(select(User).where(User.email == "test@example.com")).first()
            if not user:
                logger.info("Seeding test user...")
                hashed_pw = get_password_hash("password")
                user = User(email="test@example.com", password_hash=hashed_pw)
                session.add(user)
                session.commit()
                session.refresh(user)
                
                # Create default workspace
                workspace = Workspace(name="Test Workspace", owner_id=user.id)
                session.add(workspace)
                session.commit()
                session.refresh(workspace)
                
                # Link member
                member = WorkspaceMember(workspace_id=workspace.id, user_id=user.id, role="owner")
                session.add(member)
                session.commit()
                logger.info("Test user seeded", email="test@example.com")
            else:
                logger.info("Test user already exists")
    except Exception as e:
        logger.error("Seeding failed", error=str(e))
        
    yield
    # Shutdown logic if needed

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

app.include_router(api_router, prefix=settings.API_V1_STR)


# Custom exception handler for AppException to include error code
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "code": exc.error_code.value,
            "detail": exc.detail,
            "extra": exc.extra,
        },
        headers={"WWW-Authenticate": "Bearer"} if exc.status_code == 401 else None,
    )


# Set all CORS enabled origins
# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for dev debugging
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

# Add logging middleware for structured request/response logging
app.add_middleware(LoggingMiddleware)

# if settings.BACKEND_CORS_ORIGINS:
#     app.add_middleware(
#         CORSMiddleware,
#         allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
#         allow_credentials=True,
#         allow_methods=["*"],
#         allow_headers=["*"],
#     )

@app.get("/")
def root():
    return {"message": "Welcome to Toonify API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
