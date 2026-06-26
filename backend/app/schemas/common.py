"""Shared schema primitives."""

from pydantic import BaseModel


class APIMessage(BaseModel):
    message: str