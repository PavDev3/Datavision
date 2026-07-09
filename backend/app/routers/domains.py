import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.models.domain import Domain
from app.schemas.domain import DomainRead

router = APIRouter(prefix="/domains", tags=["domains"])


@router.get("", response_model=list[DomainRead])
async def list_domains(session: AsyncSession = Depends(get_session)) -> list[Domain]:
    result = await session.execute(select(Domain))
    return list(result.scalars().all())


@router.get("/{domain_id}", response_model=DomainRead)
async def get_domain(
    domain_id: uuid.UUID, session: AsyncSession = Depends(get_session)
) -> Domain:
    domain = await session.get(Domain, domain_id)
    if domain is None:
        raise HTTPException(status_code=404, detail="Domain not found")
    return domain
