import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { toSignal } from '@angular/core/rxjs-interop';

import { DomainsService } from '../../../core/services/domains.service';
import { SourcesService } from '../../../core/services/sources.service';
import { SourceType } from '../../../domain/source.model';

const SOURCE_TYPES: SourceType[] = ['file', 'rtsp', 'camera', 'http'];

@Component({
  selector: 'app-source-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './source-form.component.html',
  styleUrl: './source-form.component.scss',
})
export class SourceFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly domainsService = inject(DomainsService);
  private readonly sourcesService = inject(SourcesService);

  readonly sourceTypes = SOURCE_TYPES;
  readonly domains = toSignal(this.domainsService.getDomains(), { initialValue: [] });

  readonly submitting = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly createdSourceId = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    type: ['file' as SourceType, Validators.required],
    url: ['', Validators.required],
    domain_id: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    this.sourcesService.createSource(this.form.getRawValue()).subscribe({
      next: (source) => {
        this.submitting.set(false);
        this.successMessage.set(`Fuente "${source.name}" creada correctamente.`);
        this.createdSourceId.set(source.id);
        this.form.reset({ name: '', type: 'file', url: '', domain_id: '' });
      },
      error: (err) => {
        this.submitting.set(false);
        const detail = err?.error?.detail ?? 'No se ha podido crear la fuente.';
        this.errorMessage.set(detail);
      },
    });
  }
}
