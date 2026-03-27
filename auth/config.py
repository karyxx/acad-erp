# auth/config.py

from pydantic_settings import BaseSettings  # pip install pydantic-settings
from pathlib import Path


# .resolve()                      → absolute path
# .parent                         → /ACAD-ERP/auth/
# .parent                         → /ACAD-ERP/          (project root)
# / ".env"                        → /ACAD-ERP/.env
ROOT_ENV = Path(__file__).resolve().parent.parent / ".env"


class AuthSettings(BaseSettings):

    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    class Config:
        env_file = ROOT_ENV          
        env_file_encoding = "utf-8"  
        case_sensitive = True        


auth_settings = AuthSettings()