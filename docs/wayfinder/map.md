---
label: wayfinder:map
---

# Mapa — DataVision listo para defender como TFG

## Destination

DataVision funcionando de principio a fin — los 8 casos de uso (CU-01 a CU-08, ver `docs/casos-de-uso/casos-de-uso.md`) operativos de verdad, con 4 dominios registrados: **Tráfico, Fútbol y Baloncesto completos** (detector propio, plugin, métricas, tools IA, vídeo real cada uno), y **Puerto registrado pero deliberadamente incompleto** (sin fine-tuning, para demostrar en la propia defensa la limitación que motivó ADR-008 y la extensibilidad de la arquitectura de plugins). Listo para una demo en vivo ante el tribunal.

## Notes

- Skills a consultar en tickets `grilling`: `/grilling` + `/domain-modeling`. Actualizar `CONTEXT.md` según se resuelvan términos nuevos.
- Skill a consultar en tickets `prototype`: `/prototype` (rama UI para "cómo se ve/comporta").
- Orden natural: **Tráfico primero** (ya tiene vídeo real y detección probada, ver `vision/samples/trafico_southampton_junction.mp4`) — establece el patrón de persistencia/zonas/plugin que Fútbol y Baloncesto replican; Puerto se diseña en último lugar por ser el caso degradado.
- **V1 del catálogo de eventos = solo entrada/salida de zona** (geometría simple, domain-agnostic). Eventos específicos de deporte (gol, falta, triple, offside, robo, asistencia) quedan en el fog para una V2, deliberadamente pospuestos.
- Contrato de transporte del feed en vivo (diseñado antes de abrir el mapa, **ampliado al resolver el ticket #1**): `vision` anota con Supervision+ByteTrack, publica JPEG por HTTP throttled ~8fps a `POST /api/v1/internal/frames` — el payload ahora incluye también un array `detections` (`tracker_id`, `class_name`, `bbox`, `zone`) además de los agregados (`object_count`, `class_counts`), para que el propio endpoint pueda escribir `TrackedObject`/`Position` antes de retransmitir por `WS /ws/feed/{session_id}` como `type: "frame"`. Ver [#1](tickets/001-persistencia-feed-en-vivo.md) para el payload completo.
- ADR-008 debe revisarse cuando se resuelva el ticket de Puerto (vuelve como 4º dominio parcial; el ADR actual lo describe como "sustituido").
- Prototipo ya construido del dashboard de Tráfico en `frontend/src/app/features/dashboard/prototype/` (3 variantes, ruta `/prototype/dashboard?variant=A|B|C`) — dirección preferida por el usuario: Variante C (panel denso), con el vídeo como elemento prominente (2/3 del ancho, arriba) y los KPIs en fila pequeña debajo; el resto de información agrupada en una columna a la derecha. El usuario indicó que el diseño final se revisará más adelante — no está cerrado, es contexto de partida para el ticket #9.

## Decisions so far

- [Definir la geometría de zonas por dominio](tickets/002-geometria-zonas.md) — geometría vive en `sources.zones_geometry` (no en `domains`), como lista de puntos normalizados por zona; se usa el centro inferior del bbox para el test point-in-polygon; se define con una pantalla web (`/sources/:id/zones`, SVG plano) — **revisado**: sustituye al script CLI planteado originalmente.
- [Diseñar el esquema de persistencia del feed en vivo](tickets/001-persistencia-feed-en-vivo.md) — `TrackedObject` se cierra por inferencia (`last_seen` reciente, sin columna de estado); `Position` se escribe una fila por objeto en cada frame publicado (~8fps); el propio endpoint `POST /api/v1/internal/frames` hace las escrituras de forma síncrona, lo que obligó a ampliar el payload con un array `detections` por objeto (antes solo llevaba agregados).
- [Diseñar el plugin de Fútbol](tickets/003-plugin-futbol.md) — YOLO base sin fine-tuning (`person`+`sports ball` son nativas de COCO, igual que Tráfico); zonas `campo_local`/`campo_visitante`; reutiliza las 6 tools IA genéricas sin ninguna específica de fútbol; eventos V1 `jugador_entro/salio`, `balon_entro/salio`. ADR-004 queda desactualizado (sigue diciendo "fine-tuned") — revisar cuando cierre también #5.
- [Diseñar la configuración de fuentes de vídeo](tickets/013-configuracion-fuentes-video.md) — formulario simple (nombre, tipo, url, dominio); validación real de accesibilidad solo para `type = file` (`cv2.VideoCapture`), el resto se acepta sin comprobar; la pantalla no gestiona dominios (resuelve el fog de administración de dominios — sigue sin UI, vía script) ni geometría de zonas directamente (vive en su propia pantalla, `/sources/:id/zones`, enlazada desde aquí).

## Not yet specified

- Eventos específicos de deporte V2 (gol, falta, triple, offside, robo, asistencia) — heurística pendiente de diseñar tras validar el patrón V1 de zona.
- Estrategia de testing/QA integral del sistema completo (más allá de los tests unitarios por servicio ya existentes) — mencionado como pendiente en `memoria/05-pruebas.md`.

## Out of scope

- Redacción de la memoria académica — pista aparte (esqueleto ya en `memoria/`).
- Cámara real / RTSP en vivo — ya decidido en ADR-007, fuera del alcance del TFG.
