from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file="../.env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = "postgresql+asyncpg://datavision:datavision@localhost:5432/datavision"
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    debug: bool = True
    anthropic_api_key: str = ""
    vision_dir: str = "../vision"


settings = Settings()
