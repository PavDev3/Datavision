export interface FrameMessage {
  type: 'frame';
  frame_number: number;
  timestamp: string;
  fps: number;
  object_count: number;
  class_counts: Record<string, number>;
  image: string;
}
