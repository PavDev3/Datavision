export type SourceType = 'file' | 'rtsp' | 'camera' | 'http';

export interface ZoneGeometry {
  points: [number, number][];
}

export type ZonesGeometry = Record<string, ZoneGeometry>;

export interface Source {
  id: string;
  domain_id: string;
  name: string;
  type: SourceType;
  url: string;
  zones_geometry: ZonesGeometry;
  created_at: string;
}

export interface SourceCreate {
  name: string;
  type: SourceType;
  url: string;
  domain_id: string;
}

export interface SourcePreview {
  image_base64: string;
}
