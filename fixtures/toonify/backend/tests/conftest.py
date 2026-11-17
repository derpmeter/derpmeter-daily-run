import os

import pytest

from tests import lab_env  # noqa: F401  (must load before the app)
from tests.lab_env import FakeGemini


@pytest.fixture()
def client():
    from fastapi.testclient import TestClient
    from sqlmodel import SQLModel

    from app.db.engine import engine
    from app.main import app

    engine.echo = False

    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)
    FakeGemini.fail = False
    FakeGemini.reply = "{}"
    FakeGemini.calls.clear()
    with TestClient(app) as c:
        yield c


def signup(client, email="writer@example.com", password="Sup3r-secret!"):
    """Signs a user up and returns auth headers."""
    r = client.post("/api/v1/auth/signup", json={"email": email, "password": password, "username": email.split("@")[0]})
    assert r.status_code == 200, r.text
    r = client.post("/api/v1/auth/login/access-token", data={"username": email, "password": password})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}
