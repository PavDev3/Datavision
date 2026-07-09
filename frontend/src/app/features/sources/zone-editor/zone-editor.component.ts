import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

import { DomainsService } from '../../../core/services/domains.service';
import { SourcesService } from '../../../core/services/sources.service';
import { ZonesGeometry } from '../../../domain/source.model';

const PALETTE = ['#e53935', '#1e88e5', '#43a047', '#fb8c00', '#8e24aa', '#00acc1'];

@Component({
  selector: 'app-zone-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatSelectModule,
    MatFormFieldModule,
  ],
  templateUrl: './zone-editor.component.html',
  styleUrl: './zone-editor.component.scss',
})
export class ZoneEditorComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly sourcesService = inject(SourcesService);
  private readonly domainsService = inject(DomainsService);

  private sourceId = '';

  readonly previewImage = signal<string | null>(null);
  readonly zoneNames = signal<string[]>([]);
  readonly zonesGeometry = signal<ZonesGeometry>({});
  readonly selectedZone = signal<string | null>(null);
  readonly currentPoints = signal<[number, number][]>([]);
  readonly saving = signal(false);
  readonly savedMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.sourceId = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.sourceId) return;

    this.sourcesService.getSource(this.sourceId).subscribe((source) => {
      this.zonesGeometry.set(source.zones_geometry ?? {});

      this.domainsService.getDomain(source.domain_id).subscribe((domain) => {
        this.zoneNames.set(domain.config?.zones ?? []);
      });
    });

    this.sourcesService.getSourcePreview(this.sourceId).subscribe({
      next: (preview) => this.previewImage.set(`data:image/jpeg;base64,${preview.image_base64}`),
      error: () => this.errorMessage.set('No se ha podido cargar la vista previa del vídeo.'),
    });
  }

  colorFor(zoneName: string): string {
    const index = this.zoneNames().indexOf(zoneName);
    return PALETTE[index % PALETTE.length] ?? '#999';
  }

  pointsToSvgString(points: [number, number][]): string {
    return points.map(([x, y]) => `${x},${y}`).join(' ');
  }

  onSvgClick(event: MouseEvent): void {
    if (!this.selectedZone()) return;
    const svg = event.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    this.currentPoints.update((points) => [...points, [x, y]]);
  }

  closeZone(): void {
    const zone = this.selectedZone();
    if (!zone || this.currentPoints().length < 3) return;

    this.zonesGeometry.update((geometry) => ({
      ...geometry,
      [zone]: { points: this.currentPoints() },
    }));
    this.currentPoints.set([]);
    this.selectedZone.set(null);
  }

  removeZone(zoneName: string): void {
    this.zonesGeometry.update((geometry) => {
      const next = { ...geometry };
      delete next[zoneName];
      return next;
    });
  }

  definedZoneNames(): string[] {
    return Object.keys(this.zonesGeometry());
  }

  save(): void {
    this.saving.set(true);
    this.savedMessage.set(null);
    this.errorMessage.set(null);

    this.sourcesService.updateSourceZones(this.sourceId, this.zonesGeometry()).subscribe({
      next: () => {
        this.saving.set(false);
        this.savedMessage.set('Zonas guardadas correctamente.');
      },
      error: () => {
        this.saving.set(false);
        this.errorMessage.set('No se han podido guardar las zonas.');
      },
    });
  }
}
