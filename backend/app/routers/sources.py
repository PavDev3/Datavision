import base64
import uuid

import cv2
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.models.domain import Domain
from app.models.source import Source
from app.schemas.source import SourceCreate, SourcePreview, SourceRead, SourceZonesUpdate

router = APIRouter(prefix="/sources", tags=["sources"])


def _is_file_accessible(url: str) -> bool:
    capture = cv2.VideoCapture(url)
    try:
        return capture.isOpened()
    finally:
        capture.release()


@router.post("", response_model=SourceRead, status_code=201)
async def create_source(
    payload: SourceCreate, session: AsyncSession = Depends(get_session)
) -> Source:
    domain = await session.get(Domain, payload.domain_id)
    if domain is None:
        raise HTTPException(status_code=404, detail="Domain not found")

    if payload.type == "file" and not _is_file_accessible(payload.url):
        raise HTTPException(
            status_code=422, detail="No se ha podido abrir el fichero de vídeo indicado"
        )

    source = Source(
        domain_id=payload.domain_id,
        name=payload.name,
        type=payload.type,
        url=payload.url,
    )
    session.add(source)
    await session.commit()
    await session.refresh(source)
    return source


@router.get("", response_model=list[SourceRead])
async def list_sources(
    domain_id: uuid.UUID | None = None, session: AsyncSession = Depends(get_session)
) -> list[Source]:
    query = select(Source)
    if domain_id is not None:
        query = query.where(Source.domain_id == domain_id)
    result = await session.execute(query)
    return list(result.scalars().all())


@router.get("/{source_id}", response_model=SourceRead)
async def get_source(
    source_id: uuid.UUID, session: AsyncSession = Depends(get_session)
) -> Source:
    source = await session.get(Source, source_id)
    if source is None:
        raise HTTPException(status_code=404, detail="Source not found")
    return source


@router.get("/{source_id}/preview", response_model=SourcePreview)
async def get_source_preview(
    source_id: uuid.UUID, session: AsyncSession = Depends(get_session)
) -> SourcePreview:
    source = await session.get(Source, source_id)
    if source is None:
        raise HTTPException(status_code=404, detail="Source not found")
    if source.type != "file":
        raise HTTPException(
            status_code=400, detail="Solo se puede previsualizar una fuente de tipo 'file'"
        )

    capture = cv2.VideoCapture(source.url)
    try:
        if not capture.isOpened():
            raise HTTPException(status_code=422, detail="No se ha podido abrir el vídeo")
        ok, frame = capture.read()
        if not ok:
            raise HTTPException(status_code=422, detail="No se ha podido leer un frame del vídeo")
    finally:
        capture.release()

    ok, buffer = cv2.imencode(".jpg", frame)
    if not ok:
        raise HTTPException(status_code=500, detail="No se ha podido codificar el frame")

    return SourcePreview(image_base64=base64.b64encode(buffer).decode("ascii"))


@router.patch("/{source_id}/zones", response_model=SourceRead)
async def update_source_zones(
    source_id: uuid.UUID,
    payload: SourceZonesUpdate,
    session: AsyncSession = Depends(get_session),
) -> Source:
    source = await session.get(Source, source_id)
    if source is None:
        raise HTTPException(status_code=404, detail="Source not found")
    source.zones_geometry = payload.zones_geometry
    await session.commit()
    await session.refresh(source)
    return source


@router.delete("/{source_id}", status_code=204)
async def delete_source(
    source_id: uuid.UUID, session: AsyncSession = Depends(get_session)
) -> None:
    source = await session.get(Source, source_id)
    if source is None:
        raise HTTPException(status_code=404, detail="Source not found")

    await session.delete(source)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(
            status_code=409,
            detail="No se puede eliminar: la fuente tiene sesiones asociadas.",
        )
