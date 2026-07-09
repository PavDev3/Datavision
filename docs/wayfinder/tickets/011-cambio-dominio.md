---
id: 11
title: Diseñar el cambio de dominio end-to-end (CU-06)
type: grilling
status: open
assignee: null
blocked_by: [3, 5, 7]
---

## Question

Con los 3 dominios completos (Fútbol #3, Baloncesto #5) y Puerto incompleto (#7) ya diseñados, falta el flujo real de CU-06:

- ¿Cómo se confirma/fuerza que no hay sesión activa antes de cambiar de dominio (precondición ya documentada en `casos-de-uso.md`)?
- ¿Cómo es el selector de dominio en la UI? (¿lista simple, tarjetas con preview?)
- ¿Qué pasa visualmente al seleccionar Puerto — cómo se distingue de los otros 3 al ser un dominio de demostración limitado (ver ticket #7)?
- ¿Qué carga exactamente el sistema al cambiar de dominio? (clases a detectar, layout del mapa/plano de #9, zonas, métricas, tools IA — ya enumerado en `casos-de-uso.md` CU-06, falta el diseño concreto de cómo se materializa en la UI/backend)
