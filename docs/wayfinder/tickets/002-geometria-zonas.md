---
id: 2
title: Definir la geometría de zonas por dominio
type: grilling
status: closed
assignee: claude
blocked_by: []
---

## Question

Tráfico ya tiene 4 zonas con nombre (`entrada_norte`, `entrada_sur`, `entrada_este`, `entrada_oeste`, ver `CONTEXT.md` y ADR-008) pero sin geometría real — no hay ningún polígono ni región definida sobre el frame del vídeo que diga dónde empieza y acaba cada zona.

- ¿Cómo se representa un polígono de zona? (¿coordenadas normalizadas 0-1 tipo lista de puntos, un rectángulo simple, algo más?)
- ¿Dónde se almacena? (`domains.config` ya es JSONB — ¿la geometría vive ahí, o en `sources` porque en realidad depende del encuadre de cada vídeo/cámara concreta, no del dominio en abstracto?)
- ¿Cómo se define esa geometría para el vídeo de Tráfico ya grabado (`vision/samples/trafico_southampton_junction.mp4`)? ¿A mano mirando el vídeo, con alguna herramienta?
- ¿Cómo decide `vision/` o `backend/` en qué zona cae un bbox dado (point-in-polygon con el centro del bbox, con la base del bbox, otro criterio)?

Esto bloquea a los tickets #3, #5, #7 (cada dominio nuevo necesita su propia geometría siguiendo el mismo mecanismo) y #9 (el dashboard necesita dibujar estas zonas).

## Resolution

- **Dónde vive**: la geometría vive en `sources` (nuevo campo JSONB `zones_geometry`), no en `domains.config`. El encuadre de cámara es propio de cada vídeo/fuente, no del dominio en abstracto; `domains.config` sigue guardando solo los *nombres* conceptuales de zona (`["entrada_norte", "entrada_sur", ...]`).
- **Formato del polígono**: lista de puntos `[x, y]` normalizados 0-1, uno por zona: `{ "entrada_norte": { "points": [[x,y], ...] }, ... }`. Se eligió sobre un rectángulo simple porque los accesos de un cruce real casi nunca son rectangulares en la perspectiva de cámara, y el mismo formato debe servir para zonas de forma más irregular en Fútbol/Baloncesto.
- **Punto de referencia para el test point-in-polygon**: el centro inferior del bbox — `((x1+x2)/2, y2)` — no el centro geométrico. Aproxima dónde tocan el suelo las ruedas/pies del objeto; el centro geométrico cae por encima del suelo real en objetos altos (camión, autobús).
- **Cómo se define en la práctica** (revisado — ver nota de revisión al final): pantalla del frontend `/sources/:id/zones` que carga un frame de vista previa del vídeo (`GET /sources/{id}/preview`) y permite hacer clic para ir marcando los puntos de cada zona sobre un overlay SVG, guardando con `PATCH /sources/{id}/zones`. Sirve sin cambios para Fútbol (#4) y Baloncesto (#6) cuando llegue su turno — solo cambian los nombres de zona, que se leen del dominio.

**Nota de revisión**: la resolución original de este ticket proponía un script CLI (`vision/scripts/pick_zone_points.py`) con una ventana interactiva de OpenCV. Se sustituyó por una pantalla web porque (1) el usuario puede usarla directamente en el navegador sin tocar terminal, y (2) permite verificación automatizada por HTTP en vez de depender de una GUI. El script CLI nunca se implementó.
- **Migración pendiente**: añadir la columna `zones_geometry` (JSONB) a `sources` en `backend/app/models/source.py` + migración Alembic correspondiente, cuando se implemente esto (no se ha tocado código todavía, solo se ha decidido el diseño).

Términos actualizados en `CONTEXT.md`: `Zone` (nombre vs. geometría, y el criterio del punto de referencia) y `Source` (ahora carga `zones_geometry`).
