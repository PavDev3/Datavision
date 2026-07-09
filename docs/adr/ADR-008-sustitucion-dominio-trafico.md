# ADR-008: Sustitución del dominio "Puerto Marítimo" por "Tráfico de Coches"

- **Estado**: ✅ Aceptado
- **Fecha**: 2026-07
- **Decisores**: Equipo de desarrollo

## Contexto

DataVision documentaba originalmente tres dominios de demostración: Puerto Marítimo, Fútbol y Baloncesto (ver README.md, ADR-004, ADR-007, `modelo-datos.md`, `casos-de-uso.md`). Durante la fase de montaje del esqueleto del motor de visión aparecieron dos problemas con el dominio de Puerto Marítimo que no se habían detectado en la fase de solo documentación:

1. **Disponibilidad de vídeo**: no se encontró ningún vídeo de puerto libre de derechos, con cámara fija (no timelapse) y disponible de forma estable — se probaron varios candidatos de YouTube y ninguno resultó viable (contenido no disponible, timelapse que rompe el tracking, o un único objeto en plano en vez de una escena con varios objetos moviéndose).
2. **Limitación técnica de clases COCO**: el propio ADR-004 ya advertía que Puerto necesitaría "clases custom para contenedores" — es decir, YOLO preentrenado en COCO **no tiene una clase "contenedor"**. Detectarlos de verdad exigiría fine-tuning con un dataset propio (recopilar imágenes, etiquetarlas, entrenar y validar un modelo), un trabajo de machine learning sustancial y ortogonal al objetivo del TFG, que es la integración de un pipeline de visión + backend + IA conversacional, no el entrenamiento de modelos de detección desde cero.

## Opciones consideradas

| Opción | Pros | Contras |
|---|---|---|
| **Sustituir Puerto Marítimo por Tráfico de Coches** | `car`, `truck`, `bus`, `motorcycle`, `person` son clases nativas de COCO — detección inmediata sin entrenar nada; cámaras de tráfico (en directo o grabadas) son abundantes y fáciles de conseguir | Se pierde el caso de uso de "contenedor con ID" tal como estaba redactado; hay que revisar la documentación ya escrita |
| Mantener Puerto Marítimo y fine-tunear YOLO para detectar contenedores | Cumple la visión original del proyecto tal cual se documentó | Requiere dataset etiquetado de contenedores, tiempo de entrenamiento y validación adicional — alcance de ML que compite con el tiempo disponible para el resto del TFG (backend, frontend, IA conversacional) |
| Mantener Puerto Marítimo pero detectar solo `truck` (ya nativa de COCO) sin modelar contenedores individuales | Sin trabajo de fine-tuning | El caso de uso principal del dominio (localizar y trackear contenedores por ID, ocupación de zona por contenedor) deja de tener sentido si no se detectan contenedores, solo camiones |

## Decisión

Se sustituye **Puerto Marítimo** por **Tráfico de Coches** como tercer dominio de referencia (junto a Fútbol y Baloncesto) por:

1. **Cero trabajo de fine-tuning**: las clases de interés (`car`, `truck`, `bus`, `motorcycle`, `person`) ya están en COCO, el dataset con el que viene preentrenado YOLOv8/v11.
2. **Vídeo accesible**: existen cámaras de tráfico en directo y grabaciones de cruces/intersecciones con cámara fija, a diferencia de la dificultad real encontrada para conseguir vídeo utilizable de puerto.
3. **El resto de la arquitectura no cambia**: el patrón de plugin de dominio (ADR-006), el modelo de datos (tablas genéricas con `metadata`/`config` en JSONB, ADR-003), y la decisión de vídeo pregrabado (ADR-007) siguen aplicando sin modificación — solo cambian los valores de ejemplo específicos del dominio (nombres de zona, clases, catálogo de eventos).
4. **Casos de uso análogos**: "ocupación de zona" pasa a ser "ocupación por acceso del cruce"; "objeto localizado por ID" pasa a ser "vehículo localizado por matrícula"; los ejemplos de consulta al chat IA (CU-03) se adaptan de forma directa.

### Vocabulario del nuevo dominio

| Concepto | Valor |
|---|---|
| Zonas (`positions.zone`) | `entrada_norte`, `entrada_sur`, `entrada_este`, `entrada_oeste` (accesos de un cruce/intersección) |
| Clases rastreadas | `car`, `truck`, `bus`, `motorcycle`, `person` |
| Eventos de dominio | `vehiculo_entro`, `vehiculo_salio`, `cruce_congestionado`, `vehiculo_detenido`, `cruce_peatonal_indebido` |
| Ejemplo de `metadata` en `tracked_objects` | `{ "vehicle_type": "car", "plate": "1234ABC", "direction": "norte->sur" }` |

Ver `CONTEXT.md` para el glosario completo del proyecto, incluidos estos términos.

## Consecuencias

- **Positivas**: el motor de visión puede probarse con vídeo real desde el primer momento, sin bloquear el desarrollo del resto del sistema a la espera de encontrar o generar vídeo de puerto; se elimina un riesgo de alcance (entrenar un modelo custom) que no aportaba valor al objetivo principal del TFG.
- **Negativas**: la documentación previa (README, ADR-004, ADR-007, `modelo-datos.md`, `hardware.md`, `casos-de-uso.md`, `api-rest.md`) que usaba ejemplos de Puerto Marítimo tuvo que revisarse para reflejar el nuevo dominio.
- **Riesgos**: ninguno significativo — la arquitectura de plugins (ADR-006) garantiza que añadir de nuevo un dominio de Puerto en el futuro (con el trabajo de fine-tuning correspondiente) seguiría sin requerir cambios en el núcleo del sistema.
