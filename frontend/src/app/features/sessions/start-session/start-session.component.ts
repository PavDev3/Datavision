import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { switchMap, of } from 'rxjs';

import { DomainsService } from '../../../core/services/domains.service';
import { SourcesService } from '../../../core/services/sources.service';
import { SessionsService } from '../../../core/services/sessions.service';

@Component({
  selector: 'app-start-session',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  templateUrl: './start-session.component.html',
  styleUrl: './start-session.component.scss',
})
export class StartSessionComponent {
  private readonly fb = inject(FormBuilder);
  private readonly domainsService = inject(DomainsService);
  private readonly sourcesService = inject(SourcesService);
  private readonly sessionsService = inject(SessionsService);
  private readonly router = inject(Router);

  readonly domains = toSignal(this.domainsService.getDomains(), { initialValue: [] });

  readonly starting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    domain_id: ['', Validators.required],
    source_id: ['', Validators.required],
  });

  readonly sources = toSignal(
    this.form.controls.domain_id.valueChanges.pipe(
      switchMap((domainId) => (domainId ? this.sourcesService.getSources(domainId) : of([]))),
    ),
    { initialValue: [] },
  );

  onDomainChange(): void {
    this.form.controls.source_id.setValue('');
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.starting.set(true);
    this.errorMessage.set(null);

    this.sessionsService.createSession(this.form.getRawValue()).subscribe({
      next: (session) => {
        this.sessionsService.startSession(session.id).subscribe({
          next: () => {
            this.starting.set(false);
            this.router.navigate(['/live', session.id]);
          },
          error: () => {
            this.starting.set(false);
            this.errorMessage.set(
              'Sesión creada, pero no se ha podido arrancar el motor de visión.',
            );
          },
        });
      },
      error: () => {
        this.starting.set(false);
        this.errorMessage.set('No se ha podido crear la sesión.');
      },
    });
  }
}
