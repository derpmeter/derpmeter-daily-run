import io
import os
from abc import ABC, abstractmethod
from minio import Minio
from minio.error import S3Error
from app.core.config import settings
import uuid

class StorageService(ABC):
    @abstractmethod
    def upload_image(self, image_data: bytes, schema: str, identifier: str, content_type: str = "image/png") -> str:
        """
        Uploads image to {schema}/{identifier}/{uuid}.png
        Returns relative path: {schema}/{identifier}/{uuid}.png
        """
        pass
    
    @abstractmethod
    def download_image(self, relative_path: str) -> bytes | None:
        """
        Downloads image from storage by relative path.
        Returns image bytes or None if not found.
        """
        pass

class MinIOStorage(StorageService):
    def __init__(self):
        # Initialize MinIO client
        self.client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE
        )
        self.bucket_name = settings.MINIO_BUCKET
        self._ensure_bucket_exists()

    def _ensure_bucket_exists(self):
        try:
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
                # Set public policy for read access (simplified for MVP)
                policy = '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"AWS":["*"]},"Action":["s3:GetObject"],"Resource":["arn:aws:s3:::%s/*"]}]}' % self.bucket_name
                self.client.set_bucket_policy(self.bucket_name, policy)
        except S3Error as e:
            print(f"Error checking/creating bucket: {e}")

    def upload_image(self, image_data: bytes, schema: str, identifier: str, content_type: str = "image/png") -> str:
        filename = f"{uuid.uuid4()}.png"
        relative_path = f"{schema}/{identifier}/{filename}"
        
        try:
            self.client.put_object(
                self.bucket_name,
                relative_path,
                io.BytesIO(image_data),
                len(image_data),
                content_type=content_type
            )
            # Return ONLY relative path as requested
            return relative_path
        except S3Error as e:
            print(f"Error uploading file: {e}")
            raise e
    
    def download_image(self, relative_path: str) -> bytes | None:
        try:
            response = self.client.get_object(self.bucket_name, relative_path)
            data = response.read()
            response.close()
            response.release_conn()
            return data
        except S3Error as e:
            print(f"Error downloading file from MinIO: {e}")
            return None

class GCSStorage(StorageService):
    def __init__(self):
        from google.cloud import storage
        self.client = storage.Client()
        # Use MINIO_BUCKET for consistency with config (same bucket name var)
        self.bucket_name = settings.MINIO_BUCKET or os.getenv("GCS_BUCKET_NAME", "toonify-prod-assets")
        self.bucket = self.client.bucket(self.bucket_name)

    def upload_image(self, image_data: bytes, schema: str, identifier: str, content_type: str = "image/png") -> str:
        filename = f"{uuid.uuid4()}.png"
        relative_path = f"{schema}/{identifier}/{filename}"
        
        blob = self.bucket.blob(relative_path)
        blob.upload_from_string(image_data, content_type=content_type)
        # Assuming bucket is public or we use signed URLs (public for now based on MinIO logic)
        # Note: Bucket must be configured to be public readable
        return relative_path
    
    def download_image(self, relative_path: str) -> bytes | None:
        try:
            blob = self.bucket.blob(relative_path)
            return blob.download_as_bytes()
        except Exception as e:
            print(f"Error downloading file from GCS: {e}")
            return None

def get_storage_service() -> StorageService:
    # Use STORAGE_TYPE env var (gcs, minio, or local)
    storage_type = os.getenv("STORAGE_TYPE", "minio").lower()
    if storage_type == "gcs":
        return GCSStorage()
    return MinIOStorage()

storage = get_storage_service()
