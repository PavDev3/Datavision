# ADR-007: Uso de vídeo pregrabado en lugar de cámara física como fuente principal

- **Estado**: ✅ Aceptado
- **Fecha**: 2026-07
- **Decisores**: Equipo de desarrollo

## Contexto

DataVision está diseñado para procesar fuentes de vídeo en tiempo real (cámara IP, stream RTSP o archivo), y la tabla `sources` ya modela los tres tipos por igual. Para el desarrollo y la demostración del TFG es necesario decidir qué fuente(s) se usarán realmente. No se dispone de cámaras físicas instaladas en un campo de fútbol o cancha de baloncesto, ni tiene sentido adquirirlas para un entorno académico; para el dominio de tráfico sí existen cámaras de circulación en directo accesibles públicamente, pero depender de un stream en vivo de terceros durante la evaluación introduce un riesgo de reproducibilidad que no compensa el realismo adicional (ver razón 2 más abajo).

La duda de fondo es si sustituir la cámara por un archivo de vídeo pregrabado resta valor o realismo al proyecto, especialmente de cara a un tribunal que evaluará si el sistema es "tiempo real" de verdad.

## Opciones consideradas

| Opción | Pros | Contras |
|---|---|---|
| **Vídeo pregrabado (`type = file`)** | Sin dependencia de hardware externo; reproducible en cualquier demo; permite elegir clips con casos de uso interesantes (zonas llenas, goles, etc.) | No demuestra ingestión de stream en vivo real |
| Cámara IP / RTSP en vivo | Máximo realismo de "producción" | Requiere infraestructura física (puerto, estadio) inaccesible para un TFG; introduce fallos de red, iluminación y reproducibilidad nula en la demo |
| Webcam apuntando a una pantalla reproduciendo el vídeo | Simula un stream real end-to-end | Añade ruido (reflejos, compresión doble) sin aportar nada al núcleo del sistema; mismo resultado que RTSP simulado con más complejidad accidental |
| Streaming del vídeo vía servidor RTSP local (ej. `mediamtx`) | Ejercita la ruta de código RTSP real | Complejidad adicional de infraestructura sin cambiar ni una línea de la lógica de visión, tracking o dominio |

## Decisión

Se elige **vídeo pregrabado (`type = file`)** como fuente principal para desarrollo y demo por:

1. **El pipeline de visión es agnóstico a la fuente**: Supervision/OpenCV consumen cualquier origen compatible con `cv2.VideoCapture` de forma idéntica; un archivo MP4 y un stream RTSP entran por la misma interfaz. No hay diferencia de código entre ambos, solo cambia la URL/ruta configurada en `sources`.
2. **Reproducibilidad para la evaluación**: el tribunal puede ejecutar la demo exactamente igual en cualquier momento, sin depender de que una cámara esté encendida, bien orientada o conectada a la red.
3. **Selección de contenido relevante**: permite elegir vídeos con los eventos de dominio que se quieren demostrar (vehículos entrando por un acceso, congestión, goles, triples), en vez de esperar a que ocurran en directo.
4. **`type = camera`/`rtsp` quedan soportados sin usarse**: el modelo de datos y el motor de visión ya están preparados para cámara real (ver `docs/arquitectura/hardware.md`); adoptarla en el futuro no requiere cambios de arquitectura, solo configurar una nueva `source`.
5. **Coste y accesibilidad**: cero inversión en hardware de captura, sin permisos de grabación en instalaciones reales (estadios, cruces de tráfico gestionados por terceros).

## Consecuencias

- **Positivas**: Desarrollo y demo reproducibles, sin dependencias externas ni coste de hardware; el pipeline queda validado igualmente porque el código de ingesta no distingue el origen.
- **Negativas**: No se demuestra explícitamente la ingesta de un stream en vivo (latencia de red, reconexión, frames corruptos); si el tribunal pide ver esto, haría falta una demo adicional con RTSP simulado.
- **Riesgos**: Percepción de que el sistema es "menos real" por no usar cámara en vivo. Se mitiga documentando explícitamente (este ADR) que la arquitectura soporta cámara real sin cambios, y opcionalmente montando una demo puntual con un servidor RTSP local (ej. `mediamtx` reproduciendo el mismo archivo) para mostrar que la ruta `rtsp` funciona igual si el calendario del TFG lo permite.

## Ampliación futura

Ver `docs/arquitectura/hardware.md` § "Ampliación futura con cámara real" para los requisitos mínimos de una webcam USB o cámara IP si se quisiera extender el proyecto más allá del TFG.
