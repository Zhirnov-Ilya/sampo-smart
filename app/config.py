import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):

    DB_USER: str
    DB_PASSWORD: str
    DB_HOST: str
    DB_PORT: int
    DB_NAME: str

    YANDEX_API_KEY: str
    YANDEX_FOLDER_ID: str
    YANDEX_MODEL_NAME: str 
    YANDEX_TEMPERATURE: float 
    YANDEX_MAX_TOKENS: int 
    
    SECRET_KEY: str
    ALGORITHM: str 
    ACCESS_TOKEN_EXPIRE_MINUTES: int 
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"),
        env_file_encoding="utf-8",
    )

    def get_db_url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}@"
            f"{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )


settings = Settings()