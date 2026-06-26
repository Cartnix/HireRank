"""Notification schemas."""

from pydantic import BaseModel


class NotificationRead(BaseModel):
    id: str
    enterprise_id: str
    recipient_id: str
    type: str
    is_read: bool
    created_at: str