import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SessionCreate(BaseModel):
    domain_id: uuid.UUID
    source_id: uuid.UUID


class SessionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    domain_id: uuid.UUID
    source_id: uuid.UUID
    started_at: datetime
    ended_at: datetime | None
