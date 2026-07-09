"""Arranca/para el motor de vision (vision/main.py --publish) como subproceso.

Registro en memoria, mismo patron que app/websocket/manager.py. El backend
y vision corren en la misma maquina local para la demo del TFG (ver
docs/arquitectura/hardware.md), asi que lanzar un subproceso desde FastAPI
es razonable -- no hace falta una cola de trabajos ni un orquestador aparte.
"""

import subprocess
import sys
from pathlib import Path

from app.core.config import settings


class VisionProcessManager:
    def __init__(self) -> None:
        self._processes: dict[str, subprocess.Popen] = {}

    def start(self, session_id: str, source_url: str, backend_url: str) -> subprocess.Popen:
        vision_dir = Path(settings.vision_dir).resolve()
        log_dir = vision_dir / "logs"
        log_dir.mkdir(exist_ok=True)
        log_file = open(log_dir / f"session_{session_id}.log", "w", encoding="utf-8")

        process = subprocess.Popen(
            [
                "uv",
                "run",
                "python",
                "main.py",
                "--source",
                source_url,
                "--publish",
                "--session-id",
                session_id,
                "--backend-url",
                backend_url,
            ],
            cwd=str(vision_dir),
            stdout=log_file,
            stderr=subprocess.STDOUT,
        )
        self._processes[session_id] = process
        return process

    def stop(self, session_id: str) -> None:
        process = self._processes.pop(session_id, None)
        if process is None or process.poll() is not None:
            return

        # `uv run python main.py` crea un proceso hijo real de python.exe;
        # process.terminate() en Windows solo mata el proceso "uv run" y
        # deja al hijo huerfano corriendo. taskkill /T mata el arbol entero.
        if sys.platform == "win32":
            subprocess.run(
                ["taskkill", "/F", "/T", "/PID", str(process.pid)],
                capture_output=True,
            )
        else:
            process.terminate()

    def is_running(self, session_id: str) -> bool:
        process = self._processes.get(session_id)
        return process is not None and process.poll() is None


manager = VisionProcessManager()
