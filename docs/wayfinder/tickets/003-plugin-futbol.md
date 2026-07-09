---
id: 3
title: Diseñar el plugin de Fútbol (detector, zonas, métricas, tools IA)
type: grilling
status: closed
assignee: claude
blocked_by: [1, 2]
---

## Question

Replicar para Fútbol el patrón ya probado en Tráfico, ahora que la persistencia (#1) y la geometría de zonas (#2) están resueltas de forma domain-agnostic:

- ¿Qué modelo usa el detector? ADR-004 propone YOLOv8n fine-tuned para `person` + `sports ball` — ¿se hace fine-tuning real, o se usa el modelo base (igual que se decidió para Tráfico, sin fine-tuning) aceptando peor precisión en el balón?
- ¿Qué zonas tiene el dominio Fútbol? (¿área local, área visitante, medio campo? ¿algo más granular?)
- ¿Qué métricas expone para el dashboard?
- ¿Qué tools IA expone (siguiendo el catálogo ya documentado en `docs/api/api-rest.md`: `get_zone_occupancy`, etc. — ¿alguna específica de fútbol además de las genéricas?)
- V1 de eventos (según Notes del mapa) es solo entrada/salida de zona — ¿qué zonas de Fútbol generan eventos de zona con sentido?

Bloquea al ticket #4 (conseguir vídeo real de Fútbol, que necesita saber qué tipo de plano/vista requiere este diseño) y al #11 (cambio de dominio, que necesita los 3 dominios reales definidos).

## Resolution

- **Detector**: YOLO base, sin fine-tuning. `person` y `sports ball` son ambas clases nativas de COCO — mismo razonamiento que llevó a ADR-008 con Tráfico. `sports ball` es genérica (no distingue tipos de balón, pero sin ambigüedad real dentro de un vídeo de fútbol); no hay detección de dorsal/equipo vía YOLO (no era parte del alcance).
- **Zonas**: dos mitades, `campo_local` y `campo_visitante`, divididas por la línea de medio campo. Geometría (dos rectángulos) se define con el mismo script `vision/scripts/pick_zone_points.py` del ticket #2, sobre el vídeo real que consiga el ticket #4.
- **Clases rastreadas**: `person`, `sports ball`.
- **Métricas y tools IA**: se reutilizan tal cual las 6 tools genéricas ya documentadas (`get_zone_occupancy`, `get_object_location`, `get_object_history`, `get_event_count`, `get_statistics`, `search_object`), parametrizadas con las zonas/clases de Fútbol. Sin tools específicas de fútbol en V1 — coherente con que los eventos de dominio siguen siendo solo entrada/salida de zona (ver Notes del mapa); tools específicas (ej. posesión) se plantearán junto al V2 de eventos (fog del mapa).
- **Catálogo de eventos V1** (análogo al de Tráfico, pero solo entrada/salida — sin equivalentes de "congestión"/"detenido" porque eran conceptos propios de tráfico rodado): `jugador_entro`, `jugador_salio`, `balon_entro`, `balon_salio` (cada uno con `zone` = `campo_local` o `campo_visitante`).

**Pendiente de actualizar (no se toca en este ticket, solo se deja anotado)**: ADR-004 todavía dice "YOLOv8n (fine-tuned)" para Fútbol y Baloncesto en su tabla de modelos por dominio — desactualizado tras esta decisión (y previsiblemente tras el ticket #5). Revisar ADR-004 cuando se cierre también #5, para actualizar ambas filas de una vez.

