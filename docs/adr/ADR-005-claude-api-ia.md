# ADR-005: Elección de Claude API (Anthropic) para el asistente IA

- **Estado**: Aceptado
- **Fecha**: 2026-07
- **Decisores**: Equipo de desarrollo

## Contexto

DataVision necesita un asistente conversacional integrado en el dashboard que permita al usuario hacer consultas en lenguaje natural ("¿Cuántos contenedores hay en la zona B?", "¿Dónde está el jugador número 10?") y que el sistema responda tanto con texto como disparando acciones en la interfaz (pintar en el mapa, actualizar gráficas, filtrar tablas).

Para esto se requiere un LLM con capacidad de **tool calling** (llamadas a funciones), que pueda invocar la API REST del backend de DataVision como herramientas y devolver los resultados de forma estructurada.

## Opciones consideradas

| Opción | Pros | Contras |
|---|---|---|
| **Claude API** | Tool calling robusto, contexto largo, respuestas estructuradas, streaming SSE | De pago (tier gratuito limitado) |
| OpenAI GPT-4o | Tool calling maduro, muy documentado | De pago, mismo nivel de coste |
| Ollama (local) | Gratuito, sin enviar datos externos | Tool calling menos maduro, requiere GPU potente |
| Gemini API | Tier gratuito generoso | Tool calling menos documentado |

## Decisión

Se elige **Claude API (claude-sonnet-4-6)** por:

1. **Tool calling de alta calidad**: Claude sigue instrucciones de herramientas con gran precisión, crítico para que las consultas disparen las acciones correctas en el dashboard.
2. **Streaming nativo**: Soporte SSE para mostrar la respuesta del chat al vuelo, carácter a carácter.
3. **Contexto largo**: Capacidad de mantener el historial de conversación y el estado actual del dashboard en el prompt.
4. **Respuestas estructuradas**: Facilidad para devolver JSON estructurado junto a texto narrativo.
5. **Documentación excelente**: SDK oficial para Python y TypeScript.

## Arquitectura del tool calling

```
Usuario: "¿Cuántos contenedores hay en zona B?"
        ↓
Frontend envía mensaje al backend (FastAPI)
        ↓
Backend llama a Claude API con tools definidas:
  - get_container_count(zone?)
  - get_container_location(container_id)
  - get_zone_occupancy(zone)
  - get_movement_history(container_id, from_date, to_date)
  - get_statistics(domain, metric, period)
        ↓
Claude decide llamar: get_container_count(zone="B")
        ↓
Backend ejecuta la query en PostgreSQL
        ↓
Claude recibe el resultado y genera respuesta
        ↓
Frontend recibe respuesta + acción de UI (highlight zona B)
```

## Consecuencias

- **Positivas**: Chat inteligente con acciones reales sobre el dashboard, experiencia de usuario diferenciadora.
- **Negativas**: Coste por token; en producción habría que gestionar el uso.
- **Riesgos**: Latencia de la API externa; se mitiga con streaming para que el usuario vea respuesta inmediata.
