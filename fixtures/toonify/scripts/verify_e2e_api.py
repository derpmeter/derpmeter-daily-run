import requests
import sys

BASE_URL = "http://localhost:8000/api/v1"
EMAIL = "test@example.com"
PASSWORD = "password"

def run():
    session = requests.Session()
    
    # 1. Login
    print(f"Logging in as {EMAIL}...")
    try:
        resp = session.post(f"{BASE_URL}/auth/login/access-token", data={"username": EMAIL, "password": PASSWORD})
        if resp.status_code != 200:
            print(f"Login Failed: {resp.status_code} {resp.text}")
            return
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("Login Successful.")
    except Exception as e:
        print(f"Connection Error: {e}")
        return

    # 2. Get Templates (Public)
    print("Fetching Templates...")
    resp = session.get(f"{BASE_URL}/templates/", headers=headers)
    print(f"Templates Status: {resp.status_code}")

    # 3. Create Project
    print("Creating Project 'API Verification Project'...")
    payload = {
        "title": "API Verification Project",
        "subtitle": "Created by Script",
        "genre": "Sci-Fi",
        "style_preset": "anime_webtoon"
    }
    # Note: Worldview augmentation is separate step usually, but create_project allows optional worldview.
    # We will test without explicit worldview first to ensure basic creation works.
    
    resp = session.post(f"{BASE_URL}/projects/", json=payload, headers=headers)
    if resp.status_code != 200:
        print(f"Create Project Failed: {resp.status_code} {resp.text}")
        return
    
    project = resp.json()
    project_id = project["id"]
    print(f"Project Created: ID={project_id}, Title={project['title']}")

    # 4. Augment Worldview (Test AI Mock)
    print("Testing Worldview Augmentation (Mock)...")
    augment_payload = {
        "description": "A cyberpunk city.",
        "title": "API Verification Project",
        "subtitle": "Test",
        "genres": ["Sci-Fi"]
    }
    resp = session.post(f"{BASE_URL}/projects/worldview/augment", json=augment_payload, headers=headers)
    if resp.status_code != 200:
        print(f"Augment Failed: {resp.status_code} {resp.text}")
    else:
        print("Augment Result (Expect Mock):")
        print(resp.json())

    # 5. List Projects
    print("Listing Projects...")
    resp = session.get(f"{BASE_URL}/projects/", headers=headers)
    if resp.status_code == 200:
        projects = resp.json()
        found = any(p["id"] == project_id for p in projects)
        print(f"Found created project in list: {found}")
    else:
        print(f"List Projects Failed: {resp.status_code}")

    # 5b. Get Project Detail
    print(f"Fetching Project Detail for {project_id}...")
    resp = session.get(f"{BASE_URL}/projects/{project_id}", headers=headers)
    if resp.status_code == 200:
        print("Get Project Detail Successful.")
        print(resp.json())
    else:
        print(f"Get Project Detail Failed: {resp.status_code} {resp.text}")

    # 6. Generate Episode Options (Test AI Mock)
    print("Testing Episode Options Generation (Mock)...")
    episode_opts = []
    resp = session.post(f"{BASE_URL}/episodes/generate-options?project_id={project_id}", headers=headers)
    if resp.status_code == 200:
        print("Episode Options Generated (Expect Mock):")
        data = resp.json()
        print(data)
        episode_opts = data.get("options", [])
    else:
        print(f"Episode Options Failed: {resp.status_code} {resp.text}")

    if episode_opts:
        print("Testing Initial Cuts Generation (Mock)...")
        # Use first option
        opt = episode_opts[0]
        cuts_payload = {
            "project_id": project_id,
            "title": opt["title"],
            "summary": opt["summary"],
            "style": "anime_webtoon",
            "num_cuts": 4
        }
        resp = session.post(f"{BASE_URL}/episodes/generate-cuts", json=cuts_payload, headers=headers)
        if resp.status_code == 200:
             episode = resp.json()
             episode_id = episode["id"]
             cuts = episode.get("cuts", [])
             print(f"Episode Created: {episode_id}, Cuts: {len(cuts)}")
             
             if cuts:
                 cut_id = cuts[0]["id"]
                 print(f"Testing Cut Image Generation for Cut {cut_id} (Mock)...")
                 resp = session.post(f"{BASE_URL}/episodes/{episode_id}/cuts/{cut_id}/generate-image", headers=headers)
                 if resp.status_code == 200:
                     updated_cut = resp.json()
                     print(f"Image Generated: {updated_cut.get('image_path')}")
                 else:
                     print(f"Cut Image Gen Failed: {resp.status_code} {resp.text}")
        else:
            print(f"Generate Cuts Failed: {resp.status_code} {resp.text}")

    print("Verification Script Completed Successfully.")

if __name__ == "__main__":
    run()
