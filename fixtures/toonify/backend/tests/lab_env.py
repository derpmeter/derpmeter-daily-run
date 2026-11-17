"""Offline test environment: SQLite instead of Postgres, in-memory fakes
for MinIO and the Gemini client. Imported by conftest.py before the app."""
import os
import sys
import types
import uuid

BACKEND = os.environ.get("TOONIFY_BACKEND") or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND not in sys.path:
    sys.path.insert(0, BACKEND)

ENV = {
    "API_V1_STR": "/api/v1",
    "PROJECT_NAME": "Toonify",
    "DEBUG": "false",
    "SECRET_KEY": "test-secret",
    "POSTGRES_SERVER": "unused",
    "POSTGRES_USER": "unused",
    "POSTGRES_PASSWORD": "unused",
    "POSTGRES_DB": "unused",
    "MINIO_ENDPOINT": "minio.invalid:9000",
    "MINIO_ACCESS_KEY": "test",
    "MINIO_SECRET_KEY": "test",
    "GEMINI_API_KEY": "test",
    "GOOGLE_CLOUD_PROJECT": "test",
    "GOOGLE_CLOUD_LOCATION": "global",
}
for k, v in ENV.items():
    os.environ.setdefault(k, v)
os.environ.setdefault("DATABASE_URL", "sqlite:///" + os.path.join(BACKEND, ".test.db"))

# SQLite stores UUID columns as text; the app passes ids as strings in places
# (Postgres accepts both), so accept strings here too.
from sqlalchemy.sql import sqltypes  # noqa: E402

_bind = sqltypes.Uuid.bind_processor


def _uuid_bind(self, dialect):
    inner = _bind(self, dialect)
    if inner is None:
        return None
    return lambda v: inner(uuid.UUID(v) if isinstance(v, str) else v)


sqltypes.Uuid.bind_processor = _uuid_bind


class FakeMinio:
    """Keeps objects in memory: {bucket: {name: bytes}}."""

    objects = {}

    def __init__(self, *args, **kwargs):
        pass

    def bucket_exists(self, bucket):
        return bucket in self.objects

    def make_bucket(self, bucket):
        self.objects.setdefault(bucket, {})

    def set_bucket_policy(self, bucket, policy):
        pass

    def put_object(self, bucket, name, data, length=-1, content_type=None, **kw):
        self.objects.setdefault(bucket, {})[name] = data.read()

    def get_object(self, bucket, name):
        body = self.objects.get(bucket, {}).get(name)
        if body is None:
            raise FakeS3Error("NoSuchKey")
        return types.SimpleNamespace(read=lambda: body, close=lambda: None, release_conn=lambda: None)

    def remove_object(self, bucket, name):
        self.objects.get(bucket, {}).pop(name, None)


class FakeS3Error(Exception):
    pass


minio = types.ModuleType("minio")
minio.Minio = FakeMinio
minio_error = types.ModuleType("minio.error")
minio_error.S3Error = FakeS3Error
minio.error = minio_error
sys.modules["minio"] = minio
sys.modules["minio.error"] = minio_error


class FakeGemini:
    """Answers every text request with `reply` and every image request with a
    1x1 PNG. Set `fail = True` to make every call raise."""

    reply = "{}"
    fail = False
    calls = []

    def __init__(self, *args, **kwargs):
        self.models = self
        self.aio = types.SimpleNamespace(models=self)
        self.caches = types.SimpleNamespace(create=lambda **kw: types.SimpleNamespace(name="cache"))

    def generate_content(self, model=None, contents=None, config=None, **kw):
        FakeGemini.calls.append(model)
        if FakeGemini.fail:
            raise RuntimeError("Gemini is unavailable")
        part = types.SimpleNamespace(text=FakeGemini.reply, inline_data=types.SimpleNamespace(data=PNG, mime_type="image/png"))
        content = types.SimpleNamespace(parts=[part])
        return types.SimpleNamespace(text=FakeGemini.reply, candidates=[types.SimpleNamespace(content=content)], parts=[part])

    def embed_content(self, *args, **kwargs):
        return types.SimpleNamespace(embeddings=[types.SimpleNamespace(values=[0.0] * 8)])


PNG = bytes.fromhex(
    "89504e470d0a1a0a0000000d4948445200000001000000010806000000"
    "1f15c4890000000d49444154789c63f8ffffff7f0009fb03fd2a86e38a"
    "0000000049454e44ae426082"
)

from google import genai  # noqa: E402

genai.Client = FakeGemini
