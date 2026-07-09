# ADR-004: Elección de Roboflow Supervision + YOLO como motor de visión

- **Estado**: Aceptado
- **Fecha**: 2026-07
- **Decisores**: Equipo de desarrollo

## Contexto

DataVision necesita detectar y rastrear objetos en vídeo en tiempo real (vehículos, jugadores, balón) desde cámaras o archivos de vídeo. Se requiere una solución que permita detección precisa, tracking multi-objeto y anotación visual, manteniendo una API sencilla que no distraiga del desarrollo del sistema completo.

## Opciones consideradas

| Opción | Pros | Contras |
|---|---|---|
| **Supervision + YOLO** | API limpia, tracking integrado, anotadores visuales, activamente mantenido | Requiere GPU para rendimiento óptimo |
| OpenCV puro | Sin dependencias externas | Detección manual muy compleja |
| Detectron2 | Muy preciso | Complejo de usar, menos documentación accesible |
| AWS Rekognition | Sin infraestructura | De pago, sin control local |

## Decisión

Se elige **Roboflow Supervision** con modelos **YOLO** (Ultralytics) por:

1. **API de alto nivel**: Abstrae la complejidad de detección, tracking y anotación en pocas líneas de código.
2. **Trackers integrados**: ByteTrack y BoTSORT disponibles directamente para tracking multi-objeto persistente.
3. **Anotadores visuales**: `BoundingBoxAnnotator`, `LabelAnnotator`, `TraceAnnotator` para visualización inmediata.
4. **Modelos YOLO**: YOLOv8/v11 preentrenados en COCO, fine-tunable para dominios específicos.
5. **Comunidad activa**: 40k+ stars en GitHub, actualizaciones frecuentes, documentación excelente.
6. **Licencia MIT**: Sin restricciones para uso académico o comercial.

## Modelos por dominio

| Dominio | Modelo base | Clases de interés |
|---|---|---|
| Tráfico | YOLOv8n/m | `car`, `truck`, `bus`, `motorcycle`, `person` — todas nativas de COCO, sin fine-tuning |
| Fútbol | YOLOv8n (fine-tuned) | `person`, `sports ball` |
| Baloncesto | YOLOv8n (fine-tuned) | `person`, `sports ball` |

## Consecuencias

- **Positivas**: Reducción drástica del tiempo de implementación del módulo de visión.
- **Negativas**: Dependencia de modelos preentrenados; fine-tuning necesario para casos específicos.
- **Riesgos**: Sin GPU dedicada el rendimiento en tiempo real puede ser limitado (se mitiga procesando offline o a menor FPS).
