import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict

SourceType = Literal["file", "rtsp", "camera", "http"]


class SourceCreate(BaseModel):
    name: str
    type: SourceType
    url: str
    domain_id: uuid.UUID


class SourceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    domain_id: uuid.UUID
    name: str
    type: SourceType
    url: str
    zones_geometry: dict
    created_at: datetime


class SourceZonesUpdate(BaseModel):
    zones_geometry: dict


class SourcePreview(BaseModel):
    image_base64: str
