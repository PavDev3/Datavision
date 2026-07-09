# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

The first skeleton of all three services exists (`backend/`, `frontend/`, `vision/`), each minimal but runnable: backend answers `GET /health` and has the full DB schema migrated, vision loads YOLOv8n and processes a video passed via `--source`, frontend is a bare Angular 18 + Material app. No domain-plugin logic, no WebSocket/SSE, no real dashboard yet — that's still ahead. Read the relevant docs below before extending any of these; the architecture, data model, and API surface are already decided (via ADRs), not open for re-litigation unless the user explicitly asks to revisit a decision.

**The reference domain is Tráfico de Coches, not Puerto Marítimo** — see ADR-008. Puerto Marítimo was replaced because YOLO/COCO has no "container" class (would need custom fine-tuning) and real port footage was hard to source; traffic uses native COCO classes (`car`, `truck`, `bus`, `motorcycle`, `person`) and live traffic cameras are easy to find. Don't reintroduce port-specific examples without checking ADR-008 first.

See `CONTEXT.md` for the project's ubiquitous language (Domain, Session, Zone, Event, DomainPlugin, etc.) — consult it before using a term that might already have a precise meaning here.

## Commands

```
# Postgres (required by backend)
docker compose up -d db

# Backend (FastAPI) — from backend/
uv sync
uv run alembic upgrade head          # apply migrations
uv run uvicorn app.main:app --reload # serve on :8000
uv run pytest                        # run tests
uv run alembic revision --autogenerate -m "..."  # after changing app/models/

# Vision engine — from vision/
uv sync
uv run python main.py --source <path-to-video>
uv run pytest

# Frontend (Angular) — from frontend/
npm install
npm start   # serve on :4200
npm test

# Everything at once
scripts/dev.sh   # starts Postgres, backend, and frontend; vision is run manually (needs --source)
```

`.env` (gitignored, copy from `.env.example`) is read from the repo root by the backend regardless of where it's invoked from.

## What this project is

DataVision is a TFG (DAW degree final project): a real-time visual analytics platform that combines computer vision with a natural-language chat assistant, designed to work across multiple domains (traffic monitoring, football, basketball) via a domain-plugin architecture, so the same core never needs to know about "vehicles" vs "players" vs "balls" directly.

Three layers, each independently replaceable:

```
Video source (recorded file — see ADR-007)
      -> Vision engine (Supervision + YOLO + ByteTrack) -> domain plugin -> events
      -> Backend (FastAPI + PostgreSQL), REST + WebSocket + SSE
      -> Frontend (Angular + ECharts + Canvas2D/Leaflet), dashboard + map + AI chat
```

## Key architectural decisions (read the ADR before touching related code)

All in `docs/adr/`:

- **ADR-001**: Angular 18+ frontend — chosen for native TypeScript, RxJS (used for WebSocket/SSE streams), Angular Material.
- **ADR-002**: FastAPI backend — chosen so the backend shares Python with the vision engine; async-native for concurrent detection streams.
- **ADR-003**: PostgreSQL — JSONB used heavily for domain-variable metadata/config; SQLAlchemy + Alembic for migrations.
- **ADR-004**: Roboflow Supervision + YOLO — detection, tracking (ByteTrack/BoTSORT), and visual annotation. Model choice varies by domain (see table in the ADR).
- **ADR-005**: Claude API for the chat assistant, via tool calling — the backend defines tools per domain plugin and Claude decides which to invoke; responses stream to the frontend over SSE.
- **ADR-006**: Domain plugin architecture — each domain (`trafico`, `futbol`, `baloncesto`) implements the `DomainPlugin` abstract interface (`get_detector`, `get_tracked_classes`, `get_metrics`, `get_ai_tools`, `process_frame`) and is registered in a `DOMAIN_REGISTRY` dict. Adding a domain must never require changing core code — only adding a new plugin module under `backend/plugins/<domain>/` (and `vision/plugins/<domain>/`). The interface exists in both `backend/app/plugins/base.py` and `vision/plugins/base.py` but no concrete plugin (`TraficoPlugin`, etc.) is implemented yet — both registries are still empty.
- **ADR-007**: Video sources are pre-recorded files (`type = file`), not live cameras — chosen for demo reproducibility. The vision pipeline is source-agnostic (anything `cv2.VideoCapture` accepts), so `camera`/`rtsp` sources work with zero code changes if ever needed; don't build camera-specific code paths that assume file-based sources won't also occur.
- **ADR-008**: Domain roster is Tráfico/Fútbol/Baloncesto, not Puerto/Fútbol/Baloncesto (see above).

## Architecture reference docs

- `docs/arquitectura/arquitectura-sistema.md` — full system diagram, per-layer module responsibilities (e.g. `vision/detector.py`, `vision/tracker.py`, `vision/plugins/`, `backend/routers/`, `backend/services/`, `backend/ai/`, `frontend/core/`, `frontend/features/*`), and the two main data flows (real-time detection flow, AI chat query flow).
- `docs/arquitectura/modelo-datos.md` — entity-relationship model: `domains`, `sources`, `sessions`, `tracked_objects`, `positions`, `events`, `frame_stats`. Domain-specific attributes live in JSONB `metadata`/`config` columns rather than per-domain tables/columns — follow this pattern for any new domain-specific field instead of adding schema.
- `docs/api/api-rest.md` — REST endpoint contracts, WebSocket message shapes (`/ws/feed/{session_id}`), SSE chat stream format (`/api/v1/ai/chat`), and the AI tool catalog (`get_zone_occupancy`, `get_object_location`, `get_object_history`, `get_event_count`, `get_statistics`, `search_object`).
- `docs/arquitectura/hardware.md` — target dev machine (RTX 4090, WSL2 for backend/vision + Windows for frontend), and minimum specs for reproducing the project.
- `docs/casos-de-uso/casos-de-uso.md` — 8 use cases (CU-01 to CU-08) covering session lifecycle, real-time monitoring, AI chat queries, object history, zone stats, domain switching, report export, and video source configuration. Use these as the source of truth for expected user-facing behavior when implementing a feature.

## Conventions to follow

- New architectural decisions (not just implementation details) should get a new ADR in `docs/adr/`, following the structure in `ADR-000-plantilla.md`, and must be added to the index table in `docs/adr/README.md`.
- Domain-specific logic (detection classes, metrics, AI tools, event types) always goes through the `DomainPlugin` interface (ADR-006) — never branch on domain name (`if domain == "puerto"`) in core/shared code.
- Cross-domain data that varies in shape (detection metadata, event data, frame metrics) is stored as JSONB, matching the existing schema in `modelo-datos.md` — don't normalize these into rigid columns.
