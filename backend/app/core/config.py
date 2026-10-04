import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "GPS Based Attendance & Tracking Application - Adani Smart Meter Project"
    API_V1_STR: str = "/api"
    
    # MongoDB Atlas settings
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb+srv://admin:password@cluster0.mongodb.net/?retryWrites=true&w=majority")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "adani_smart_meter_db")
    
    # JWT & Auth
    JWT_SECRET: str = os.getenv("JWT_SECRET", "adani-smart-meter-production-grade-jwt-secret-key-987654321")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Mappls API
    MAPPLS_API_KEY: str = os.getenv("MAPPLS_API_KEY", "")
    
    # CORS
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173")
    
    # Server port
    PORT: int = int(os.getenv("PORT", 8000))
    
    # Operational site constraints
    HOST: str = "127.0.0.1"
    DEFAULT_GEOFENCE_RADIUS_METERS: int = 500
    MAX_ALLOWED_ACCURACY_METERS: int = 50
    DEFAULT_SITE_NAME: str = "Pune - Phase 1"
    DEFAULT_SITE_CODE: str = "ADN-PS-001"
    DEFAULT_SITE_LAT: float = 18.5204
    DEFAULT_SITE_LNG: float = 73.8567

    @property
    def cors_origins(self) -> List[str]:
        origins = [url.strip() for url in self.FRONTEND_URL.split(",") if url.strip()]
        if "*" not in origins:
            origins.append("*")
        return origins

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

settings = Settings()
