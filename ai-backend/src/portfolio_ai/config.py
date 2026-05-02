"""Pydantic-settings config — reads from ai-backend/.env"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Anthropic
    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_MODEL: str = "claude-sonnet-4-6"

    # Langfuse
    LANGFUSE_PUBLIC_KEY: str = ""
    LANGFUSE_SECRET_KEY: str = ""
    LANGFUSE_HOST: str = "http://127.0.0.1:3001"
    LANGFUSE_BASE_URL: str = "http://127.0.0.1:3001"
    LANGFUSE_ORGANIZATION_NAME: str = "PortfolioGPS"
    LANGFUSE_PROJECT_NAME: str = "PortfolioGPS"

    # Tavily
    TAVILY_API_KEY: str = ""

    # FRED macro data
    FRED_API_KEY: str = ""

    # Server
    PORT: int = 8001
    LOG_LEVEL: str = "info"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
