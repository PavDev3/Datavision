import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_session
from app.models.session import Session
from app.models.source import Source
from app.schemas.session import SessionCreate, SessionRead
from app.services import vision_process

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("", response_model=SessionRead, status_code=201)
async def create_session(
    payload: SessionCreate, session: AsyncSession = Depends(get_session)
) -> Session:
    db_session = Session(
        domain_id=payload.domain_id,
        source_id=payload.source_id,
        started_at=datetime.utcnow(),
    )
    session.add(db_session)
    await session.commit()
    await session.refresh(db_session)
    return db_session


@router.get("/{session_id}", response_model=SessionRead)
async def get_session_by_id(
    session_id: uuid.UUID, session: AsyncSession = Depends(get_session)
) -> Session:
    db_session = await session.get(Session, session_id)
    if db_session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return db_session


@router.patch("/{session_id}/end", response_model=SessionRead)
async def end_session(
    session_id: uuid.UUID, session: AsyncSession = Depends(get_session)
) -> Session:
    db_session = await session.get(Session, session_id)
    if db_session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    db_session.ended_at = datetime.utcnow()
    await session.commit()
    await session.refresh(db_session)
    vision_process.manager.stop(str(session_id))
    return db_session


@router.post("/{session_id}/start")
async def start_session(
    session_id: uuid.UUID, session: AsyncSession = Depends(get_session)
) -> dict[str, str]:
    db_session = await session.get(Session, session_id)
    if db_session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    source = await session.get(Source, db_session.source_id)
    if source is None:
        raise HTTPException(status_code=404, detail="Source not found")

    backend_url = f"http://localhost:{settings.backend_port}"
    vision_process.manager.start(str(session_id), source.url, backend_url)
    return {"status": "started"}
