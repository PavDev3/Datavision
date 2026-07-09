import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import type { EChartsCoreOption } from 'echarts/core';

import { MockDashboardService } from './mock-dashboard.service';
import { echarts } from './echarts-setup';

// PROTOTYPE — Variante B: plano esquematico del cruce (SVG) + analitica ECharts. Ver NOTES.md.

@Component({
  selector: 'app-variant-b-schematic-analytics',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatCardModule, MatListModule, NgxEchartsDirective],
  providers: [provideEchartsCore({ echarts })],
  templateUrl: './variant-b-schematic-analytics.component.html',
  styleUrl: './variant-b-schematic-analytics.component.scss',
})
export class VariantBSchematicAnalyticsComponent {
  private readonly mock = inject(MockDashboardService);

  readonly zones = this.mock.zones;
  readonly events = this.mock.events;
  readonly totalVehicles = this.mock.totalVehicles;

  readonly zoneByName = computed(() => {
    const map = new Map<string, ReturnType<typeof this.mock.zones>[number]>();
    this.mock.zones().forEach((z) => map.set(z.name, z));
    return map;
  });

  readonly chartOptions = computed<EChartsCoreOption>(() => ({
    grid: { left: 40, right: 16, top: 16, bottom: 24 },
    xAxis: { type: 'category', data: this.mock.timeline().map((p) => p.time), axisLabel: { fontSize: 10 } },
    yAxis: { type: 'value' },
    tooltip: { trigger: 'axis' },
    series: [
      {
        type: 'line',
        data: this.mock.timeline().map((p) => p.count),
        smooth: true,
        areaStyle: { opacity: 0.15 },
        color: '#1976d2',
      },
    ],
  }));

  colorFor(occupancyPct: number): string {
    if (occupancyPct >= 80) return '#e53935';
    if (occupancyPct >= 50) return '#fb8c00';
    return '#43a047';
  }
}
