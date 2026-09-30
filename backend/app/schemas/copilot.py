from typing import Literal

from pydantic import BaseModel, Field


class CopilotConfig(BaseModel):
    text: str = Field(
        default="Сопоставляй опыт с вакансией. Указывай проверяемые основания. Решение подтверждает HR.",
        min_length=12,
        max_length=20000,
    )
    greenFlags: list[str] = Field(default_factory=list, max_length=100)
    redFlags: list[str] = Field(default_factory=list, max_length=100)
    useMemory: bool = False
    memoryMarkdown: str = Field(default="", max_length=100000)
    allowedActions: list[Literal["review", "interview", "rejected"]] = Field(
        default=["review", "interview"], min_length=1, max_length=3
    )
    version: int = Field(default=1, ge=1)
