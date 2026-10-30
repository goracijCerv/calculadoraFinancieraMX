import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * `ReceiptDetailComponent` — detalle tipo recibo del resultado (Req 3.7).
 *
 * Muestra el folio y la fecha de cálculo que la presentación genera en
 * `CalculatorPageComponent` (tarea 11.4). No calcula ni lee `Date` por su
 * cuenta: ambos valores llegan por entrada, de modo que el componente sea
 * determinista y fácil de probar.
 *
 * Solo tokens aprobados; SCSS puro, sin emojis ni efectos excluidos (Req 9.6).
 *
 * Requirements: 3.7
 */
@Component({
  selector: 'app-receipt-detail',
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './receipt-detail.html',
  styleUrl: './receipt-detail.scss',
})
export class ReceiptDetailComponent {
  /** Folio del recibo (generado por la presentación). */
  readonly folio = input.required<string>();

  /** Fecha de cálculo (generada por la presentación). */
  readonly date = input.required<Date>();

  /** Formato de fecha del `DatePipe` (medio por defecto). */
  readonly dateFormat = input<string>('mediumDate');

  /** Etiqueta del folio. */
  readonly folioLabel = input<string>('Folio');

  /** Etiqueta de la fecha. */
  readonly dateLabel = input<string>('Fecha de cálculo');
}
