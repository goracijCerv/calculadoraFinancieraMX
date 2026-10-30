import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { formatEditorialIndex } from './format-editorial-index';

/**
 * `NumberedIndexComponent` — índice editorial de dos dígitos (Req 1.3, 9.5).
 *
 * Renderiza la posición de una calculadora como índice editorial con relleno
 * de cero (01, 02, 03…). Recibe la posición 1-based por `value` y delega el
 * formato en el helper puro `formatEditorialIndex`, de modo que el formato
 * pueda validarse con pruebas de propiedad (tarea 5.4) sin instanciar el
 * componente.
 *
 * Estilo: sólo tokens aprobados (tipografía Inter, `--letter-spacing-wide`,
 * `--font-size-xs`, color de texto secundario). SCSS puro, sin emojis ni
 * efectos excluidos por Req 9.6.
 */
@Component({
  selector: 'app-numbered-index',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './numbered-index.scss',
  templateUrl: './numbered-index.html',
})
export class NumberedIndexComponent {
  /** Posición editorial 1-based de la calculadora (1 → "01"). */
  readonly value = input.required<number>();

  /** Índice formateado de dos dígitos con relleno de cero. */
  protected readonly formatted = computed(() => formatEditorialIndex(this.value()));
}
