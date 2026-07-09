---
id: 5
title: Diseñar el plugin de Baloncesto (detector, zonas, métricas, tools IA)
type: grilling
status: open
assignee: null
blocked_by: [1, 2]
---

## Question

Análogo al ticket #3 (plugin de Fútbol) pero para Baloncesto:

- ¿Modelo del detector? (mismo dilema: fine-tuning real de `person`+`sports ball` per ADR-004, o modelo base como Tráfico)
- ¿Qué zonas tiene el dominio? (¿zona de tiro de 3, zona de tiro de 2, banquillos?)
- ¿Qué métricas y tools IA expone?
- ¿Qué zonas generan eventos de entrada/salida con sentido para el V1?

Bloquea al ticket #6 (conseguir vídeo real de Baloncesto) y al #11 (cambio de dominio).
