import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Variantes del botón del Design System (Req 9.1).
 * - `primary`: acción principal, superficie vino (#782F40).
 * - `secondary`: acción alterna, contorno sobre superficie neutra.
 * - `text`: acción terciaria sin fondo ni contorno.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'text';

/** Tipo nativo del botón; `button` por defecto para evitar envíos accidentales. */
export type ButtonType = 'button' | 'submit' | 'reset';

/**
 * `ButtonComponent` — botón editorial hecho a mano (sin Material/PrimeNG).
 *
 * Usa únicamente tokens aprobados del Design System (var(--...)); la variante
 * `primary` se asienta sobre el acento vino de marca. SCSS puro, sin emojis.
 *
 * Requirements: 9.1
 */
@Component({
  selector: 'app-button',
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
})
export class ButtonComponent {
  /** Variante visual del botón. */
  readonly variant = input<ButtonVariant>('primary');

  /** Tipo nativo del `<button>`. */
  readonly type = input<ButtonType>('button');

  /** Deshabilita el botón e impide la interacción. */
  readonly disabled = input(false);

  /** Hace que el botón ocupe todo el ancho disponible. */
  readonly fullWidth = input(false);

  /** Clases CSS derivadas de la variante y el ancho. */
  protected readonly classes = computed(() => ({
    'app-button': true,
    [`app-button--${this.variant()}`]: true,
    'app-button--full-width': this.fullWidth(),
  }));
}
