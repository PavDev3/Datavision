# Requisitos de Hardware — DataVision

## Resumen

DataVision corre íntegramente en local sobre el equipo del desarrollador. No se requiere infraestructura en la nube ni hardware adicional para el entorno de desarrollo y demostración del TFG.

---

## Equipo de desarrollo y ejecución

### Especificaciones del sistema de referencia

| Componente | Especificación | Rol en DataVision |
|---|---|---|
| **Equipo** | Alienware Area-51 R7 | Máquina principal de desarrollo y ejecución |
| **CPU** | AMD Threadripper 2920X (12 núcleos / 24 hilos) | Backend FastAPI, base de datos, Angular dev server |
| **GPU** | NVIDIA RTX 4090 (24 GB VRAM) | Motor de visión: inferencia YOLO + Supervision |
| **RAM** | 32 GB+ DDR4 | Carga simultánea de modelos YOLO + PostgreSQL + Angular |
| **Almacenamiento** | SSD NVMe | Almacenamiento de vídeos de prueba, modelos y base de datos |
| **OS** | Windows 11 + WSL2 (Ubuntu) | Backend y visión en WSL2; frontend en Windows |

### ¿Por qué esta máquina es suficiente?

La RTX 4090 con 24 GB de VRAM permite:
- Ejecutar modelos YOLO de hasta 14B de parámetros sin problemas de memoria
- Procesar vídeo a 1080p en tiempo real a 30+ FPS
- Mantener múltiples sesiones de análisis simultáneas si fuera necesario

El Threadripper 2920X con 24 hilos permite correr en paralelo sin degradación:
- Motor de visión (proceso Python dedicado)
- Backend FastAPI (servidor uvicorn)
- PostgreSQL
- Angular dev server
- Llamadas a Claude API (I/O bound, sin coste de CPU)

---

## Fuentes de vídeo

Para el entorno de desarrollo y demostración del TFG se utilizan **vídeos pregrabados** en lugar de cámaras físicas. Esto elimina dependencias de hardware externo y permite reproducibilidad total en las demos.

### Vídeos de prueba recomendados

| Dominio | Fuente sugerida | Resolución recomendada |
|---|---|---|
| Tráfico | Cámaras de tráfico en directo o grabaciones de cruces/intersecciones con cámara fija (bancos de vídeo libres de derechos tipo Pixabay/Pexels, búsqueda: "intersection traffic camera", "cruce tráfico cámara fija") | 1080p |
| Fútbol | YouTube (partidos con plano cenital o cámara fija) | 1080p |
| Baloncesto | YouTube (partidos NBA con plano fijo) | 1080p |

> Los vídeos descargados se almacenan en la ruta configurada del proyecto y se referencian como fuentes de tipo `file` en la tabla `sources`.

### Ampliación futura con cámara real

Si en el futuro se quisiera conectar una cámara física, los requisitos serían:

| Tipo | Especificación mínima | Protocolo |
|---|---|---|
| Webcam USB | 1080p 30fps | DirectShow / V4L2 |
| Cámara IP | 1080p con RTSP | RTSP |
| Cámara de acción | 1080p 30fps | USB / WiFi |

El sistema ya está preparado para esto: la tabla `sources` soporta tipo `rtsp` y `camera`, y Supervision acepta cualquier fuente compatible con OpenCV (`cv2.VideoCapture`).

---

## Requisitos de software del sistema

### En Windows (host)

| Software | Versión mínima | Uso |
|---|---|---|
| Node.js | 20 LTS | Angular CLI y dev server |
| Angular CLI | 18+ | Compilación y desarrollo del frontend |
| Docker Desktop | 4.x | PostgreSQL en contenedor |
| Git | 2.x | Control de versiones |
| CUDA Toolkit | 12.x | Aceleración GPU para YOLO |

### En WSL2 / Linux

| Software | Versión mínima | Uso |
|---|---|---|
| Python | 3.11+ | Backend FastAPI + motor de visión |
| pip / venv | — | Gestión de dependencias Python |
| CUDA drivers | 12.x | Acceso a RTX 4090 desde WSL2 |

> **Nota WSL2 + CUDA**: NVIDIA soporta oficialmente CUDA en WSL2 desde los drivers 470+. Con los drivers actuales de la RTX 4090 no hay ninguna configuración especial necesaria; PyTorch detecta la GPU automáticamente.

---

## Arquitectura de procesos en local

```
┌─────────────────────────────────────────────────────────┐
│                  ALIENWARE AREA-51 R7                   │
│                                                         │
│  ┌──────────────────────┐   ┌─────────────────────────┐ │
│  │       WSL2           │   │        Windows          │ │
│  │                      │   │                         │ │
│  │  ┌────────────────┐  │   │  ┌───────────────────┐  │ │
│  │  │ Motor Visión   │  │   │  │  Angular Dev      │  │ │
│  │  │ Python 3.11    │  │   │  │  Server :4200     │  │ │
│  │  │ Supervision    │  │   │  └───────────────────┘  │ │
│  │  │ YOLO + CUDA    │  │   │                         │ │
│  │  │ RTX 4090 GPU   │  │   │  ┌───────────────────┐  │ │
│  │  └───────┬────────┘  │   │  │  Navegador        │  │ │
│  │          │ HTTP      │   │  │  localhost:4200   │  │ │
│  │  ┌───────▼────────┐  │   │  └───────────────────┘  │ │
│  │  │ FastAPI        │  │   │                         │ │
│  │  │ uvicorn :8000  │  │   └─────────────────────────┘ │
│  │  └───────┬────────┘  │                               │
│  │          │           │                               │
│  │  ┌───────▼────────┐  │                               │
│  │  │ PostgreSQL     │  │                               │
│  │  │ Docker :5432   │  │                               │
│  │  └────────────────┘  │                               │
│  └──────────────────────┘                               │
│                                │                        │
│                         Internet                        │
│                                │                        │
│                    ┌───────────▼──────────┐             │
│                    │    Claude API        │             │
│                    │  api.anthropic.com   │             │
│                    └──────────────────────┘             │
└─────────────────────────────────────────────────────────┘
```

---

## Cómo se conecta el hardware con el proyecto

### 1. RTX 4090 → Motor de visión

La GPU es el núcleo del motor de visión. YOLO carga el modelo en VRAM y ejecuta la inferencia frame a frame:

```python
# vision/detector.py
import torch
from ultralytics import YOLO

# PyTorch detecta automáticamente la RTX 4090
device = "cuda" if torch.cuda.is_available() else "cpu"
model = YOLO("yolov8m.pt").to(device)
```

Con la RTX 4090 se puede esperar:
- **YOLOv8n**: ~200 FPS en 1080p
- **YOLOv8m**: ~80 FPS en 1080p
- **YOLOv8x**: ~40 FPS en 1080p

### 2. Motor de visión → Backend FastAPI

El motor publica los eventos de detección al backend mediante HTTP POST en cada frame (o en batches configurables para reducir latencia):

```python
# vision/main.py (función publish_video)
import httpx

async def publish_frame(session_id: str, payload: dict):
    async with httpx.AsyncClient() as client:
        await client.post(
            "http://localhost:8000/api/v1/internal/frames",
            json=payload,
        )
```

Ver `docs/api/api-rest.md` § "Ingesta interna" para el contrato completo del payload (incluye imagen anotada + detecciones por objeto, no solo detecciones sueltas).

### 3. Backend → PostgreSQL (Docker)

PostgreSQL corre en Docker Desktop sobre Windows, accesible desde WSL2 mediante la IP de red de Docker (`host.docker.internal` o la IP del gateway WSL2):

```python
# backend/core/config.py
DATABASE_URL = "postgresql+asyncpg://datavision:datavision@localhost:5432/datavision"
```

```yaml
# docker-compose.yml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: datavision
      POSTGRES_USER: datavision
      POSTGRES_PASSWORD: datavision
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

### 4. Backend → Claude API (Internet)

El servicio de IA del backend actúa como proxy entre el frontend y Claude API. La RTX 4090 no interviene aquí — las llamadas son I/O bound hacia internet:

```python
# backend/ai/service.py
import anthropic

client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

async def chat(message: str, tools: list, history: list):
    async with client.messages.stream(
        model="claude-sonnet-4-6",
        max_tokens=1000,
        tools=tools,
        messages=[*history, {"role": "user", "content": message}]
    ) as stream:
        async for text in stream.text_stream:
            yield text
```

### 5. Backend → Frontend Angular (WebSocket + SSE)

El frontend Angular conecta con el backend mediante dos canales:
- **WebSocket** `/ws/feed/{session_id}`: recibe detecciones en tiempo real
- **SSE** `/api/v1/ai/chat`: recibe respuestas del chat en streaming

```typescript
// frontend/src/app/core/services/feed.service.ts
export class FeedService {
  connect(sessionId: string): Observable<DetectionEvent> {
    return new Observable(observer => {
      const ws = new WebSocket(`ws://localhost:8000/ws/feed/${sessionId}`);
      ws.onmessage = (event) => observer.next(JSON.parse(event.data));
    });
  }
}
```

---

## Requisitos mínimos para reproducir el proyecto

Para cualquier persona que quiera ejecutar DataVision (tribunal del TFG, por ejemplo):

| Requisito | Mínimo | Recomendado |
|---|---|---|
| **CPU** | 4 núcleos | 8+ núcleos |
| **RAM** | 16 GB | 32 GB |
| **GPU** | NVIDIA GTX 1060 6GB | NVIDIA RTX 3060+ |
| **VRAM** | 6 GB | 8 GB+ |
| **Almacenamiento** | 20 GB libres | 50 GB libres |
| **SO** | Windows 10/11 o Ubuntu 22.04 | Windows 11 + WSL2 |
| **Internet** | Sí (para Claude API) | Conexión estable |

> Sin GPU NVIDIA, el sistema funciona en CPU con modelos ligeros (YOLOv8n), pero el rendimiento se reduce a 5-10 FPS en 1080p. Para la demo del TFG es suficiente si se usa vídeo pregrabado.
