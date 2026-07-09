---
id: 7
title: Diseñar el plugin de Puerto (incompleto a propósito) para CU-06
type: grilling
status: open
assignee: null
blocked_by: [1, 2]
---

## Question

Puerto vuelve como 4º dominio, pero deliberadamente incompleto: aparece en el selector de CU-06 y se puede seleccionar, pero sin detección real de contenedores (limitación de clases COCO ya documentada en ADR-008).

- ¿Qué se registra exactamente en `domains`/`DOMAIN_REGISTRY` para Puerto sin tener detección real? (metadata, zonas de ejemplo, tools IA "de mentira" o ausentes)
- ¿El detector usa YOLO base sin fine-tuning (detectando `truck` pero no `container`, mostrando resultados pobres a propósito) o directamente no hay detector/vídeo cargado?
- ¿Cómo se comunica en la UI que este dominio es una demostración de la limitación, no un dominio funcional? (¿badge "incompleto", mensaje explicativo al seleccionarlo?)
- ADR-008 actualmente describe a Puerto como "sustituido" (pasado) — hay que revisar ese ADR para reflejar que vuelve como dominio parcial. ¿Se edita ADR-008 o se añade un ADR-009 que lo matiza?

Bloquea al ticket #11 (cambio de dominio, que necesita los 4 dominios definidos, incluido este).
