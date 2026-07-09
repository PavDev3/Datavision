---
id: 8
title: "Diseñar el chat IA: tools reales + integración Claude + streaming SSE"
type: grilling
status: open
assignee: null
blocked_by: [1]
---

## Question

`docs/api/api-rest.md` y ADR-005 ya documentan el contrato (6 tools: `get_zone_occupancy`, `get_object_location`, `get_object_history`, `get_event_count`, `get_statistics`, `search_object`; endpoint `POST /api/v1/ai/chat` con respuesta SSE) pero nada de esto está implementado. Con la persistencia ya resuelta (#1), queda diseñar:

- ¿Cómo se implementa cada una de las 6 tools como función Python que consulta la BD real (queries concretas contra `tracked_objects`/`positions`/`events`)?
- ¿Cómo se estructura el loop de tool-calling con la Claude API? (system prompt, cuántas iteraciones de tool-call permitir, cómo se construyen las `tools` que se pasan por dominio vía `DomainPlugin.get_ai_tools()`)
- ¿Cómo se hace el streaming SSE hacia Angular? (formato exacto de los eventos `data:`, cómo se intercalan `text` y `ui_action`)
- ¿Cómo decide el backend qué `ui_action` disparar (highlight_zone, update_chart) a partir de qué tool se llamó?

No bloquea a nada más en el mapa actual (es una rama relativamente independiente una vez hay datos que consultar).
