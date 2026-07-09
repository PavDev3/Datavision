# ADR-001: Elección de Angular como framework frontend

- **Estado**: Aceptado
- **Fecha**: 2026-07
- **Decisores**: Equipo de desarrollo

## Contexto

DataVision requiere un frontend complejo con múltiples vistas simultáneas, estado compartido entre componentes (mapa, gráficas, chat IA, tablas), actualizaciones en tiempo real y una experiencia de usuario fluida para analistas. Se necesita un framework robusto que soporte dashboards de alta interactividad.

## Opciones consideradas

| Opción | Pros | Contras |
|---|---|---|
| **Angular** | Estructura opinionada, TypeScript nativo, Angular Material, RxJS para streams en tiempo real | Curva de aprendizaje, más verboso |
| React | Ecosistema amplio, más flexible | Sin estructura impuesta, gestión de estado más manual |
| Vue | Fácil de aprender | Ecosistema menos maduro para dashboards complejos |

## Decisión

Se elige **Angular 18+** por las siguientes razones:

1. **TypeScript nativo**: Tipado estricto crítico para manejar modelos de datos complejos (contenedores, jugadores, eventos).
2. **RxJS integrado**: Ideal para manejar streams de datos en tiempo real desde el backend (WebSockets, SSE).
3. **Angular Material**: Componentes UI de calidad para el dashboard sin necesidad de librerías externas.
4. **Inyección de dependencias**: Facilita la separación de servicios (API, IA, WebSocket).
5. **Contexto académico**: Framework ampliamente enseñado y valorado en el ciclo DAW.

## Consecuencias

- **Positivas**: Código estructurado y mantenible, fácil de escalar con nuevos módulos de dominio.
- **Negativas**: Mayor tiempo inicial de configuración respecto a frameworks más ligeros.
- **Riesgos**: La curva de aprendizda de RxJS puede añadir complejidad en el desarrollo del chat en tiempo real.
