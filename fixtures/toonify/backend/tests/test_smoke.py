from tests.conftest import signup


def test_signup_creates_a_workspace_with_credits(client):
    h = signup(client)
    workspaces = client.get("/api/v1/workspaces", headers=h).json()
    assert len(workspaces) == 1
    assert workspaces[0]["credits"] == 500


def test_projects_are_listed_for_their_workspace(client):
    h = signup(client)
    r = client.post("/api/v1/projects", headers=h, json={"title": "Night Bus", "genres": []})
    assert r.status_code == 200, r.text
    titles = [p["title"] for p in client.get("/api/v1/projects", headers=h).json()]
    assert titles == ["Night Bus"]


def test_requests_without_a_token_are_refused(client):
    assert client.get("/api/v1/projects").status_code == 401
