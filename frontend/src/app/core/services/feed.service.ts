import { Injectable, signal } from '@angular/core';

import { FrameMessage } from '../../domain/frame.model';

const WS_BASE = 'ws://localhost:8000';

@Injectable({ providedIn: 'root' })
export class FeedService {
  private socket: WebSocket | null = null;

  readonly frame = signal<FrameMessage | null>(null);
  readonly connected = signal(false);

  connect(sessionId: string): void {
    this.disconnect();

    const socket = new WebSocket(`${WS_BASE}/ws/feed/${sessionId}`);
    socket.onopen = () => this.connected.set(true);
    socket.onclose = () => this.connected.set(false);
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data) as FrameMessage;
      if (data.type === 'frame') {
        this.frame.set(data);
      }
    };

    this.socket = socket;
  }

  disconnect(): void {
    this.socket?.close();
    this.socket = null;
    this.connected.set(false);
    this.frame.set(null);
  }
}
