import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * `SkeletonComponent` — marcador de carga (skeleton loader) alineado a la
 * cuadrícula de la interfaz.
 *
 * Reproduce las dimensiones y el radio del contenido que reemplaza para que la
 * transición a los datos reales no desplace el layout. Se usa exclusivamente
 * donde exista un estado de carga asíncrono real (p. ej. el límite de carga
 * perezosa de una ruta); nunca se simula una carga inexistente.
 *
 * Variantes (`variant`):
 *  - `text`   — línea de texto (altura de una línea de UI).
 *  - `title`  — bloque de título (mayor altura).
 *  - `amount` — bloque del monto héroe, alineado al `HeroResultComponent`.
 *  - `block`  — bloque genérico cuya altura se fija con `height`.
 *
 * Estilo: sólo tokens aprobados; superficies planas con filete de 1px, radios
 * de 2–4px (nunca redondeos excesivos) y animación limitada a `opacity`, con
 * fallback para `prefers-reduced-motion`.
 */
@Component({
  selector: 'app-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './skeleton.html',
  styleUrl: './skeleton.scss',
  host: {
    role: 'presentation',
    'aria-hidden': 'true',
  },
})
export class SkeletonComponent {
  /** Forma del skeleton; determina la altura y el radio por defecto. */
  readonly variant = input<'text' | 'title' | 'amount' | 'block'>('text');

  /** Ancho CSS del bloque (por defecto ocupa todo el contenedor). */
  readonly width = input<string>('100%');

  /** Altura CSS para la variante `block` (ignorada en el resto). */
  readonly height = input<string>('var(--space-6)');
}
