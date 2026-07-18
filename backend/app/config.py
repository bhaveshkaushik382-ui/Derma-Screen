"""
DermaScreen Backend — Configuration
Loads settings from .env file using pydantic-settings pattern.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from the backend directory
BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BACKEND_DIR / ".env", override=True)


class Settings:
    """Application settings loaded from environment variables."""

    # Supabase
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", "")

    # Firebase
    FIREBASE_SERVICE_ACCOUNT_PATH: str = os.getenv(
        "FIREBASE_SERVICE_ACCOUNT_PATH", ""
    )

    # OpenRouter
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    OPENROUTER_MODEL: str = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini")

    # ML Model
    ML_MODEL_PATH: str = os.getenv("ML_MODEL_PATH", "models/model.pth")
    IMAGE_QUALITY_MODEL_PATH: str = os.getenv("IMAGE_QUALITY_MODEL_PATH", "models/image_quality.pkl")
    GRAD_CAM_MODEL_PATH: str = os.getenv("GRAD_CAM_MODEL_PATH", "models/grad_cam.pkl")

    # Server
    BACKEND_PORT: int = int(os.getenv("BACKEND_PORT", "8000"))
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

    def get_firebase_account_path(self) -> Path:
        """Returns absolute path to Firebase service account JSON."""
        path = Path(self.FIREBASE_SERVICE_ACCOUNT_PATH)
        if not path.is_absolute():
            path = BACKEND_DIR / path
        return path

    def get_ml_model_path(self) -> Path:
        """Returns absolute path to ML model file."""
        path = Path(self.ML_MODEL_PATH)
        if not path.is_absolute():
            path = BACKEND_DIR / path
        return path

    def get_image_quality_model_path(self) -> Path:
        """Returns absolute path to image quality config pickle."""
        path = Path(self.IMAGE_QUALITY_MODEL_PATH)
        if not path.is_absolute():
            path = BACKEND_DIR / path
        return path

    def get_grad_cam_model_path(self) -> Path:
        """Returns absolute path to GradCAM model pickle."""
        path = Path(self.GRAD_CAM_MODEL_PATH)
        if not path.is_absolute():
            path = BACKEND_DIR / path
        return path


settings = Settings()

