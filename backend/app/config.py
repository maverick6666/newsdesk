from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://newsdesk:newsdesk_dev_2026@localhost:5432/newsdesk"

    # Security
    secret_key: str = "dev-secret-key-change-in-production"

    # Ollama
    ollama_host: str = "http://host.docker.internal:11434"
    ollama_model: str = "qwen3:14b"

    # MarketAux API
    marketaux_api_key: str = ""

    # Naver API
    naver_client_id: str = ""
    naver_client_secret: str = ""

    # Scheduler
    scheduler_enabled: bool = False

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
