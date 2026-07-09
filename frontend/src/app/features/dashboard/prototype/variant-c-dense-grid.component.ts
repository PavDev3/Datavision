import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import type { EChartsCoreOption } from 'echarts/core';

import { MockDashboardService } from './mock-dashboard.service';
import { echarts } from './echarts-setup';

// PROTOTYPE — Variante C: panel denso tipo grid/bento, todo visible a la vez. Ver NOTES.md.

@Component({
  selector: 'app-variant-c-dense-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatCardModule, MatListModule, MatProgressBarModule, NgxEchartsDirective],
  providers: [provideEchartsCore({ echarts })],
  templateUrl: './variant-c-dense-grid.component.html',
  styleUrl: './variant-c-dense-grid.component.scss',
})
export class VariantCDenseGridComponent {
  private readonly mock = inject(MockDashboardService);

  readonly zones = this.mock.zones;
  readonly events = this.mock.events;
  readonly classCounts = this.mock.classCounts;
  readonly totalVehicles = this.mock.totalVehicles;
  readonly mostCongestedZone = this.mock.mostCongestedZone;

  readonly barOptions = computed<EChartsCoreOption>(() => ({
    grid: { left: 60, right: 16, top: 8, bottom: 24 },
    xAxis: { type: 'value' },
    yAxis: { type: 'category', data: this.mock.classCounts().map((c) => c.label), axisLabel: { fontSize: 10 } },
    tooltip: { trigger: 'axis' },
    series: [
      {
        type: 'bar',
        data: this.mock.classCounts().map((c) => c.count),
        color: '#1976d2',
        barMaxWidth: 18,
      },
    ],
  }));
}
