from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import domains, internal, sessions, sources, ws

app = FastAPI(title="DataVision API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(domains.router, prefix="/api/v1")
app.include_router(sources.router, prefix="/api/v1")
app.include_router(sessions.router, prefix="/api/v1")
app.include_router(internal.router, prefix="/api/v1")
app.include_router(ws.router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
