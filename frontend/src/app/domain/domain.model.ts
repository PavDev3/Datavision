export interface Domain {
  id: string;
  name: string;
  display_name: string;
  config: { zones: string[] };
}
