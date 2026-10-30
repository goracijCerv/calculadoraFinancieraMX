import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import type { BreakdownItem } from '../../../core/calculation/calculation.types';
import { DividerComponent } from '../divider/divider.component';

/**
 * `BreakdownListComponent` — desglose editorial del resultado (Req 3.3, 9.4).
 *
 * Presenta los conceptos de un `CalculationResult` como filas separadas por
 * divisores de 1px (`DividerComponent`, color de bordes #E5E0E2), SIN usar una
 * tarjeta por importe (Req 9.4). Cada fila muestra el concepto y su importe
 * formateado como moneda.
 *
 * El divisor se intercala ENTRE filas (no después de la última) para una
 * separación editorial limpia. Solo tokens aprobados; SCSS puro, sin emojis.
 *
 * Requirements: 3.3, 9.4
 */
@Component({
  selector: 'app-breakdown-list',
  imports: [CurrencyPipe, DecimalPipe, DividerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './breakdown-list.html',
  styleUrl: './breakdown-list.scss',
})
export class BreakdownListComponent {
  /** Conceptos del desglose (Req 3.3). */
  readonly items = input.required<BreakdownItem[]>();

  /** Unidad de los importes: pesos (por defecto) o días. */
  readonly unit = input<'currency' | 'days'>('currency');

  /** Código ISO de la moneda (MXN por defecto). */
  readonly currencyCode = input<string>('MXN');

  /** Símbolo/forma a mostrar: 'symbol' | 'code' | 'symbol-narrow'. */
  readonly currencyDisplay = input<'symbol' | 'code' | 'symbol-narrow'>('symbol');

  /** Formato de dígitos del `CurrencyPipe` (2 decimales por defecto). */
  readonly digitsInfo = input<string>('1.2-2');

  /**
   * Locale de formateo. Por defecto `undefined` para usar el `LOCALE_ID` de la
   * aplicación sin exigir registrar datos de locale adicionales.
   */
  readonly locale = input<string | undefined>(undefined);
}
