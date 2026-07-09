# ADR-006: Arquitectura de dominio extensible mediante plugins

- **Estado**: Aceptado
- **Fecha**: 2026-07
- **Decisores**: Equipo de desarrollo

## Contexto

DataVision necesita soportar múltiples dominios (puerto marítimo, fútbol, baloncesto) con detecciones, métricas y visualizaciones específicas para cada uno, sin que añadir un nuevo dominio implique modificar el núcleo del sistema.

## Decisión

Se implementa una **arquitectura de dominio basada en plugins**. Cada dominio se define como un módulo independiente que implementa una interfaz común.

### Interfaz de dominio (Python)

```python
class DomainPlugin(ABC):
    name: str                        # "puerto", "futbol", "baloncesto"
    display_name: str                # "Puerto Marítimo", "Fútbol", etc.
    
    @abstractmethod
    def get_detector(self) -> sv.Detections:
        """Retorna el detector configurado para este dominio."""
    
    @abstractmethod
    def get_tracked_classes(self) -> list[str]:
        """Clases de objetos a rastrear."""
    
    @abstractmethod
    def get_metrics(self) -> list[MetricDefinition]:
        """Métricas disponibles para el dashboard."""
    
    @abstractmethod
    def get_ai_tools(self) -> list[ToolDefinition]:
        """Tools que se exponen al LLM para este dominio."""
    
    @abstractmethod
    def process_frame(self, frame, detections) -> DomainEvent:
        """Lógica específica del dominio por frame."""
```

### Registro de plugins

```python
# backend/plugins/__init__.py
DOMAIN_REGISTRY = {
    "puerto": PuertoPlugin(),
    "futbol": FutbolPlugin(),
    "baloncesto": BaloncestoPlugin(),
}
```

### Estructura de directorios

```
backend/
└── plugins/
    ├── base.py           # Interfaz abstracta DomainPlugin
    ├── puerto/
    │   ├── plugin.py
    │   ├── metrics.py
    │   └── ai_tools.py
    ├── futbol/
    │   ├── plugin.py
    │   ├── metrics.py
    │   └── ai_tools.py
    └── baloncesto/
        ├── plugin.py
        ├── metrics.py
        └── ai_tools.py
```

## Consecuencias

- **Positivas**: Añadir un nuevo dominio no modifica el núcleo; cada plugin es testeable de forma independiente.
- **Negativas**: Abstracción adicional que requiere más diseño inicial.
- **Riesgos**: Si los dominios tienen requisitos muy divergentes, la interfaz común puede volverse demasiado genérica.
