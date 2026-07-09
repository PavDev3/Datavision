import { Component, HostListener, Input, ChangeDetectionStrategy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

// PROTOTYPE — barra flotante para cambiar de variante. Ver NOTES.md. No debe llegar a produccion.

export interface VariantDef {
  key: string;
  name: string;
}

@Component({
  selector: 'app-prototype-switcher',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="switcher">
      <button type="button" (click)="cycle(-1)" aria-label="Variante anterior">&larr;</button>
      <span class="label">{{ currentLabel() }}</span>
      <button type="button" (click)="cycle(1)" aria-label="Variante siguiente">&rarr;</button>
    </div>
  `,
  styles: [
    `
      .switcher {
        position: fixed;
        bottom: 16px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 16px;
        border-radius: 999px;
        background: #111;
        color: #fff;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
        z-index: 1000;
        font-family: monospace;
      }
      button {
        background: #333;
        color: #fff;
        border: none;
        border-radius: 50%;
        width: 28px;
        height: 28px;
        cursor: pointer;
        font-size: 14px;
      }
      button:hover {
        background: #555;
      }
      .label {
        min-width: 160px;
        text-align: center;
        font-size: 13px;
      }
    `,
  ],
})
export class PrototypeSwitcherComponent {
  @Input({ required: true }) variants: VariantDef[] = [];
  @Input({ required: true }) current = '';

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}

  currentLabel(): string {
    const found = this.variants.find((v) => v.key === this.current);
    return found ? `${found.key} — ${found.name}` : this.current;
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return;
    if (target?.isContentEditable) return;

    if (event.key === 'ArrowLeft') this.cycle(-1);
    if (event.key === 'ArrowRight') this.cycle(1);
  }

  cycle(direction: number): void {
    const idx = this.variants.findIndex((v) => v.key === this.current);
    const nextIdx = (idx + direction + this.variants.length) % this.variants.length;
    const next = this.variants[nextIdx].key;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { variant: next },
      queryParamsHandling: 'merge',
    });
  }
}
