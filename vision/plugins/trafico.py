from typing import Any

from plugins.base import DomainPlugin


class TraficoPlugin(DomainPlugin):
    """Plugin del dominio Trafico (ADR-008). Clases nativas de COCO, sin fine-tuning."""

    name = "trafico"
    display_name = "Tráfico de Coches"

    def get_detector(self) -> Any:
        from ultralytics import YOLO

        return YOLO("yolov8n.pt")

    def get_tracked_classes(self) -> list[str]:
        return ["car", "truck", "bus", "motorcycle", "person"]

    def get_metrics(self) -> list[dict[str, Any]]:
        return []

    def get_ai_tools(self) -> list[dict[str, Any]]:
        return []

    def process_frame(self, frame: Any, detections: Any) -> dict[str, Any] | None:
        return None
