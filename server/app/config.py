from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Environment
    env: str = "dev"

    # Server
    server_port: int = Field(default=4010, ge=1, le=65535)

    # CORS
    cors_origins: str = "http://localhost:4010,http://localhost:8080,http://localhost:3000"

    # Search provider API keys
    brave_api_key: str = ""
    serper_api_key: str = ""
    serpapi_api_key: str = ""
    tavily_api_key: str = ""
    exa_api_key: str = ""
    tinyfish_api_key: str = ""

    # ElevenLabs TTS
    elevenlabs_api_key: str = ""
    elevenlabs_voice_id: str = "JBFqnCBsd6RMkjVDRZzb"  # "George" — clear, professional
    elevenlabs_model_id: str = "eleven_multilingual_v2"
    elevenlabs_agent_id: str = "agent_6401kmsfvaceec8s2rzd2btgpbrw"

    # OpenAI LLM-as-Judge
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"

    # Results storage
    results_dir: str = "./results"

    # Runner defaults
    default_top_k: int = Field(default=10, ge=1, le=100)
    request_timeout: float = Field(default=30.0, gt=0)
    tinyfish_timeout: float = Field(default=600.0, gt=0)
    max_concurrency: int = Field(default=5, ge=1, le=50)


settings = Settings()
