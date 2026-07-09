# DataVision

Plataforma de análisis visual en tiempo real que aplica detección y tracking de objetos a distintos dominios verticales (Tráfico, Fútbol, Baloncesto) mediante un sistema de plugins, y expone los datos resultantes por dashboard y por un asistente de chat en lenguaje natural.

## Language

**Domain**:
Un dominio de negocio soportado por el sistema (`trafico`, `futbol`, `baloncesto`) — cada uno define sus propias clases de objeto, zonas, eventos y métricas. No confundir con "dominio" en el sentido genérico de Domain-Driven Design (bounded context); aquí es un término del propio negocio, persistido en la tabla `domains`.
_Avoid_: Vertical, caso de uso, sector

**DomainPlugin**:
La interfaz que implementa cada Domain para conectarse al núcleo del sistema (detector, clases rastreadas, métricas, tools de IA, procesamiento por frame). Ver ADR-006.
_Avoid_: Módulo de dominio, adaptador

**Session**:
Una ejecución del motor de visión sobre una Source concreta dentro de un Domain concreto, con un inicio y (opcionalmente) un fin. Es el ámbito temporal al que pertenecen los TrackedObject, Position, Event y FrameStats.
_Avoid_: Ejecución, run, análisis

**Source**:
El origen de vídeo de una Session: un archivo, una cámara IP o un stream. Actualmente siempre `type = file` (ver ADR-007). Cada Source guarda su propia geometría de Zone (`zones_geometry`, JSONB) porque el encuadre de cámara es específico de cada vídeo, no del Domain en abstracto — ver ticket wayfinder #2.
_Avoid_: Fuente de datos, input

**TrackedObject**:
Un objeto físico detectado y seguido por el motor de visión durante una Session, con un `track_id` asignado por ByteTrack que se mantiene mientras el objeto es visible. No tiene estado "activo/cerrado" persistido: se considera activo si `last_seen` es reciente (umbral decidido en la query que lo consulta, no en el esquema) — ver ticket wayfinder #1.
_Avoid_: Detección, objeto, entidad rastreada

**Position**:
Un punto del historial espacial de un TrackedObject en un instante dado: coordenadas normalizadas, Zone en la que se encuentra y bounding box.
_Avoid_: Ubicación, punto de trayectoria

**Zone**:
Una subdivisión espacial del Domain sobre la que se agregan métricas de ocupación. Su significado concreto depende del Domain: en Tráfico son los cuatro accesos de un cruce (`entrada_norte`, `entrada_sur`, `entrada_este`, `entrada_oeste`); en Fútbol son las dos mitades del campo (`campo_local`, `campo_visitante`); en Puerto (dominio sustituido, ver ADR-008) eran zonas de patio (`A`–`D`). El *nombre* de cada Zone es conceptual y vive en `domains.config`; su *geometría* (polígono de puntos normalizados 0-1) es específica de cada Source, no del Domain — ver Source. Un TrackedObject cae en una Zone si el centro inferior de su bbox ((x1+x2)/2, y2) está dentro de su polígono.
_Avoid_: Área, sector, región

**Event**:
Un suceso de dominio ocurrido durante una Session, con un `type` y datos específicos en JSONB. V1 del catálogo es siempre entrada/salida de zona (geometría simple, domain-agnostic); eventos más complejos que requieren heurística de reglas de juego (gol, falta, triple, offside) quedan pospuestos a una V2 (ver mapa wayfinder, "Not yet specified"). Catálogo V1 de Tráfico: `vehiculo_entro`, `vehiculo_salio`, `cruce_congestionado`, `vehiculo_detenido`, `cruce_peatonal_indebido`. Catálogo V1 de Fútbol: `jugador_entro`, `jugador_salio`, `balon_entro`, `balon_salio`.
_Avoid_: Evento de negocio, suceso

**FrameStats**:
Métricas agregadas de un único frame procesado (conteo de objetos, FPS, métricas de dominio) — no confundir con Event, que es un suceso discreto de negocio, no una medición continua.
_Avoid_: Métrica de frame, snapshot
