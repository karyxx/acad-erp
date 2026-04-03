from dotenv import load_dotenv
import os

class ConfigError(Exception):
    """Raised when required configuration is missing."""
    pass


def _get_required_env(var_name: str) -> str:
    value = os.getenv(var_name)
    if not value:
        raise ConfigError(f"Missing required environment variable: {var_name}")
    return value


load_dotenv(".keys")

db_url = _get_required_env("DATABASE_URL")
    

