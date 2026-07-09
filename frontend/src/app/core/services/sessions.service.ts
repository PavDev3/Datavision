import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Session, SessionCreate } from '../../domain/session.model';

const API_BASE = 'http://localhost:8000/api/v1';

@Injectable({ providedIn: 'root' })
export class SessionsService {
  constructor(private readonly http: HttpClient) {}

  createSession(payload: SessionCreate): Observable<Session> {
    return this.http.post<Session>(`${API_BASE}/sessions`, payload);
  }

  startSession(id: string): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(`${API_BASE}/sessions/${id}/start`, {});
  }
}
