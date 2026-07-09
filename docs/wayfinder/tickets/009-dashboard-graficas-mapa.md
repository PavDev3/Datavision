---
id: 9
title: Diseñar el dashboard — gráficas ECharts y tipo de mapa/plano por dominio
type: prototype
status: open
assignee: null
blocked_by: [2]
---

## Question

Cómo se ve y comporta el dashboard de cada dominio: ¿mapa geográfico real (Leaflet) o plano esquemático (SVG/Canvas2D)? ¿qué gráficas ECharts para qué métricas? ¿qué peso relativo tiene el vídeo en vivo frente a los datos?

**Ya hay un prototipo construido** para el dominio Tráfico en `frontend/src/app/features/dashboard/prototype/` (variantes A: mapa Leaflet + vídeo, B: plano esquemático + analítica, C: panel denso) — ruta `/prototype/dashboard?variant=A|B|C`. El usuario ya reaccionó: **dirección preferida es la Variante C** (panel denso), ajustada con layout flex de 2 columnas — izquierda 2/3 del ancho con vídeo grande arriba y KPIs pequeños en fila debajo, derecha 1/3 con toda la información (ocupación por zona, gráfica de clases, log de eventos) agrupada en un único panel. El usuario indicó explícitamente que el diseño final se revisará más adelante — esto es un punto de partida fuerte, no una decisión cerrada.

Queda por resolver al retomar este ticket:
- Confirmar/cerrar el diseño de Tráfico (¿se queda como está el prototipo, o hay más iteración?).
- ¿El mismo patrón (vídeo + KPIs + panel de info agrupada) sirve tal cual para Fútbol/Baloncesto/Puerto, o cada dominio necesita su propio plano esquemático dentro del panel de vídeo/mapa (campo de fútbol, cancha de baloncesto)?
- Decidir de una vez la duda original mapa-real-vs-esquemático para dominios que no son de un único cruce fijo (¿Fútbol/Baloncesto usan siempre esquema, nunca Leaflet, dado que no tiene sentido geográfico real?).
- ~~Configuración de zonas en la UI~~ **Revisado**: sí existe una UI de marcado de zonas — `/sources/:id/zones` (SVG plano, ver ticket #2 actualizado) — pero vive como pantalla propia, **separada** del dashboard y de la pantalla de alta de fuentes (CU-08 sigue siendo solo el formulario simple).
- **Progreso**: ya se ha construido `features/live-feed/` (ruta `/live/:sessionId`), reutilizando la estructura de la Variante C (vídeo grande + KPIs en fila + panel de info agrupado) pero con datos reales del feed en vivo en vez de simulados. Todavía sin gráfica de histórico ni ocupación de zona (esos datos requieren endpoints de estadísticas no construidos aún) — este ticket sigue abierto para cerrar esa parte y confirmar el diseño definitivo.

Bloquea al ticket #10 (historial/trayectoria, que reutiliza el mismo mapa/plano para dibujar trayectorias).
