import os
import re
import time
import base64
import logging
from typing import Tuple, Optional, Dict, Any
from app.core.config import settings

logger = logging.getLogger("uvicorn")

class CloudStorageService:
    def __init__(self):
        self._gcs_client = None
        self._bucket = None
        self.bucket_name = settings.GCS_BUCKET_NAME
        self.project_id = settings.GOOGLE_CLOUD_PROJECT
        self.is_gcs_active = False

        # Local directory fallback
        self.backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        self.local_upload_dir = os.path.join(self.backend_dir, "uploads", "attendance")
        os.makedirs(self.local_upload_dir, exist_ok=True)

    def _get_bucket(self):
        """Lazily connects to Google Cloud Storage bucket."""
        if self._bucket is not None:
            return self._bucket

        # Check if Google Cloud bucket or environment is designated
        target_bucket = self.bucket_name or os.getenv("GCS_BUCKET_NAME") or os.getenv("GOOGLE_CLOUD_STORAGE_BUCKET")
        is_cloud_env = bool(os.getenv("K_SERVICE") or os.getenv("GAE_APPLICATION"))

        if not target_bucket and not is_cloud_env:
            return None

        try:
            from google.cloud import storage
            if not self._gcs_client:
                self._gcs_client = storage.Client(project=self.project_id)
            
            b_name = target_bucket or f"{self.project_id or 'adani'}-attendance-photos"
            self._bucket = self._gcs_client.bucket(b_name)
            self.bucket_name = b_name
            self.is_gcs_active = True
            logger.info(f"Connected to Google Cloud Storage bucket: {self.bucket_name}")
            return self._bucket
        except Exception as e:
            logger.info(f"GCS connection notice ({e}). Operating in container storage mode.")
            return None

    def save_photo(self, employee_id: str, photo_base64: str) -> Dict[str, Any]:
        """
        Saves a base64 encoded photo to Google Cloud Storage (or local storage fallback).
        Returns a dictionary with:
        {
            "photoUrl": str,
            "storageType": "gcs" | "local",
            "gcsBlobName": Optional[str],
            "localPath": Optional[str]
        }
        """
        if not photo_base64 or not isinstance(photo_base64, str) or not photo_base64.strip():
            return {"photoUrl": None, "storageType": None, "gcsBlobName": None, "localPath": None}

        # Parse base64
        if "," in photo_base64:
            _, clean_b64 = photo_base64.split(",", 1)
        else:
            clean_b64 = photo_base64

        try:
            image_bytes = base64.b64decode(clean_b64)
            if len(image_bytes) == 0:
                return {"photoUrl": None, "storageType": None, "gcsBlobName": None, "localPath": None}
        except Exception as e:
            logger.error(f"Error decoding base64 photo: {e}")
            return {"photoUrl": None, "storageType": None, "gcsBlobName": None, "localPath": None}

        clean_emp = re.sub(r'[^a-zA-Z0-9_-]', '_', employee_id)
        timestamp = int(time.time())
        date_str = time.strftime("%Y%m%d")
        filename = f"emp_{clean_emp}_{date_str}_{timestamp}.jpg"

        # 1. Try Google Cloud Storage
        bucket = self._get_bucket()
        if bucket is not None:
            try:
                blob_name = f"attendance/{filename}"
                blob = bucket.blob(blob_name)
                blob.upload_from_string(image_bytes, content_type="image/jpeg")

                # Build direct Google Cloud Storage URL
                photo_url = f"https://storage.googleapis.com/{self.bucket_name}/{blob_name}"
                logger.info(f"Photo uploaded to Google Cloud Storage: {photo_url}")
                return {
                    "photoUrl": photo_url,
                    "storageType": "gcs",
                    "gcsBlobName": blob_name,
                    "localPath": None
                }
            except Exception as e:
                logger.warning(f"GCS upload attempt failed ({e}). Falling back to container storage.")

        # 2. Local / Server Container Fallback
        local_filepath = os.path.join(self.local_upload_dir, filename)
        with open(local_filepath, "wb") as f:
            f.write(image_bytes)

        photo_url = f"/uploads/attendance/{filename}"
        logger.info(f"Photo saved to container storage: {local_filepath}")
        return {
            "photoUrl": photo_url,
            "storageType": "local",
            "gcsBlobName": None,
            "localPath": local_filepath
        }

    def delete_photo(
        self,
        storage_type: Optional[str] = None,
        gcs_blob_name: Optional[str] = None,
        local_path: Optional[str] = None,
        employee_id: Optional[str] = None,
        date_str: Optional[str] = None
    ) -> bool:
        """
        Permanently deletes the photo from Google Cloud Storage or server disk upon checkout.
        """
        deleted = False

        # 1. Delete from Google Cloud Storage if stored there
        if storage_type == "gcs" or gcs_blob_name:
            bucket = self._get_bucket()
            if bucket is not None and gcs_blob_name:
                try:
                    blob = bucket.blob(gcs_blob_name)
                    if blob.exists():
                        blob.delete()
                        logger.info(f"Permanently deleted photo from Google Cloud Storage: {gcs_blob_name}")
                        deleted = True
                except Exception as e:
                    logger.warning(f"Could not delete blob {gcs_blob_name} from Google Cloud Storage: {e}")

        # 2. Delete from local server path
        if local_path and os.path.exists(local_path):
            try:
                os.remove(local_path)
                logger.info(f"Permanently deleted local photo file: {local_path}")
                deleted = True
            except Exception as e:
                logger.warning(f"Could not delete local file {local_path}: {e}")

        # 3. Sweep any matching leftovers for employee + date prefix
        if employee_id and os.path.exists(self.local_upload_dir):
            clean_emp = re.sub(r'[^a-zA-Z0-9_-]', '_', employee_id)
            clean_date = (date_str or "").replace("-", "")
            prefix = f"emp_{clean_emp}_{clean_date}" if clean_date else f"emp_{clean_emp}_"
            for fname in os.listdir(self.local_upload_dir):
                if fname.startswith(prefix):
                    fpath = os.path.join(self.local_upload_dir, fname)
                    try:
                        if os.path.exists(fpath):
                            os.remove(fpath)
                            deleted = True
                    except Exception:
                        pass

        return deleted

cloud_storage_service = CloudStorageService()
