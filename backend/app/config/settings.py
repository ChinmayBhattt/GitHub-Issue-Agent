"""Application configuration using Pydantic Settings."""
from pathlib import Path
from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuration settings for GitHub Issue Resolution Agent."""
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # API Keys & Auth
    GEMINI_API_KEY: str = Field(default="", description="Google Gemini API Key")
    GEMINI_MODEL: str = Field(default="gemini-2.5-flash", description="Gemini model name")
    GITHUB_TOKEN: str = Field(default="", description="GitHub Personal Access Token or App Token")
    GITHUB_WEBHOOK_SECRET: str = Field(default="", description="GitHub Webhook HMAC Secret")

    # Storage & Workspace Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    DATA_DIR: Path = BASE_DIR / "data"
    WORKSPACE_BASE_DIR: Path = BASE_DIR / "workspaces"

    # Execution & Safety Limits
    MAX_TEST_TIMEOUT_SECONDS: int = Field(default=120, description="Max test execution timeout")
    MAX_OUTPUT_BYTES: int = Field(default=102400, description="Max output size in bytes (100KB)")
    MAX_FIX_ATTEMPTS: int = Field(default=3, description="Max test-driven fix attempts")
    AUTONOMOUS_MODE: bool = Field(default=False, description="Whether to auto-create PR without human approval")

    # Command Execution Allowlist
    ALLOWED_TEST_COMMANDS: List[str] = Field(
        default=[
            "pytest",
            "python -m pytest",
            "python -m unittest",
            "python3 -m pytest",
            "python3 -m unittest",
            "npm test",
            "npm run test",
            "yarn test",
            "pnpm test",
            "cargo test",
            "go test ./...",
        ],
        description="Strictly allowed test commands"
    )

    # CORS
    CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "http://127.0.0.1:3000"],
        description="Allowed CORS origins"
    )


settings = Settings()

# Ensure directories exist
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
settings.WORKSPACE_BASE_DIR.mkdir(parents=True, exist_ok=True)

