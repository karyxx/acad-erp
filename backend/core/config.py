from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Application settings automatically loaded from environment variables or a .keys file.
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256" 
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    model_config = SettingsConfigDict(env_file=".keys", env_file_encoding="utf-8", extra = "ignore")

settings = Settings()