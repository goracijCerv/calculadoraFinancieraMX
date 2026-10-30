import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { ButtonComponent } from '../button/button.component';

/**
 * `ErrorStateComponent` — estado de error editorial con reintento (Req 12.2).
 *
 * Se muestra cuando ocurre un error durante un cálculo. Presenta un mensaje
 * descriptivo obligatorio (`message`), un título opcional (`title`) y una
 * acción de reintento que emite el evento `retry` al activarse. La acción de
 * reintento reutiliza `ButtonComponent` (variante primaria) del Design System
 * en lugar de un control ad-hoc.
 *
 * Estilo: sólo tokens aprobados (tipografía Playfair para el título de acento,
 * Inter para el mensaje, filete vino de acento). SCSS puro, sin emojis ni
 * efectos excluidos por Req 9.6.
 *
 * Requirements: 12.2
 */
@Component({
  selector: 'app-error-state',
  imports: [ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './error-state.html',
  styleUrl: './error-state.scss',
})
export class ErrorStateComponent {
  /** Mensaje descriptivo del error (obligatorio, Req 12.2). */
  readonly message = input.required<string>();

  /** Título editorial opcional que encabeza el estado de error. */
  readonly title = input<string>();

  /** Texto de la acción de reintento. */
  readonly retryLabel = input<string>('Reintentar');

  /** Se emite cuando el usuario solicita reintentar el cálculo (Req 12.2). */
  readonly retry = output<void>();

  /** Propaga la solicitud de reintento a quien hospeda el componente. */
  protected onRetry(): void {
    this.retry.emit();
  }
}
