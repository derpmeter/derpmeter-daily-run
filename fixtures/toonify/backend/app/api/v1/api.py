from fastapi import APIRouter
from app.api.v1.endpoints import auth, projects, episodes, ai, characters, cuts, scenes, clues, workspaces, templates, assets, project_workflow, genres, styles, users

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(episodes.router, prefix="/episodes", tags=["episodes"])
api_router.include_router(cuts.router, prefix="/cuts", tags=["cuts"])
api_router.include_router(characters.router, prefix="/characters", tags=["characters"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(scenes.router, prefix="/scenes", tags=["scenes"])
api_router.include_router(clues.router, prefix="/clues", tags=["clues"])
api_router.include_router(workspaces.router, prefix="/workspaces", tags=["workspaces"])
api_router.include_router(templates.router, prefix="/templates", tags=["templates"])
api_router.include_router(assets.router, prefix="/assets", tags=["assets"])
api_router.include_router(genres.router, prefix="/genres", tags=["genres"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(styles.router, prefix="/styles", tags=["styles"])
api_router.include_router(project_workflow.router, prefix="", tags=["workflow"])
