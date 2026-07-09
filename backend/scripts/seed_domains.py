"""Siembra los dominios cuyo diseño ya está cerrado en el mapa wayfinder.

Solo Trafico (ticket #2 / ADR-008) y Futbol (ticket #3) tienen su configuracion
de zonas decidida. Baloncesto y Puerto se anaden cuando sus tickets (#5, #7)
se resuelvan -- sembrarlos antes inventaria un diseno no decidido.

Idempotente: correrlo varias veces no duplica filas (se comprueba por `name`).
"""

import asyncio

from sqlalchemy import select

from app.core.database import async_session
from app.models.domain import Domain

DOMAINS = [
    {
        "name": "trafico",
        "display_name": "Tráfico de Coches",
        "config": {"zones": ["entrada_norte", "entrada_sur", "entrada_este", "entrada_oeste"]},
    },
    {
        "name": "futbol",
        "display_name": "Fútbol",
        "config": {"zones": ["campo_local", "campo_visitante"]},
    },
]


async def seed() -> None:
    async with async_session() as session:
        for domain_data in DOMAINS:
            existing = await session.execute(
                select(Domain).where(Domain.name == domain_data["name"])
            )
            if existing.scalar_one_or_none() is not None:
                print(f"  {domain_data['name']}: ya existe, se omite")
                continue

            session.add(Domain(**domain_data))
            print(f"  {domain_data['name']}: creado")

        await session.commit()


if __name__ == "__main__":
    asyncio.run(seed())
