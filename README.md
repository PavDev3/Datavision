# DataVision

> Plataforma de análisis visual en tiempo real con dashboards inteligentes generados por IA.

DataVision es una plataforma extensible que combina visión por computador, almacenamiento de datos estructurado y consultas en lenguaje natural para generar dashboards dinámicos sobre cualquier dominio visual: monitorización de tráfico en cruces, análisis de partidos de fútbol, estadísticas de baloncesto, y más.

## Casos de uso demostrados

| Dominio | Qué detecta | Qué analiza |
|---|---|---|
| 🚗 Tráfico de coches | Vehículos, peatones | Ocupación por acceso, conteo, congestión |
| ⚽ Fútbol | Jugadores, balón | Posesión, posiciones, eventos de partido |
| 🏀 Baloncesto | Jugadores, balón | Zonas de tiro, estadísticas, tracking |

## Arquitectura general

```
Fuente de vídeo
      ↓
Motor de visión (Supervision + YOLO)
      ↓
API REST (FastAPI + PostgreSQL)
      ↓
Dashboard Angular ←→ Chat IA (Claude API)
```

## Estructura del repositorio

```
datavision/
├── README.md
├── docs/
│   ├── adr/                    # Architecture Decision Records
│   ├── arquitectura/           # Diagramas y descripción del sistema
│   ├── casos-de-uso/           # Especificación de casos de uso
│   └── api/                    # Documentación de la API REST
├── frontend/                   # Aplicación Angular
├── backend/                    # API FastAPI
└── vision/                     # Motor de visión por computador
```

## Tecnologías

- **Frontend**: Angular 18+, Angular Material, ECharts, Leaflet
- **Backend**: FastAPI, PostgreSQL, SQLAlchemy, Alembic
- **Visión**: Roboflow Supervision, YOLO
- **IA**: Claude API (tool calling)

## Estado del proyecto

🚧 En desarrollo — Trabajo de Fin de Grado (DAW)

## Autor

Trabajo de Fin de Grado — Desarrollo de Aplicaciones Web

## Ejemplo de video de trafico

https://www.youtube.com/watch?v=bAHc-eRU-gU
