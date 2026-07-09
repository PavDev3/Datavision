"""Tests del esqueleto del motor de vision.

Genera un video sintetico corto y determinista con cv2.VideoWriter (unas
pocas formas simples dibujadas frame a frame) para comprobar que la logica
de conteo de frames de `main.process_video` es correcta, sin depender del
video real que aporte el usuario ni de descargar el modelo YOLO.
"""

import cv2
import numpy as np
import pytest

from main import allowed_class_ids, process_video

FRAME_COUNT = 12
FRAME_SIZE = (64, 48)  # (width, height)
FPS = 10.0


@pytest.fixture
def synthetic_video_path(tmp_path):
    """Crea un video sintetico corto y devuelve su ruta."""
    video_path = tmp_path / "synthetic.mp4"
    width, height = FRAME_SIZE

    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(str(video_path), fourcc, FPS, (width, height))
    assert writer.isOpened(), "No se ha podido abrir VideoWriter para el fixture"

    try:
        for i in range(FRAME_COUNT):
            frame = np.zeros((height, width, 3), dtype=np.uint8)
            # Un rectangulo simple que se desplaza para que los frames no
            # sean identicos (no relevante para el conteo, solo realismo).
            cv2.rectangle(
                frame,
                (i % width, i % height),
                (min(i % width + 10, width - 1), min(i % height + 10, height - 1)),
                (0, 255, 0),
                -1,
            )
            writer.write(frame)
    finally:
        writer.release()

    return str(video_path)


def test_process_video_counts_all_frames(synthetic_video_path):
    summary = process_video(synthetic_video_path, detect=False)

    assert summary.frame_count == FRAME_COUNT


def test_process_video_computes_positive_fps(synthetic_video_path):
    summary = process_video(synthetic_video_path, detect=False)

    assert summary.elapsed_seconds > 0
    assert summary.fps > 0


def test_process_video_missing_source_raises():
    with pytest.raises(FileNotFoundError):
        process_video("no/such/video/exists.mp4", detect=False)


def test_allowed_class_ids_filters_to_tracked_classes():
    coco_names = {0: "person", 2: "car", 6: "train", 7: "truck", 56: "chair"}

    result = allowed_class_ids(coco_names, ["car", "truck", "person"])

    assert result == {0, 2, 7}


def test_allowed_class_ids_empty_when_no_match():
    coco_names = {6: "train", 56: "chair"}

    result = allowed_class_ids(coco_names, ["car", "truck", "person"])

    assert result == set()
