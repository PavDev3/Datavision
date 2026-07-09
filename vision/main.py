"""Motor de vision de DataVision.

Modo por defecto (sin --publish): abre una fuente de video (cualquier
fichero soportado por cv2.VideoCapture, indicado via --source), corre
deteccion por frame con un YOLOv8n preentrenado en COCO (sin fine-tuning:
car/truck/bus/motorcycle/person ya son clases nativas, ver ADR-004 y
ADR-008) y muestra un resumen final con frames procesados, FPS medio y
conteo de objetos por clase.

Modo --publish: ademas de detectar, trackea con ByteTrack (IDs persistentes
por objeto), anota cada frame publicado con las cajas+etiquetas de
Supervision, calcula la zona de cada deteccion contra la geometria
guardada en la fuente (ver docs/wayfinder/tickets/002-geometria-zonas.md),
y publica al backend via HTTP (POST /api/v1/internal/frames) throttled a
--fps-limit, para que se persista y se retransmita por WebSocket al
frontend (ver docs/wayfinder/tickets/001-persistencia-feed-en-vivo.md).
"""

import argparse
import base64
import time
from collections import Counter
from dataclasses import dataclass, field
from datetime import datetime, timezone

import cv2
import numpy as np


@dataclass
class ProcessingSummary:
    """Resultado de procesar una fuente de video frame a frame."""

    frame_count: int = 0
    elapsed_seconds: float = 0.0
    class_counts: Counter = field(default_factory=Counter)

    @property
    def fps(self) -> float:
        if self.elapsed_seconds <= 0:
            return 0.0
        return self.frame_count / self.elapsed_seconds


def process_video(source: str, model=None, detect: bool = True) -> ProcessingSummary:
    """Recorre todos los frames de `source` y acumula estadisticas.

    Si `model` es None y `detect` es True, se carga un YOLOv8n preentrenado
    de forma perezosa (solo cuando hace falta correr inferencia real), para
    poder testear el conteo de frames sin necesitar el modelo ni red.
    """
    cap = cv2.VideoCapture(source)
    if not cap.isOpened():
        raise FileNotFoundError(f"No se ha podido abrir la fuente de video: {source}")

    if detect and model is None:
        from ultralytics import YOLO

        model = YOLO("yolov8n.pt")

    summary = ProcessingSummary()
    start = time.perf_counter()

    try:
        while True:
            ok, frame = cap.read()
            if not ok:
                break

            summary.frame_count += 1

            if detect and model is not None:
                results = model(frame, verbose=False)[0]
                names = results.names
                for cls_id in results.boxes.cls.tolist():
                    summary.class_counts[names[int(cls_id)]] += 1
    finally:
        cap.release()

    summary.elapsed_seconds = time.perf_counter() - start
    return summary


def print_summary(summary: ProcessingSummary) -> None:
    print("=== Resumen de procesamiento ===")
    print(f"Frames procesados: {summary.frame_count}")
    print(f"Tiempo total: {summary.elapsed_seconds:.2f} s")
    print(f"FPS medio: {summary.fps:.2f}")
    print("Objetos detectados por clase:")
    if summary.class_counts:
        for cls_name, count in summary.class_counts.most_common():
            print(f"  {cls_name}: {count}")
    else:
        print("  (ninguno)")


def zone_for_point(point: tuple[float, float], zones_geometry: dict) -> str | None:
    """Devuelve el nombre de la primera zona cuyo poligono contiene `point`.

    `point` son coordenadas normalizadas (0-1). `zones_geometry` tiene la
    forma `{"entrada_norte": {"points": [[x,y], ...]}, ...}` (ver ticket
    wayfinder #2). Si `zones_geometry` esta vacio o el punto no cae en
    ninguna zona, devuelve None.
    """
    for zone_name, geometry in zones_geometry.items():
        points = geometry.get("points") or []
        if len(points) < 3:
            continue
        polygon = np.array(points, dtype=np.float32).reshape(-1, 1, 2)
        if cv2.pointPolygonTest(polygon, point, False) >= 0:
            return zone_name
    return None


def normalized_bottom_center(
    xyxy: tuple[float, float, float, float], frame_width: int, frame_height: int
) -> tuple[float, float]:
    """Centro inferior del bbox, normalizado 0-1 (ver ticket wayfinder #2)."""
    x1, _y1, x2, y2 = xyxy
    return ((x1 + x2) / 2) / frame_width, y2 / frame_height


def fetch_session_context(client, backend_url: str, session_id: str) -> tuple[dict, str]:
    """Resuelve la geometria de zonas y el nombre de dominio de `session_id`.

    Devuelve `(zones_geometry, domain_name)`. `domain_name` se usa para
    resolver el DomainPlugin correspondiente en `plugins.DOMAIN_REGISTRY`.
    """
    session_resp = client.get(f"{backend_url}/api/v1/sessions/{session_id}")
    session_resp.raise_for_status()
    session_data = session_resp.json()
    source_id = session_data["source_id"]
    domain_id = session_data["domain_id"]

    source_resp = client.get(f"{backend_url}/api/v1/sources/{source_id}")
    source_resp.raise_for_status()
    zones_geometry = source_resp.json().get("zones_geometry") or {}

    domain_resp = client.get(f"{backend_url}/api/v1/domains/{domain_id}")
    domain_resp.raise_for_status()
    domain_name = domain_resp.json()["name"]

    return zones_geometry, domain_name


def allowed_class_ids(names: dict[int, str], tracked_classes: list[str]) -> set[int]:
    """IDs de clase COCO cuyo nombre esta en `tracked_classes`.

    `names` es el dict {class_id: class_name} que expone un resultado de
    Ultralytics (`results.names`). Se usa para filtrar las detecciones al
    vocabulario de un DomainPlugin antes de trackear (ver DomainPlugin en
    `plugins/base.py`), evitando falsos positivos de clases irrelevantes
    para el dominio (p.ej. "train" detectado sobre un edificio en Trafico).
    """
    wanted = set(tracked_classes)
    return {class_id for class_id, name in names.items() if name in wanted}


def publish_video(
    source: str,
    session_id: str,
    backend_url: str = "http://localhost:8000",
    fps_limit: float = 8.0,
) -> None:
    """Procesa `source` con tracking+anotacion y publica al backend en vivo."""
    import httpx
    import supervision as sv
    from ultralytics import YOLO

    from plugins import DOMAIN_REGISTRY

    cap = cv2.VideoCapture(source)
    if not cap.isOpened():
        raise FileNotFoundError(f"No se ha podido abrir la fuente de video: {source}")

    native_fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    publish_every_n = max(1, round(native_fps / fps_limit))

    model = YOLO("yolov8n.pt")
    tracker = sv.ByteTrack()
    box_annotator = sv.BoxAnnotator(color_lookup=sv.ColorLookup.CLASS)
    label_annotator = sv.LabelAnnotator(color_lookup=sv.ColorLookup.CLASS)

    frame_number = 0

    try:
        with httpx.Client(timeout=10.0) as client:
            zones_geometry, domain_name = fetch_session_context(client, backend_url, session_id)
            print(f"Geometria de zonas cargada: {list(zones_geometry.keys()) or '(vacia)'}")

            plugin = DOMAIN_REGISTRY.get(domain_name)
            if plugin is None:
                raise ValueError(
                    f"No hay DomainPlugin registrado para el dominio '{domain_name}' "
                    f"(disponibles: {list(DOMAIN_REGISTRY.keys())})"
                )
            tracked_classes = plugin.get_tracked_classes()
            print(f"Dominio '{domain_name}': clases rastreadas = {tracked_classes}")

            while True:
                ok, frame = cap.read()
                if not ok:
                    break
                frame_number += 1

                if frame_number % publish_every_n != 0:
                    continue

                height, width = frame.shape[:2]
                results = model(frame, verbose=False)[0]
                names = results.names

                detections = sv.Detections.from_ultralytics(results)

                wanted_ids = allowed_class_ids(names, tracked_classes)
                mask = np.isin(detections.class_id, list(wanted_ids))
                detections = detections[mask]

                detections = tracker.update_with_detections(detections)

                labels = [
                    f"#{tracker_id} {names[int(class_id)]}"
                    for tracker_id, class_id in zip(detections.tracker_id, detections.class_id)
                ]
                annotated = frame.copy()
                annotated = box_annotator.annotate(scene=annotated, detections=detections)
                annotated = label_annotator.annotate(
                    scene=annotated, detections=detections, labels=labels
                )

                class_counts: Counter = Counter()
                detections_payload = []
                for i in range(len(detections)):
                    x1, y1, x2, y2 = (float(v) for v in detections.xyxy[i])
                    class_name = names[int(detections.class_id[i])]
                    class_counts[class_name] += 1

                    px, py = normalized_bottom_center((x1, y1, x2, y2), width, height)
                    zone = zone_for_point((px, py), zones_geometry)

                    detections_payload.append(
                        {
                            "tracker_id": int(detections.tracker_id[i]),
                            "class_name": class_name,
                            "bbox": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
                            "zone": zone,
                            "x": px,
                            "y": py,
                            "confidence": float(detections.confidence[i]),
                        }
                    )

                ok, buffer = cv2.imencode(".jpg", annotated)
                if not ok:
                    continue
                image_base64 = base64.b64encode(buffer).decode("ascii")

                payload = {
                    "session_id": session_id,
                    "frame_number": frame_number,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "fps": fps_limit,
                    "object_count": len(detections),
                    "class_counts": dict(class_counts),
                    "image_base64": image_base64,
                    "detections": detections_payload,
                }

                response = client.post(f"{backend_url}/api/v1/internal/frames", json=payload)
                response.raise_for_status()
                print(f"frame {frame_number}: {len(detections)} objetos publicados")
    finally:
        cap.release()


def parse_args(argv=None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Motor de vision de DataVision: procesa un video y cuenta "
        "objetos detectados por clase con YOLOv8n preentrenado en COCO."
    )
    parser.add_argument(
        "--source",
        required=True,
        help="Ruta al fichero de video a procesar (cualquier formato soportado "
        "por cv2.VideoCapture).",
    )
    parser.add_argument(
        "--publish",
        action="store_true",
        help="Activa tracking+anotacion+publicacion en vivo al backend "
        "(requiere --session-id).",
    )
    parser.add_argument(
        "--session-id",
        default=None,
        help="ID de la sesion ya creada en el backend (obligatorio con --publish).",
    )
    parser.add_argument(
        "--backend-url",
        default="http://localhost:8000",
        help="URL base del backend (default: http://localhost:8000).",
    )
    parser.add_argument(
        "--fps-limit",
        type=float,
        default=8.0,
        help="Tasa de publicacion objetivo en fps (default: 8.0).",
    )
    return parser.parse_args(argv)


def main() -> None:
    args = parse_args()

    if args.publish:
        if not args.session_id:
            raise SystemExit("--session-id es obligatorio cuando se usa --publish")
        publish_video(args.source, args.session_id, args.backend_url, args.fps_limit)
    else:
        summary = process_video(args.source)
        print_summary(summary)


if __name__ == "__main__":
    main()
