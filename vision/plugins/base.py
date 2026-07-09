from abc import ABC, abstractmethod
from typing import Any


class DomainPlugin(ABC):
    name: str
    display_name: str

    @abstractmethod
    def get_detector(self) -> Any:
        """Retorna el detector configurado para este dominio."""

    @abstractmethod
    def get_tracked_classes(self) -> list[str]:
        """Clases de objeto a rastrear para este dominio."""

    @abstractmethod
    def get_metrics(self) -> list[dict[str, Any]]:
        """Métricas disponibles para el dashboard de este dominio."""

    @abstractmethod
    def get_ai_tools(self) -> list[dict[str, Any]]:
        """Definiciones de tools que se exponen al LLM para este dominio."""

    @abstractmethod
    def process_frame(self, frame: Any, detections: Any) -> dict[str, Any] | None:
        """Lógica específica del dominio por frame; devuelve un evento de dominio o None."""
