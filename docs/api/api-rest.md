# Documentación API REST — DataVision

Base URL: `http://localhost:8000/api/v1`

> La documentación interactiva completa (Swagger UI) está disponible en `http://localhost:8000/docs`

---

## Dominios

### `GET /domains`
Lista todos los dominios configurados.

**Respuesta**
```json
[
  {
    "id": "uuid",
    "name": "trafico",
    "display_name": "Tráfico de Coches",
    "config": { "zones": ["entrada_norte", "entrada_sur", "entrada_este", "entrada_oeste"] }
  }
]
```

### `GET /domains/{domain_id}`
Obtiene los detalles de un dominio.

---

## Fuentes

### `POST /sources`
Da de alta una fuente de vídeo (CU-08). Solo se valida accesibilidad real para `type = "file"` — el backend intenta abrir la ruta con `cv2.VideoCapture`; si falla, la petición se rechaza. Para `rtsp`/`camera`/`http` se acepta sin comprobar la conexión (no se usan en la demo del TFG — ver ADR-007).

**Body**
```json
{
  "name": "Cruce Town Quay",
  "type": "file",
  "url": "vision/samples/trafico_southampton_junction.mp4",
  "domain_id": "uuid"
}
```

**Respuesta (201)**
```json
{
  "id": "uuid",
  "domain_id": "uuid",
  "name": "Cruce Town Quay",
  "type": "file",
  "url": "vision/samples/trafico_southampton_junction.mp4",
  "zones_geometry": {},
  "created_at": "2026-07-08T10:00:00Z"
}
```

**Errores**
| Código | Motivo |
|---|---|
| 404 | `domain_id` no corresponde a ningún dominio existente |
| 422 | `type = "file"` y la ruta no se puede abrir como vídeo |

### `GET /sources`
Lista fuentes, con filtro opcional `?domain_id=` — usado por el selector de fuentes al iniciar una sesión (CU-01).

### `GET /sources/{source_id}`
Obtiene una fuente por id (incluye `zones_geometry`).

### `GET /sources/{source_id}/preview`
Extrae y devuelve el primer frame del vídeo como JPEG en base64 — usado por la pantalla de marcado de zonas (`/sources/:id/zones` en el frontend). Solo soportado para `type = "file"`.

**Respuesta**
```json
{ "image_base64": "..." }
```

**Errores**: 404 si la fuente no existe; 400 si `type != "file"`; 422 si el vídeo no se puede abrir o leer.

### `PATCH /sources/{source_id}/zones`
Guarda la geometría de zonas de una fuente — polígonos de puntos normalizados 0-1, uno por nombre de zona del dominio.

**Body**
```json
{
  "zones_geometry": {
    "entrada_norte": { "points": [[0.42, 0.0], [0.58, 0.0], [0.55, 0.35], [0.45, 0.35]] }
  }
}
```

Devuelve la fuente actualizada (`SourceRead`, mismo formato que `POST /sources`).

---

## Sesiones

### `GET /sessions`
Lista sesiones con filtros opcionales.

**Query params**
| Param | Tipo | Descripción |
|---|---|---|
| `domain_id` | UUID | Filtrar por dominio |
| `active` | bool | Solo sesiones activas |
| `limit` | int | Máximo de resultados (default: 20) |

### `POST /sessions`
Inicia una nueva sesión de análisis.

**Body**
```json
{
  "domain_id": "uuid",
  "source_id": "uuid"
}
```

**Respuesta**
```json
{
  "id": "uuid",
  "domain_id": "uuid",
  "source_id": "uuid",
  "started_at": "2026-07-08T10:00:00Z",
  "ended_at": null
}
```

### `POST /sessions/{session_id}/start`
Arranca el motor de visión para esta sesión (CU-01) — el backend lanza `vision/main.py --publish` como subproceso (`uv run python main.py --source <url-de-la-fuente> --publish --session-id <id>`), apuntando a la fuente ya asociada a la sesión. El proceso queda registrado en memoria; `PATCH /sessions/{session_id}/end` lo termina si sigue vivo. Log del proceso en `vision/logs/session_{session_id}.log`.

**Respuesta**: `{"status": "started"}` — 404 si la sesión o su fuente no existen.

Sin endpoint de estado — el frontend navega directamente a `/live/{session_id}` y el propio WebSocket revela si están llegando frames.

### `GET /sessions/{session_id}`
Obtiene una sesión por id.

### `PATCH /sessions/{session_id}/end`
Finaliza una sesión activa (pone `ended_at` a la hora actual) y termina el subproceso de `vision/` si sigue en marcha (ver `POST /sessions/{session_id}/start`).

---

## Ingesta interna (motor de visión)

### `POST /internal/frames`
Endpoint interno — lo llama `vision/` (no el frontend) en cada frame publicado (~8fps, ver ADR-007 y el motor de visión). Persiste cada detección como `TrackedObject`/`Position` (upsert por `tracker_id` dentro de la sesión) y retransmite el frame por `WS /ws/feed/{session_id}`.

**Body**
```json
{
  "session_id": "uuid",
  "frame_number": 240,
  "timestamp": "2026-07-08T10:00:01Z",
  "fps": 8.0,
  "object_count": 5,
  "class_counts": { "car": 4, "truck": 1 },
  "image_base64": "...",
  "detections": [
    {
      "tracker_id": 42,
      "class_name": "car",
      "bbox": { "x1": 100, "y1": 200, "x2": 300, "y2": 400 },
      "zone": "entrada_norte",
      "x": 0.2,
      "y": 0.37,
      "confidence": 0.91
    }
  ]
}
```

`x`/`y` son el centro inferior del bbox normalizado (mismo punto usado para derivar `zone`, ver `docs/wayfinder/tickets/002-geometria-zonas.md`). `zone` es `null` si no hay geometría cargada para la fuente, o si el punto cae fuera de todos los polígonos.

**Respuesta**: `{"status": "ok"}` — 404 si `session_id` no existe.

---

## Objetos rastreados

### `GET /sessions/{session_id}/objects`
Lista todos los objetos rastreados en una sesión.

**Query params**
| Param | Tipo | Descripción |
|---|---|---|
| `class_name` | string | Filtrar por clase |
| `zone` | string | Filtrar por zona actual |

**Respuesta**
```json
[
  {
    "id": "uuid",
    "track_id": 42,
    "class_name": "car",
    "first_seen": "2026-07-08T09:00:00Z",
    "last_seen": "2026-07-08T10:30:00Z",
    "current_zone": "entrada_norte",
    "metadata": { "vehicle_type": "car", "plate": "1234ABC" }
  }
]
```

### `GET /objects/{object_id}/positions`
Obtiene el historial de posiciones de un objeto.

**Query params**
| Param | Tipo | Descripción |
|---|---|---|
| `from` | datetime | Desde (ISO 8601) |
| `to` | datetime | Hasta (ISO 8601) |
| `limit` | int | Máximo de posiciones |

---

## Eventos

### `GET /sessions/{session_id}/events`
Lista eventos de una sesión.

**Query params**
| Param | Tipo | Descripción |
|---|---|---|
| `type` | string | Filtrar por tipo de evento |
| `from` | datetime | Desde (ISO 8601) |
| `to` | datetime | Hasta (ISO 8601) |

---

## Estadísticas

### `GET /sessions/{session_id}/stats/zones`
Ocupación actual por zona.

**Respuesta**
```json
{
  "zones": {
    "entrada_norte": { "count": 12, "capacity": 20, "occupancy_pct": 60 },
    "entrada_sur": { "count": 18, "capacity": 20, "occupancy_pct": 90 },
    "entrada_este": { "count": 5,  "capacity": 20, "occupancy_pct": 25 }
  }
}
```

### `GET /sessions/{session_id}/stats/timeline`
Serie temporal de conteo de objetos.

**Query params**
| Param | Tipo | Descripción |
|---|---|---|
| `interval` | string | `minute`, `hour`, `day` |
| `from` | datetime | Desde |
| `to` | datetime | Hasta |

---

## Chat IA

### `POST /ai/chat`
Envía un mensaje al asistente IA. La respuesta es un stream SSE.

**Body**
```json
{
  "message": "¿Cuántos vehículos hay en la entrada sur?",
  "session_id": "uuid",
  "history": [
    { "role": "user", "content": "Hola" },
    { "role": "assistant", "content": "¡Hola! ¿En qué puedo ayudarte?" }
  ]
}
```

**Respuesta (SSE stream)**
```
data: {"type": "text", "content": "En la entrada sur hay "}
data: {"type": "text", "content": "18 vehículos"}
data: {"type": "ui_action", "action": "highlight_zone", "payload": {"zone": "entrada_sur"}}
data: {"type": "ui_action", "action": "update_chart", "payload": {"zone": "entrada_sur", "count": 18}}
data: {"type": "done"}
```

### Tools disponibles para el LLM

| Tool | Descripción |
|---|---|
| `get_zone_occupancy(zone?)` | Ocupación de una zona o todas |
| `get_object_location(object_id)` | Posición actual de un objeto |
| `get_object_history(object_id, from, to)` | Trayectoria de un objeto |
| `get_event_count(type, from, to)` | Conteo de eventos por tipo y periodo |
| `get_statistics(metric, period)` | Estadísticas agregadas |
| `search_object(query)` | Busca un objeto por metadata (ej: matrícula) |

---

## WebSocket

### `WS /ws/feed/{session_id}`
Suscripción al feed en tiempo real de una sesión.

**Mensajes recibidos**
```json
// type: "frame" — implementado. Retransmitido por POST /internal/frames en cada
// frame publicado por vision/ (~8fps). image ya incluye las cajas dibujadas
// (Supervision las anota antes de publicar).
{
  "type": "frame",
  "frame_number": 1500,
  "timestamp": "2026-07-08T10:00:01Z",
  "fps": 8.0,
  "object_count": 23,
  "class_counts": { "car": 18, "truck": 5 },
  "image": "data:image/jpeg;base64,..."
}
```

Los siguientes tipos de mensaje están documentados como diseño objetivo pero **no implementados todavía** (requieren derivar eventos de dominio y estadísticas agregadas de frame por separado, no solo persistencia cruda):
```json
// type: "detection" — no implementado
{
  "type": "detection",
  "track_id": 42,
  "class_name": "car",
  "zone": "entrada_norte",
  "bbox": { "x1": 100, "y1": 200, "x2": 300, "y2": 400 },
  "timestamp": "2026-07-08T10:00:00.123Z"
}

// type: "event" — no implementado (ver eventos V1 en docs/wayfinder/map.md)
{
  "type": "event",
  "event_type": "vehiculo_entro",
  "object_id": "uuid",
  "data": { "zone": "entrada_norte", "vehicle_type": "car" },
  "timestamp": "2026-07-08T10:00:01Z"
}

// type: "frame_stats" — no implementado (superpuesto en parte por "frame")
{
  "type": "frame_stats",
  "frame_number": 1500,
  "object_count": 23,
  "fps": 24.5,
  "timestamp": "2026-07-08T10:00:01Z"
}
```
