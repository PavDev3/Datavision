import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Domain } from '../../domain/domain.model';

const API_BASE = 'http://localhost:8000/api/v1';

@Injectable({ providedIn: 'root' })
export class DomainsService {
  constructor(private readonly http: HttpClient) {}

  getDomains(): Observable<Domain[]> {
    return this.http.get<Domain[]>(`${API_BASE}/domains`);
  }

  getDomain(id: string): Observable<Domain> {
    return this.http.get<Domain>(`${API_BASE}/domains/${id}`);
  }
}
