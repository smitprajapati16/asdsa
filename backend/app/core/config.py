"""Application configuration settings for WindScope."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central configuration for WindScope backend."""

    # Application Branding & Metadata
    APP_NAME: str = "WindScope — UK Wind Forecast Intelligence"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Elexon BMRS Insights Solution API Base URL
    ELEXON_BASE_URL: str = "https://data.elexon.co.uk/bmrs/api/v1"

    # Default Evaluation Scope (Strictly January 2026)
    DEFAULT_START_DATE: str = "2026-01-01"
    DEFAULT_END_DATE: str = "2026-01-31"

    # Default Purchasing Decision Cutoff Assumption
    # Standard UK Balancing Mechanism Gate Closure is 1 hour before delivery
    DEFAULT_CUTOFF_PRESET: str = "gate_closure"
    DEFAULT_CUTOFF_HOURS: float = 1.0

    # In-memory Cache TTL in seconds (10 minutes)
    CACHE_TTL_SECONDS: int = 600

    # CORS Origins
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "*"
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )


settings = Settings()
