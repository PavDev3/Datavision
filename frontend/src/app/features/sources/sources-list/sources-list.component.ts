import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { Subject, switchMap } from 'rxjs';

import { DomainsService } from '../../../core/services/domains.service';
import { SourcesService } from '../../../core/services/sources.service';
import { Source } from '../../../domain/source.model';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-sources-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule],
  templateUrl: './sources-list.component.html',
  styleUrl: './sources-list.component.scss',
})
export class SourcesListComponent {
  private readonly domainsService = inject(DomainsService);
  private readonly sourcesService = inject(SourcesService);
  private readonly dialog = inject(MatDialog);

  private readonly reload$ = new Subject<void>();

  readonly domains = toSignal(this.domainsService.getDomains(), { initialValue: [] });
  readonly sources = toSignal(
    this.reload$.pipe(switchMap(() => this.sourcesService.getSources())),
    { initialValue: [] },
  );
  readonly errorMessage = signal<string | null>(null);

  private readonly domainNameById = computed(() => {
    const map = new Map<string, string>();
    for (const domain of this.domains()) {
      map.set(domain.id, domain.display_name);
    }
    return map;
  });

  constructor() {
    this.reload$.next();
  }

  domainNameFor(domainId: string): string {
    return this.domainNameById().get(domainId) ?? '—';
  }

  zoneCountFor(source: { zones_geometry: Record<string, unknown> }): number {
    return Object.keys(source.zones_geometry ?? {}).length;
  }

  deleteSource(source: Source): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar fuente',
        message: `¿Seguro que quieres eliminar "${source.name}"? Esta acción no se puede deshacer.`,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;

      this.errorMessage.set(null);
      this.sourcesService.deleteSource(source.id).subscribe({
        next: () => this.reload$.next(),
        error: (err) => {
          const detail = err?.error?.detail ?? 'No se ha podido eliminar la fuente.';
          this.errorMessage.set(detail);
        },
      });
    });
  }
}
