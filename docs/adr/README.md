# Architecture Decision Records — DataVision

Los ADR (Architecture Decision Records) documentan las decisiones arquitectónicas significativas tomadas durante el desarrollo de DataVision, incluyendo el contexto, las opciones consideradas y las razones de la elección.

## Índice

| ADR | Título | Estado |
|---|---|---|
| [ADR-001](ADR-001-angular-frontend.md) | Elección de Angular como framework frontend | ✅ Aceptado |
| [ADR-002](ADR-002-fastapi-backend.md) | Elección de FastAPI como framework backend | ✅ Aceptado |
| [ADR-003](ADR-003-postgresql.md) | Elección de PostgreSQL como base de datos | ✅ Aceptado |
| [ADR-004](ADR-004-supervision-yolo.md) | Elección de Roboflow Supervision + YOLO como motor de visión | ✅ Aceptado |
| [ADR-005](ADR-005-claude-api-ia.md) | Elección de Claude API para el asistente IA | ✅ Aceptado |
| [ADR-006](ADR-006-arquitectura-plugins.md) | Arquitectura de dominio extensible mediante plugins | ✅ Aceptado |
| [ADR-007](ADR-007-video-pregrabado-vs-camara.md) | Uso de vídeo pregrabado en lugar de cámara física como fuente principal | ✅ Aceptado |
| [ADR-008](ADR-008-sustitucion-dominio-trafico.md) | Sustitución del dominio "Puerto Marítimo" por "Tráfico de Coches" | ✅ Aceptado |

## Estados posibles

- ✅ **Aceptado**: Decisión tomada y en uso
- 🔄 **En revisión**: Bajo discusión o reconsideración
- ⚠️ **Deprecado**: Sustituido por una decisión más reciente
- ❌ **Rechazado**: Opción considerada y descartada

## Cómo añadir un nuevo ADR

1. Copia la plantilla `ADR-000-plantilla.md`
2. Nómbralo con el siguiente número correlativo
3. Rellena todas las secciones
4. Añádelo a este índice
