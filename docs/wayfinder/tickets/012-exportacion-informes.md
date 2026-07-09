---
id: 12
title: Diseñar la exportación de informes (CU-07)
type: grilling
status: open
assignee: null
blocked_by: [1]
---

## Question

CU-07 describe: seleccionar una sesión finalizada, elegir tipo de informe (resumen/detalle/eventos), generar y descargar en PDF o CSV. Con la persistencia ya resuelta (#1), queda decidir:

- ¿PDF, CSV, o ambos desde el principio? ¿qué librería Python para generar el PDF (reportlab, weasyprint, u otra)?
- ¿Qué contenido exacto tiene cada tipo de informe (resumen vs detalle vs eventos)?
- ¿Se genera bajo demanda (endpoint que devuelve el fichero al momento) o de forma asíncrona (se encola y se notifica cuando está listo)? Dado el tamaño esperado de una sesión de demo, ¿hace falta async o basta con síncrono?
