"""Application settings via pydantic-settings."""

from functools import lru_cache

from pydantic_settings import (
    BaseSettings,
    PydanticBaseSettingsSource,
    SettingsConfigDict,
)


class Settings(BaseSettings):
    """Bloom & Bliss backend settings.

    NOTE on source priority: the sandbox shell exports a stale global
    ``DATABASE_URL`` (SQLite) which would normally override the .env file.
    We therefore put dotenv values AHEAD of process env vars — .env is the
    single source of truth for this service.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # --- Database ---
    database_url: str
    # SQLite fallback: directory holding one <schema>.db file per schema.
    sqlite_dir: str = "/home/z/my-project/db/fastapi"

    # --- JWT ---
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 720

    # --- Admin bootstrap (used by scripts/seed.py) ---
    admin_email: str = "admin@bloombliss.test"
    admin_password: str = "Admin@12345"
    admin_name: str = "Site Admin"

    # --- S3-compatible object storage ---
    # Primary: Cloudflare R2 (user-confirmed bucket "priyoupohar").
    s3_endpoint: str = "https://s3.filebase.io"
    s3_region: str = "auto"
    s3_access_key_id: str = ""
    s3_secret_access_key: str = ""
    s3_bucket: str = "priyoupohar"

    # Secondary fallback (Filebase): tried automatically when the primary
    # PUT fails, before resorting to the local disk.
    s3_fallback_endpoint: str = ""
    s3_fallback_region: str = "auto"
    s3_fallback_access_key_id: str = ""
    s3_fallback_secret_access_key: str = ""
    s3_fallback_bucket: str = ""

    # Local fallback store for uploads when S3 is unavailable; also served
    # publicly via GET /api/media/{key}.
    media_dir: str = "/home/z/my-project/db/fastapi/media"

    # --- CORS ---
    cors_origins: str = "*"

    @classmethod
    def settings_customise_sources(
        cls,
        settings_cls: type[BaseSettings],
        init_settings: PydanticBaseSettingsSource,
        env_settings: PydanticBaseSettingsSource,
        dotenv_settings: PydanticBaseSettingsSource,
        file_secret_settings: PydanticBaseSettingsSource,
    ) -> tuple[PydanticBaseSettingsSource, ...]:
        """Priority: init > dotenv > process env > secrets (.env wins)."""
        return (init_settings, dotenv_settings, env_settings, file_secret_settings)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
