# Arquitectura del Sistema — DataVision

## Visión general

DataVision es una plataforma de tres capas: **visión por computador**, **API y persistencia**, y **frontend inteligente**. Las tres capas se comunican mediante interfaces bien definidas, lo que permite sustituir o escalar cada una de forma independiente.

```
┌─────────────────────────────────────────────────────────────┐
│                     FUENTES DE VÍDEO                        │
│         Cámara IP / Archivo de vídeo / Stream RTSP          │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                  MOTOR DE VISIÓN                            │
│                                                             │
│   Supervision + YOLO                                        │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│   │Detección │→ │ Tracking │→ │ Eventos  │                 │
│   │  YOLO    │  │ByteTrack │  │ Dominio  │                 │
│   └──────────┘  └──────────┘  └──────────┘                 │
│                      │                                      │
│              Plugin de Dominio                              │
│         (Puerto / Fútbol / Baloncesto)                      │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP / WebSocket
┌─────────────────────▼───────────────────────────────────────┐
│                  BACKEND (FastAPI)                          │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  API REST   │  │  WebSocket  │  │   Servicio IA       │ │
│  │  /api/v1/   │  │  /ws/feed   │  │  Claude API proxy   │ │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
│         │                │                     │            │
│  ┌──────▼──────────────────────────────────────▼──────────┐ │
│  │              PostgreSQL (SQLAlchemy)                    │ │
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP / WebSocket / SSE
┌─────────────────────▼───────────────────────────────────────┐
│                  FRONTEND (Angular)                         │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐│
│  │   Dashboard  │  │  Mapa/Layout │  │    Chat IA         ││
│  │   ECharts    │  │   Canvas2D   │  │  Streaming SSE     ││
│  └──────────────┘  └──────────────┘  └────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Flujo de datos principal

### 1. Flujo de detección (tiempo real)

```
Cámara → Supervision procesa frame
       → YOLO detecta objetos
       → ByteTrack asigna IDs persistentes
       → Plugin de dominio genera evento
       → FastAPI persiste en PostgreSQL
       → WebSocket emite evento al frontend
       → Angular actualiza dashboard
```

### 2. Flujo de consulta IA

```
Usuario escribe pregunta en chat
       → Angular envía POST /api/v1/ai/chat
       → FastAPI construye prompt + tools disponibles
       → Claude API procesa con tool calling
       → Claude llama tool (ej: get_zone_occupancy)
       → FastAPI ejecuta query en PostgreSQL
       → Claude recibe resultado y genera respuesta
       → FastAPI hace streaming SSE al frontend
       → Angular muestra respuesta al vuelo + acción UI
```

## Componentes

### Motor de Visión (`/vision`)

| Módulo | Responsabilidad |
|---|---|
| `detector.py` | Inicializa modelo YOLO y ejecuta inferencia |
| `tracker.py` | Mantiene identidades de objetos entre frames |
| `streamer.py` | Lee fuente de vídeo y gestiona el bucle de procesamiento |
| `plugins/` | Lógica específica por dominio |
| `publisher.py` | Envía eventos al backend via HTTP/WebSocket |

### Backend (`/backend`)

| Módulo | Responsabilidad |
|---|---|
| `routers/` | Endpoints REST organizados por recurso |
| `services/` | Lógica de negocio desacoplada de HTTP |
| `models/` | Modelos SQLAlchemy (ORM) |
| `schemas/` | Modelos Pydantic (validación entrada/salida) |
| `ai/` | Proxy Claude API + definición de tools |
| `websocket/` | Gestión de conexiones WebSocket |
| `plugins/` | Implementaciones de DomainPlugin |

### Frontend (`/frontend`)

| Módulo | Responsabilidad |
|---|---|
| `core/` | Servicios singleton (API, WebSocket, Auth) |
| `shared/` | Componentes reutilizables (gráficas, tablas) |
| `features/dashboard/` | Vista principal del dashboard |
| `features/map/` | Visualización espacial (mapa de puerto, campo) |
| `features/chat/` | Interfaz del asistente IA |
| `features/history/` | Historial y estadísticas |
| `domain/` | Modelos TypeScript por dominio |

## Comunicación entre servicios

| Canal | Protocolo | Uso |
|---|---|---|
| Frontend → Backend | HTTP REST | Consultas, configuración, historial |
| Frontend → Backend | WebSocket | Suscripción a feed en tiempo real |
| Backend → Frontend | SSE | Streaming respuestas del chat IA |
| Motor Visión → Backend | HTTP POST | Publicación de eventos de detección |
| Backend → Claude API | HTTPS | Consultas al LLM |

## Entorno de desarrollo

```yaml
# docker-compose.yml (simplificado)
services:
  db:
    image: postgres:16
    
  backend:
    build: ./backend
    depends_on: [db]
    ports: ["8000:8000"]
    
  vision:
    build: ./vision
    depends_on: [backend]
    
  frontend:
    build: ./frontend
    ports: ["4200:4200"]
```
