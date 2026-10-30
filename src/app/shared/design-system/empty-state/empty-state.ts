import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * `EmptyStateComponent` — estado vacío editorial (Req 2.3, 12.3).
 *
 * Se muestra cuando una lista o resultado no tiene contenido que presentar
 * (por ejemplo, la búsqueda de calculadoras sin coincidencias). Expone un
 * mensaje descriptivo obligatorio (`message`) y un título opcional (`title`).
 * El contenido proyectado permite añadir una acción complementaria cuando el
 * contexto lo requiera.
 *
 * Estilo: sólo tokens aprobados (tipografía Playfair para el título de acento,
 * Inter para el mensaje, colores de texto primario/secundario). SCSS puro, sin
 * emojis ni efectos excluidos por Req 9.6.
 *
 * Requirements: 2.3, 12.3
 */
@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.scss',
})
export class EmptyStateComponent {
  /** Mensaje descriptivo del estado vacío (obligatorio, Req 2.3, 12.3). */
  readonly message = input.required<string>();

  /** Título editorial opcional que encabeza el estado vacío. */
  readonly title = input<string>();
}
