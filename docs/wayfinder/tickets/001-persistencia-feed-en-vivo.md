---
id: 1
title: Diseñar el esquema de persistencia del feed en vivo
type: grilling
status: closed
assignee: claude
blocked_by: []
---

## Question

El feed en vivo (vision → backend → frontend, ya diseñado como contrato de transporte — ver Notes del mapa) hoy no escribe nada en base de datos. Para que CU-04 (historial de objeto) y CU-05 (estadísticas de zona) funcionen de verdad, hace falta decidir:

- ¿Cuándo se crea un `TrackedObject` (primera detección con un `tracker_id` de ByteTrack nuevo) y cuándo se considera cerrado (`last_seen`, tras cuánto tiempo sin verse)?
- ¿Con qué frecuencia se escribe una fila en `Position`? ¿Cada frame publicado (~8fps), o un muestreo más agresivo para no saturar la tabla?
- ~~¿Cómo se deriva el campo `zone` de una `Position` a partir del bbox del objeto?~~ **Resuelto en [#2](002-geometria-zonas.md)**: centro inferior del bbox contra el polígono de `sources.zones_geometry`.
- ¿Quién escribe estas filas? ¿El propio endpoint `POST /api/v1/internal/frames` hace las inserciones antes de retransmitir por WebSocket, o hay un paso intermedio?

Esto bloquea a los tickets #3, #5, #7 (los tres plugins restantes necesitan seguir el mismo patrón de persistencia) y #8, #12 (chat IA y exportación de informes, que leen de estas tablas).

## Resolution

- **Cierre de `TrackedObject`**: sin estado explícito. Un `tracker_id` nuevo de ByteTrack → `INSERT` (`first_seen = last_seen = now()`); reapariciones del mismo `tracker_id` → `UPDATE last_seen`. "Activo" se calcula en la query que lo necesite (`last_seen > now() - interval 'N seconds'`), no se persiste como columna. ByteTrack ya gestiona internamente cuándo deja de reutilizar un `tracker_id`, así que no hay ambigüedad real de reaparición.
- **Frecuencia de `Position`**: una fila por objeto en cada frame publicado (~8fps, la cadencia ya decidida del transporte). Sin muestreo adicional — el volumen es trivial para una sesión de demo.
- **Derivación de `zone`**: resuelto en el ticket #2 (centro inferior del bbox contra `sources.zones_geometry`).
- **Quién escribe y payload ampliado**: el propio endpoint `POST /api/v1/internal/frames` hace los `INSERT`/`UPDATE` de forma síncrona, antes de retransmitir por WebSocket — sin cola ni worker aparte. Esto obliga a **ampliar el contrato de transporte** ya diseñado (ver Notes del mapa) con un campo nuevo `detections`, porque el payload original solo llevaba agregados (`object_count`, `class_counts`), no el detalle por objeto necesario para escribir `TrackedObject`/`Position`:

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
    { "tracker_id": 42, "class_name": "car", "bbox": { "x1": 100, "y1": 200, "x2": 300, "y2": 400 }, "zone": "entrada_norte" }
  ]
}
```

`vision/` calcula `zone` antes de publicar (ya tiene la geometría de `sources.zones_geometry` y Supervision da el bbox+`tracker_id` de ByteTrack), así que el backend no necesita repetir el cálculo point-in-polygon — solo persiste lo que le llega.

Este contrato ampliado sustituye al que estaba anotado en las Notes del mapa antes de resolver este ticket.

