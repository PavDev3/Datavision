from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.models.position import Position
from app.models.session import Session
from app.models.tracked_object import TrackedObject
from app.schemas.frame import FrameIngest
from app.websocket.manager import manager

router = APIRouter(prefix="/internal", tags=["internal"])


@router.post("/frames", status_code=200)
async def ingest_frame(
    payload: FrameIngest, session: AsyncSession = Depends(get_session)
) -> dict[str, str]:
    db_session = await session.get(Session, payload.session_id)
    if db_session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    timestamp = payload.timestamp.replace(tzinfo=None) if payload.timestamp.tzinfo else payload.timestamp

    for detection in payload.detections:
        result = await session.execute(
            select(TrackedObject).where(
                TrackedObject.session_id == payload.session_id,
                TrackedObject.track_id == detection.tracker_id,
            )
        )
        tracked_object = result.scalar_one_or_none()

        if tracked_object is None:
            tracked_object = TrackedObject(
                session_id=payload.session_id,
                track_id=detection.tracker_id,
                class_name=detection.class_name,
                first_seen=timestamp,
                last_seen=timestamp,
            )
            session.add(tracked_object)
            await session.flush()
        else:
            tracked_object.last_seen = timestamp

        session.add(
            Position(
                object_id=tracked_object.id,
                timestamp=timestamp,
                x=detection.x,
                y=detection.y,
                zone=detection.zone,
                confidence=detection.confidence,
                bbox=detection.bbox.model_dump(),
            )
        )

    await session.commit()

    await manager.broadcast_json(
        str(payload.session_id),
        {
            "type": "frame",
            "frame_number": payload.frame_number,
            "timestamp": payload.timestamp.isoformat(),
            "fps": payload.fps,
            "object_count": payload.object_count,
            "class_counts": payload.class_counts,
            "image": f"data:image/jpeg;base64,{payload.image_base64}",
        },
    )

    return {"status": "ok"}
