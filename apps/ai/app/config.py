"""Application settings loaded from environment variables."""

import os
from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    openai_api_key: str = Field(..., alias="OPENAI_API_KEY")
    openai_chat_model: str = Field("gpt-4o", alias="OPENAI_CHAT_MODEL")
    openai_structured_model: str = Field("gpt-4o-mini", alias="OPENAI_STRUCTURED_MODEL")

    # Origins allowed to call this service (NestJS API URL)
    nest_api_url: str = Field("http://localhost:4000", alias="NEST_API_URL")

    @property
    def allowed_origins(self) -> list[str]:
        return [self.nest_api_url]

    model_config = {"populate_by_name": True, "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
