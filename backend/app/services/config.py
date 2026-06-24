from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "KisanMitra"
    DEBUG: bool = True
    SECRET_KEY: str = ""
    GROQ_API_KEY: str = ""
    COHERE_API_KEY: str = ""
    DATABASE_URL: str = ""
    REDIS_URL: str = ""
    OPENWEATHER_API_KEY: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()