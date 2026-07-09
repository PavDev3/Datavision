---
id: 13
title: Diseñar la configuración de fuentes de vídeo (CU-08)
type: grilling
status: closed
assignee: claude
blocked_by: []
---

## Question

CU-08 describe: el administrador añade una fuente de vídeo (nombre, tipo, URL), el sistema valida que es accesible, queda disponible para nuevas sesiones. Hoy esto se hace a mano (via `backend/scripts/seed_demo.py` cuando se implemente el ticket #1, o directamente en BD) — falta diseñar la UI/flujo real:

- ¿Qué UI tiene el alta de fuente? (formulario simple, con qué campos exactos)
- ¿Qué significa "validar que la fuente es accesible" para cada tipo (`file`: ¿el fichero existe y `cv2.VideoCapture` lo abre?; `rtsp`/`camera`/`http`: fuera de alcance real del TFG per ADR-007, pero el formulario los sigue listando — validación real o solo aceptar sin comprobar de verdad dado que no se van a usar en la demo?)
- ¿Esta pantalla también gestiona el alta de dominios, o eso queda fuera (ver "Not yet specified" del mapa)?

No bloquea a nada más en el mapa actual — es independiente del resto de la niebla.

## Resolution

- **Formulario de alta**: campos `nombre`, `tipo` (select: `file`/`rtsp`/`camera`/`http`), `url`, `dominio` (select con los dominios ya sembrados) — corresponde 1:1 con las columnas de `sources` en `modelo-datos.md`.
- **Validación de accesibilidad**: solo real para `type = file` — el backend intenta `cv2.VideoCapture(url)` al dar de alta; si falla, rechaza con 422. Para `rtsp`/`camera`/`http` se acepta sin comprobar nada de verdad: ADR-007 ya estableció que no se usan en la demo del TFG, así que no vale la pena construir lógica de validación de conexión para algo que nunca se prueba en la práctica. Siguen en el enum por completitud del modelo.
- **Alcance de la pantalla**: solo fuentes. No gestiona alta/edición de dominios (los 4 dominios se siembran una vez vía script, sin UI de administración — resuelve el fog correspondiente del mapa) ni marcado de geometría de zonas — eso vive en una pantalla propia (`/sources/:id/zones`, ver ticket #2 revisado), enlazada desde aquí tras crear una fuente, pero no integrada en este mismo formulario.

**Nota de revisión**: al implementar el pipeline en vivo se construyó sí una UI de marcado de zonas (revisando la resolución original de este ticket y del #9, que decían "sin UI, solo script offline") — pero como pantalla separada, no dentro de este formulario, así que la conclusión de "esta pantalla solo gestiona fuentes" se mantiene intacta.

