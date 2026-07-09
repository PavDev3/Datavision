import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

import { PrototypeSwitcherComponent, VariantDef } from './prototype-switcher.component';
import { VariantAMapVideoComponent } from './variant-a-map-video.component';
import { VariantBSchematicAnalyticsComponent } from './variant-b-schematic-analytics.component';
import { VariantCDenseGridComponent } from './variant-c-dense-grid.component';

// PROTOTYPE — tres variantes del dashboard de Trafico, ver NOTES.md. Borrar toda esta carpeta
// (incluida esta ruta en app.routes.ts) una vez elegida la variante ganadora.

const VARIANTS: VariantDef[] = [
  { key: 'A', name: 'Mapa real + video' },
  { key: 'B', name: 'Plano esquematico + analitica' },
  { key: 'C', name: 'Panel denso (grid)' },
];

@Component({
  selector: 'app-dashboard-prototype',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PrototypeSwitcherComponent,
    VariantAMapVideoComponent,
    VariantBSchematicAnalyticsComponent,
    VariantCDenseGridComponent,
  ],
  template: `
    @switch (variant()) {
      @case ('B') {
        <app-variant-b-schematic-analytics />
      }
      @case ('C') {
        <app-variant-c-dense-grid />
      }
      @default {
        <app-variant-a-map-video />
      }
    }
    <app-prototype-switcher [variants]="variants" [current]="variant()" />
  `,
})
export class DashboardPrototypeComponent {
  private readonly route = inject(ActivatedRoute);

  readonly variants = VARIANTS;

  readonly variant = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('variant') ?? 'A')),
    { initialValue: 'A' },
  );
}
