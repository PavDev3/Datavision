# ADR-002: Elección de FastAPI como framework backend

- **Estado**: Aceptado
- **Fecha**: 2026-07
- **Decisores**: Equipo de desarrollo

## Contexto

El backend de DataVision necesita exponer una API REST consumida por el frontend Angular, recibir datos del motor de visión en tiempo real, y actuar como intermediario entre el LLM (Claude API) y la base de datos cuando el chat IA realiza consultas. Se requiere alto rendimiento para procesamiento concurrente de detecciones visuales.

## Opciones consideradas

| Opción | Pros | Contras |
|---|---|---|
| **FastAPI** | Async nativo, tipado con Pydantic, documentación automática (Swagger), Python (mismo lenguaje que Supervision) | Ecosistema más joven que Django |
| Django REST Framework | Maduro, ORM robusto, admin panel | Síncrono por defecto, más pesado |
| Express (Node) | Ligero, async nativo | Cambio de lenguaje respecto al motor de visión |

## Decisión

Se elige **FastAPI** por:

1. **Python unificado**: El motor de visión (Supervision + YOLO) corre en Python. Compartir lenguaje elimina la barrera entre el módulo de visión y el backend.
2. **Async nativo**: Soporta `async/await` de forma nativa, crítico para manejar múltiples streams de detección simultáneos.
3. **Pydantic**: Validación de datos automática y tipado estricto en los modelos de entrada/salida.
4. **Documentación automática**: Genera Swagger UI y ReDoc sin esfuerzo adicional, útil para la documentación del TFG.
5. **WebSockets**: Soporte nativo para envío de eventos en tiempo real al frontend.

## Consecuencias

- **Positivas**: API documentada automáticamente, integración fluida con el motor de visión, rendimiento alto.
- **Negativas**: Sin admin panel integrado como Django; habría que construirlo manualmente o usar el dashboard Angular.
- **Riesgos**: Gestión de migraciones de BD menos madura que Django (se mitiga con Alembic).
