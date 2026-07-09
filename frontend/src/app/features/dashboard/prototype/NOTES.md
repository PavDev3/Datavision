# Prototype — dashboard de Tráfico

**Pregunta**: ¿qué pinta debe tener el dashboard del dominio Tráfico? En concreto: ¿mapa geográfico real (Leaflet) o plano esquemático del cruce (SVG)? ¿el vídeo en vivo es el elemento principal o secundario? ¿layout tipo "panel denso" o más espacioso?

Tres variantes en `/prototype/dashboard?variant=A|B|C`, mismos datos simulados (`mock-dashboard.service.ts`, sin backend real):

- **A — Mapa real + vídeo**: Leaflet centrado en el cruce, vídeo en vivo como panel grande junto al mapa.
- **B — Plano esquemático + analítica**: cruce dibujado en SVG (cruz con 4 accesos), gráfica de línea ECharts con el histórico, feed de eventos. Vídeo secundario/oculto.
- **C — Panel denso (grid)**: todo visible a la vez en una rejilla — KPIs, miniatura de vídeo, gráfica de barras por clase, mini-esquema y log de eventos.

**Estado**: pendiente de que el usuario reaccione. Cuando elija (o pida mezclar piezas de varias), anotar aquí el veredicto, plegar la variante ganadora dentro de `features/dashboard/` como página real, y borrar esta carpeta `prototype/` entera (variantes perdedoras + switcher + este fichero).
