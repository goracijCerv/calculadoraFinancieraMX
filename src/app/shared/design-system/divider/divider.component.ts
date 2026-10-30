import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Orientación del divisor. */
export type DividerOrientation = 'horizontal' | 'vertical';

/**
 * `DividerComponent` — filete/divisor editorial de 1px (Req 9.4).
 *
 * Renderiza una regla de 1px en el color de bordes aprobado (#E5E0E2 vía el
 * token `--rule-color`). Separa los conceptos del desglose sin recurrir a una
 * tarjeta por importe. Es decorativo: expone `role="separator"` para lectores
 * de pantalla. SCSS puro, sin emojis.
 *
 * Requirements: 9.4
 */
@Component({
  selector: 'app-divider',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
  styleUrl: './divider.component.scss',
  host: {
    role: 'separator',
    '[attr.aria-orientation]': 'orientation()',
    '[class.app-divider]': 'true',
    '[class.app-divider--vertical]': "orientation() === 'vertical'",
  },
})
export class DividerComponent {
  /** Orientación del divisor; horizontal por defecto. */
  readonly orientation = input<DividerOrientation>('horizontal');

  /** Expuesto para pruebas/legibilidad del binding del host. */
  protected readonly isVertical = computed(() => this.orientation() === 'vertical');
}
