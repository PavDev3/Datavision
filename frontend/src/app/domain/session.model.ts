export interface Session {
  id: string;
  domain_id: string;
  source_id: string;
  started_at: string;
  ended_at: string | null;
}

export interface SessionCreate {
  domain_id: string;
  source_id: string;
}
