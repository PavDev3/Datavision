# ADR-003: Elección de PostgreSQL como base de datos

- **Estado**: Aceptado
- **Fecha**: 2026-07
- **Decisores**: Equipo de desarrollo

## Contexto

DataVision almacena datos estructurados con relaciones complejas: objetos detectados, posiciones históricas, eventos, métricas agregadas y configuraciones de dominio. Se necesita una base de datos que soporte consultas analíticas eficientes (series temporales, agregaciones, filtros espaciales).

## Opciones consideradas

| Opción | Pros | Contras |
|---|---|---|
| **PostgreSQL** | Relacional maduro, soporte JSON/JSONB, extensiones geoespaciales (PostGIS), rendimiento analítico | Requiere más configuración que SQLite |
| MySQL/MariaDB | Popular, bien soportado | Menor soporte de tipos avanzados |
| SQLite | Sin configuración | No apto para producción concurrente |
| MongoDB | Flexible para datos semiestructurados | Sin relaciones, consultas analíticas más complejas |

## Decisión

Se elige **PostgreSQL** por:

1. **JSONB**: Los metadatos de detección (bounding boxes, confianza, atributos variables por dominio) se almacenan eficientemente como JSONB sin perder capacidad de consulta.
2. **Series temporales**: Consultas eficientes sobre datos históricos de posición y eventos.
3. **PostGIS** (opcional): Extensión para datos geoespaciales, útil para el caso de uso de puerto marítimo (coordenadas de zonas).
4. **Transacciones ACID**: Integridad de datos crítica cuando múltiples detecciones se insertan simultáneamente.
5. **SQLAlchemy + Alembic**: Ecosistema ORM maduro para FastAPI con migraciones gestionadas.

## Consecuencias

- **Positivas**: Base de datos de producción robusta, soporte de tipos avanzados, escalable.
- **Negativas**: Requiere servidor PostgreSQL corriendo (Docker en desarrollo).
- **Riesgos**: Ninguno significativo para el alcance del TFG.
