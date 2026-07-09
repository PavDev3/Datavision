import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Source, SourceCreate, SourcePreview, ZonesGeometry } from '../../domain/source.model';

const API_BASE = 'http://localhost:8000/api/v1';

@Injectable({ providedIn: 'root' })
export class SourcesService {
  constructor(private readonly http: HttpClient) {}

  createSource(payload: SourceCreate): Observable<Source> {
    return this.http.post<Source>(`${API_BASE}/sources`, payload);
  }

  getSources(domainId?: string): Observable<Source[]> {
    let params = new HttpParams();
    if (domainId) {
      params = params.set('domain_id', domainId);
    }
    return this.http.get<Source[]>(`${API_BASE}/sources`, { params });
  }

  getSource(id: string): Observable<Source> {
    return this.http.get<Source>(`${API_BASE}/sources/${id}`);
  }

  getSourcePreview(id: string): Observable<SourcePreview> {
    return this.http.get<SourcePreview>(`${API_BASE}/sources/${id}/preview`);
  }

  updateSourceZones(id: string, zonesGeometry: ZonesGeometry): Observable<Source> {
    return this.http.patch<Source>(`${API_BASE}/sources/${id}/zones`, {
      zones_geometry: zonesGeometry,
    });
  }

  deleteSource(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/sources/${id}`);
  }
}
