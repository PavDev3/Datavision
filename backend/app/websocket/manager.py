from collections import defaultdict

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: dict[str, list[WebSocket]] = defaultdict(list)

    async def connect(self, session_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections[session_id].append(websocket)

    def disconnect(self, session_id: str, websocket: WebSocket) -> None:
        connections = self._connections.get(session_id)
        if connections and websocket in connections:
            connections.remove(websocket)

    async def broadcast_json(self, session_id: str, data: dict) -> None:
        for websocket in list(self._connections.get(session_id, [])):
            try:
                await websocket.send_json(data)
            except Exception:
                self.disconnect(session_id, websocket)


manager = ConnectionManager()
