import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * `EditorialSignatureComponent` — "firma" editorial propia (SVG).
 *
 * Trazo manuscrito estilizado que aporta carácter editorial al recibo y al pie
 * del resultado. Es un SVG propio (no Lucide) con `currentColor`, trazo fino y
 * una rúbrica abstracta (no representa una firma real ni texto legible).
 *
 * Accesibilidad: decorativa por defecto (`aria-hidden="true"`). Si se pasa
 * `label`, pasa a ser informativa (`role="img"` + `aria-label`).
 *
 * Sin gradientes, glow, blobs ni glassmorphism (Req 9.6); respeta la paleta
 * aprobada vía `currentColor`.
 *
 * Requirements: 9.2, 9.6, 13.1, 13.3
 */
@Component({
  selector: 'app-editorial-signature',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './editorial-signature.component.scss',
  template: `
    <svg
      class="app-editorial-signature"
      viewBox="0 0 120 40"
      [attr.width]="width()"
      [attr.height]="height()"
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
      <!-- Rúbrica abstracta: un trazo continuo con bucles, sin letras reales. -->
      <path
        d="M4 28c8-2 12-12 16-12s3 10 7 10 7-16 11-16 2 18 6 18 6-12 10-12"
      />
      <!-- Remate inferior de la rúbrica. -->
      <path d="M70 30c14 2 30 2 46-2" />
    </svg>
  `,
})
export class EditorialSignatureComponent {
  /** Ancho del SVG en px (mantiene la relación 3:1 del lienzo 120×40). */
  readonly width = input<number>(96);

  /** Etiqueta accesible opcional; si se omite, la firma es decorativa. */
  readonly label = input<string | undefined>(undefined);

  /** Alto derivado del ancho conservando la proporción 120×40. */
  protected readonly height = computed(() => Math.round((this.width() * 40) / 120));

  /** Verdadero cuando no hay etiqueta accesible. */
  protected readonly isDecorative = computed(() => {
    const value = this.label();
    return value === undefined || value.trim().length === 0;
  });
}
