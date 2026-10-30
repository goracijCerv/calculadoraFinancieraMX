import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * `ReceiptClipComponent` — clip del recibo, detalle editorial propio (SVG).
 *
 * Dibuja un clip/sujetapapeles estilizado que ancla visualmente el detalle
 * tipo recibo (`ReceiptDetailComponent`, Req 3.7). Es un SVG propio (no Lucide)
 * con `currentColor`, trazo fino y geometría simple (sin efectos excluidos por
 * Req 9.6).
 *
 * Decorativo por defecto (`aria-hidden="true"`); con `label` se vuelve
 * informativo (`role="img"` + `aria-label`).
 *
 * Requirements: 9.2, 9.6, 13.1, 13.3
 */
@Component({
  selector: 'app-receipt-clip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './receipt-clip.component.scss',
  template: `
    <svg
      class="app-receipt-clip"
      viewBox="0 0 24 24"
      [attr.width]="size()"
      [attr.height]="size()"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      [attr.role]="isDecorative() ? null : 'img'"
      [attr.aria-label]="isDecorative() ? null : label()"
      [attr.aria-hidden]="isDecorative() ? 'true' : null"
      [attr.focusable]="false"
    >
      <!-- Clip sujetapapeles: dos cuerpos rectangulares anidados con un lomo. -->
      <path d="M8 4h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6a4 4 0 0 1-4-4V6a2 2 0 0 1 2-2Z" />
      <path d="M12 8v8a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V7" />
    </svg>
  `,
})
export class ReceiptClipComponent {
  /** Lado del lienzo cuadrado en px. */
  readonly size = input<number>(24);

  /** Etiqueta accesible opcional; si se omite, el clip es decorativo. */
  readonly label = input<string | undefined>(undefined);

  /** Verdadero cuando no hay etiqueta accesible. */
  protected readonly isDecorative = computed(() => {
    const value = this.label();
    return value === undefined || value.trim().length === 0;
  });
}
