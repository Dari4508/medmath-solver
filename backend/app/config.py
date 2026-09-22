from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "dev"
    app_version: str = "1.1.0"
    default_lang: str = "es"
    secret_key: str = "change-me-in-production"
    database_url: str = "sqlite:///./medmath.db"
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    rate_limit_storage: str = "memory://"
    rate_limit: str = "30/minute"
    expected_tolerance: float = 1e-6

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
