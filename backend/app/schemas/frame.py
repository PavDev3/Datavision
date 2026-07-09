import uuid
from datetime import datetime

from pydantic import BaseModel


class BBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float


class DetectionIn(BaseModel):
    tracker_id: int
    class_name: str
    bbox: BBox
    zone: str | None = None
    x: float
    y: float
    confidence: float


class FrameIngest(BaseModel):
    session_id: uuid.UUID
    frame_number: int
    timestamp: datetime
    fps: float
    object_count: int
    class_counts: dict[str, int]
    image_base64: str
    detections: list[DetectionIn] = []
