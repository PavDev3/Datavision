import { AfterViewInit, Component, ChangeDetectionStrategy, ElementRef, OnDestroy, ViewChild, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import * as L from 'leaflet';

import { MockDashboardService } from './mock-dashboard.service';

// PROTOTYPE — Variante A: mapa real (Leaflet) + panel de video en vivo. Ver NOTES.md.

// Coordenadas orientativas de Town Quay, Southampton (origen del video grabado).
const JUNCTION_CENTER: L.LatLngExpression = [50.8969, -1.4045];

@Component({
  selector: 'app-variant-a-map-video',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatCardModule],
  templateUrl: './variant-a-map-video.component.html',
  styleUrl: './variant-a-map-video.component.scss',
})
export class VariantAMapVideoComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapEl') mapEl!: ElementRef<HTMLDivElement>;

  private readonly mock = inject(MockDashboardService);
  private map?: L.Map;
  readonly data = this.mock.zones;
  readonly totalVehicles = this.mock.totalVehicles;

  constructor() {
    effect(() => {
      const zones = this.mock.zones();
      if (!this.map) return;
      zones.forEach((zone, i) => this.updateMarker(zone.name, zone.count, zone.occupancyPct, i));
    });
  }

  ngAfterViewInit(): void {
    this.map = L.map(this.mapEl.nativeElement, { zoomControl: false }).setView(JUNCTION_CENTER, 17);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    const offsets: [number, number][] = [
      [0.0006, 0],
      [-0.0006, 0],
      [0, 0.0006],
      [0, -0.0006],
    ];
    this.mock.zones().forEach((zone, i) => {
      const [dLat, dLng] = offsets[i];
      const pos: L.LatLngExpression = [
        (JUNCTION_CENTER as [number, number])[0] + dLat,
        (JUNCTION_CENTER as [number, number])[1] + dLng,
      ];
      const marker = L.circleMarker(pos, {
        radius: 14,
        color: '#fff',
        weight: 2,
        fillColor: this.colorFor(zone.occupancyPct),
        fillOpacity: 0.85,
      }).addTo(this.map!);
      marker.bindTooltip(`${zone.label}: ${zone.count}`, { permanent: true, direction: 'top' });
      (marker as any)._zoneName = zone.name;
      this.markers.set(zone.name, marker);
    });
  }

  private markers = new Map<string, L.CircleMarker>();

  private updateMarker(name: string, count: number, occupancyPct: number, _i: number): void {
    const marker = this.markers.get(name);
    if (!marker) return;
    marker.setStyle({ fillColor: this.colorFor(occupancyPct) });
    marker.setTooltipContent(`${count}`);
  }

  private colorFor(occupancyPct: number): string {
    if (occupancyPct >= 80) return '#e53935';
    if (occupancyPct >= 50) return '#fb8c00';
    return '#43a047';
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }
}
