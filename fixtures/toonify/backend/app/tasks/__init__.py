# Background Tasks Module
# Centralized background task functions for various domain operations

from app.tasks.episode_tasks import (
    generate_episode_cuts_task,
    generate_cut_task,
    generate_episode_images_sequentially,
)

from app.tasks.character_tasks import (
    generate_character_image_task,
)

from app.tasks.project_tasks import (
    generate_project_cover_task,
    generate_suggestions_bg_task,
)

__all__ = [
    # Episode Tasks
    "generate_episode_cuts_task",
    "generate_cut_task",
    "generate_episode_images_sequentially",
    # Character Tasks
    "generate_character_image_task",
    # Project Tasks
    "generate_project_cover_task",
    "generate_suggestions_bg_task",
]
