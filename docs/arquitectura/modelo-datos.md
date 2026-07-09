# Modelo de Datos — DataVision

## Diagrama entidad-relación

```
┌─────────────┐       ┌─────────────────┐       ┌──────────────┐
│   Domain    │       │    Session      │       │    Source    │
│─────────────│       │─────────────────│       │──────────────│
│ id (PK)     │──────<│ id (PK)         │>──────│ id (PK)      │
│ name        │       │ domain_id (FK)  │       │ name         │
│ display_name│       │ source_id (FK)  │       │ type         │
│ config JSONB│       │ started_at      │       │ url          │
│ created_at  │       │ ended_at        │       │ domain_id FK │
└─────────────┘       │ metadata JSONB  │       │ created_at   │
                      └────────┬────────┘       └──────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
    ┌─────────▼──────┐ ┌───────▼───────┐ ┌─────▼──────────┐
    │   TrackedObject│ │     Event      │ │   FrameStats   │
    │────────────────│ │───────────────│ │────────────────│
    │ id (PK)        │ │ id (PK)        │ │ id (PK)        │
    │ session_id (FK)│ │ session_id(FK) │ │ session_id(FK) │
    │ track_id       │ │ type           │ │ frame_number   │
    │ class_name     │ │ object_id (FK) │ │ timestamp      │
    │ first_seen     │ │ timestamp      │ │ object_count   │
    │ last_seen      │ │ data JSONB     │ │ fps            │
    │ metadata JSONB │ └───────────────┘ │ metrics JSONB  │
    └────────┬───────┘                   └────────────────┘
             │
    ┌────────▼───────┐
    │   Position     │
    │────────────────│
    │ id (PK)        │
    │ object_id (FK) │
    │ timestamp      │
    │ x, y           │
    │ zone           │
    │ confidence     │
    │ bbox JSONB     │
    └────────────────┘
```

## Tablas

### `domains`
Dominios configurados en el sistema.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | Clave primaria |
| `name` | VARCHAR(50) | Identificador único (`trafico`, `futbol`) |
| `display_name` | VARCHAR(100) | Nombre para mostrar |
| `config` | JSONB | Configuración específica del dominio |
| `created_at` | TIMESTAMPTZ | Fecha de creación |

### `sources`
Fuentes de vídeo (cámaras, archivos, streams).

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | Clave primaria |
| `domain_id` | UUID FK | Dominio al que pertenece |
| `name` | VARCHAR(100) | Nombre descriptivo |
| `type` | ENUM | `camera`, `file`, `rtsp`, `http` |
| `url` | TEXT | URL o ruta del vídeo |
| `created_at` | TIMESTAMPTZ | Fecha de alta |

### `sessions`
Sesiones de análisis (una ejecución del motor de visión).

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | Clave primaria |
| `domain_id` | UUID FK | Dominio analizado |
| `source_id` | UUID FK | Fuente de vídeo |
| `started_at` | TIMESTAMPTZ | Inicio de sesión |
| `ended_at` | TIMESTAMPTZ | Fin de sesión (NULL si activa) |
| `metadata` | JSONB | Configuración usada en la sesión |

### `tracked_objects`
Objetos detectados y rastreados en una sesión.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | Clave primaria |
| `session_id` | UUID FK | Sesión donde fue detectado |
| `track_id` | INTEGER | ID asignado por el tracker (ByteTrack) |
| `class_name` | VARCHAR(50) | Clase del objeto (`car`, `truck`, `person`, `ball`) |
| `first_seen` | TIMESTAMPTZ | Primera detección |
| `last_seen` | TIMESTAMPTZ | Última detección |
| `metadata` | JSONB | Atributos específicos del dominio |

**Ejemplos de `metadata` por dominio:**
```json
// Tráfico
{ "vehicle_type": "car", "plate": "1234ABC", "direction": "norte->sur" }

// Fútbol
{ "team": "local", "jersey_number": 10, "role": "forward" }

// Baloncesto
{ "team": "visitante", "jersey_number": 23 }
```

### `positions`
Historial de posiciones de cada objeto rastreado.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | Clave primaria |
| `object_id` | UUID FK | Objeto rastreado |
| `timestamp` | TIMESTAMPTZ | Momento de la posición |
| `x` | FLOAT | Coordenada X normalizada (0-1) |
| `y` | FLOAT | Coordenada Y normalizada (0-1) |
| `zone` | VARCHAR(50) | Zona del dominio (ej: `B4`, `área_local`) |
| `confidence` | FLOAT | Confianza de la detección (0-1) |
| `bbox` | JSONB | Bounding box `{x1, y1, x2, y2}` |

### `events`
Eventos de dominio registrados durante la sesión.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | Clave primaria |
| `session_id` | UUID FK | Sesión donde ocurrió |
| `object_id` | UUID FK | Objeto relacionado (nullable) |
| `type` | VARCHAR(100) | Tipo de evento |
| `timestamp` | TIMESTAMPTZ | Momento del evento |
| `data` | JSONB | Datos del evento |

**Ejemplos de tipos de evento:**
```
Tráfico:     vehiculo_entro, vehiculo_salio, cruce_congestionado, vehiculo_detenido, cruce_peatonal_indebido
Fútbol:      goal, shot, pass, offside, corner
Baloncesto:  basket, foul, three_pointer, assist
```

### `frame_stats`
Estadísticas agregadas por frame (métricas de rendimiento y conteo).

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | Clave primaria |
| `session_id` | UUID FK | Sesión |
| `frame_number` | INTEGER | Número de frame |
| `timestamp` | TIMESTAMPTZ | Timestamp del frame |
| `object_count` | INTEGER | Objetos detectados en el frame |
| `fps` | FLOAT | FPS en ese momento |
| `metrics` | JSONB | Métricas específicas del dominio |

## Índices recomendados

```sql
-- Consultas frecuentes por sesión
CREATE INDEX idx_positions_object_id ON positions(object_id);
CREATE INDEX idx_positions_timestamp ON positions(timestamp DESC);
CREATE INDEX idx_events_session_timestamp ON events(session_id, timestamp DESC);
CREATE INDEX idx_tracked_objects_session ON tracked_objects(session_id);

-- Consultas de zona (frecuentes en el chat IA)
CREATE INDEX idx_positions_zone ON positions(zone);
```
