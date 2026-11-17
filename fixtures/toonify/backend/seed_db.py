from sqlmodel import Session, select, SQLModel
from app.api.deps import engine
from app.models.models import User, Workspace, WorkspaceMember
from app.core.security import get_password_hash

def seed():
    # Ensure tables exist
    SQLModel.metadata.create_all(engine)
    
    try:
        with Session(engine) as session:
            user = session.exec(select(User).where(User.email == "test@example.com")).first()
            if not user:
                print("Seeding test user...")
                hashed_pw = get_password_hash("password")
                user = User(email="test@example.com", password_hash=hashed_pw)
                session.add(user)
                session.commit()
                session.refresh(user)
                
                # Create default workspace
                workspace = Workspace(name="Test Workspace", owner_id=user.id, credits=10000)
                session.add(workspace)
                session.commit()
                session.refresh(workspace)
                
                # Link member
                member = WorkspaceMember(workspace_id=workspace.id, user_id=user.id, role="owner")
                session.add(member)
                session.commit()
                print("Test user seeded successfully.")
            else:
                print("Test user already exists.")
                # Reset password just in case
                hashed_pw = get_password_hash("password")
                user.password_hash = hashed_pw
                session.add(user)
                session.commit()
                session.refresh(user) # Ensure we have latest state
                print("Password reset to 'password'.")

            # Seed Genres
            from app.models.models import Genre
            genres = [
                "Fantasy", "Sci-Fi", "Romance", "Slice of Life", "Thriller", 
                "Action", "Comedy", "Horror", "Drama", "Mystery", "Documentary", "Variety"
            ]
            genre_map = {}
            for g_name in genres:
                genre = session.exec(select(Genre).where(Genre.name == g_name)).first()
                if not genre:
                    print(f"DEBUG: Genre '{g_name}' NOT found. Creating...")
                    genre = Genre(name=g_name, description=f"{g_name} genre")
                    session.add(genre)
                    session.commit()
                    session.refresh(genre)
                    print(f"Created Genre: {g_name}")
                else:
                    print(f"DEBUG: Genre '{g_name}' found (ID: {genre.id}). Skipping.")
                genre_map[g_name] = genre

            # Check for Test Project
            from app.models.models import Project, Episode
            project = session.exec(select(Project).where(Project.title == "Director AI Test")).first()
            if not project:
                # Need workspace id
                workspace = session.exec(select(Workspace).where(Workspace.owner_id == user.id)).first()
                if not workspace:
                     workspace = Workspace(name="Test Workspace", owner_id=user.id, credits=10000)
                     session.add(workspace)
                     session.commit()
                     session.refresh(workspace)
                
                # Enforce 10000 credits for test account
                if workspace.credits < 10000:
                    workspace.credits = 10000
                    session.add(workspace)
                    session.commit()
                    session.refresh(workspace)
                    print("Enforced 10000 credits for Test Workspace")
                
                # Use Fantasy as default for test project
                default_genre_id = genre_map.get("Fantasy").id if "Fantasy" in genre_map else None

                project = Project(
                    title="Director AI Test", 
                    workspace_id=workspace.id, 
                    owner_id=user.id, 
                    style_preset="anime_webtoon"
                )
                session.add(project)
                session.commit()
                session.refresh(project)
            
            # Check for Episode
            episode = session.exec(select(Episode).where(Episode.project_id == project.id)).first()
            if not episode:
                episode = Episode(project_id=project.id, title="Ep1: The Start", episode_order=1, story_summary="Test")
                session.add(episode)
                session.commit()
                session.refresh(episode)
                print(f"Created Test Episode: {episode.id}")
            
            print(f"TEST_URL=http://localhost:3000/project/{project.id}/editor")

    except Exception as e:
        print(f"Seeding failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    seed()
