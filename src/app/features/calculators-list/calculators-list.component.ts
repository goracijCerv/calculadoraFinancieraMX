import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  CALCULATOR_REGISTRY,
  CalculatorMeta,
} from '../../core/registry/calculator-registry';
import { searchCalculators } from '../../core/registry/search';
import { EmptyStateComponent } from '../../shared/design-system/empty-state';
import { OtherToolsComponent } from '../../shared/design-system/other-tools';

/**
 * `CalculatorsListComponent` — listado de calculadoras (ruta `/calculadoras`,
 * Req 1.3, 2.3, 11.4).
 *
 * Presenta el índice completo del `CALCULATOR_REGISTRY`. Cada entrada enlaza a
 * `calculadoras/:id` mediante `routerLink` (Req 1.4).
 *
 * La búsqueda es client-side y pura: el término se guarda en una signal
 * (`term`) y la lista filtrada se deriva con `computed`, delegando el filtrado
 * en la función pura `searchCalculators` sobre `name`/`description` (Req 2.1,
 * 2.2). Un término vacío o solo con espacios restaura la lista completa
 * (Req 2.4). Cuando ningún elemento coincide, se muestra `EmptyStateComponent`
 * con un mensaje descriptivo (Req 2.3).
 *
 * Incluye además al pie del índice una sección discreta "Otras herramientas"
 * mediante `OtherToolsComponent`: un enlace honesto a otro proyecto propio del
 * autor (RapUPic), sin scripts de terceros ni redes publicitarias.
 *
 * Estilo: SCSS puro con tokens aprobados; dos columnas en escritorio mediante
 * media query (Req 11.4), una sola columna en móvil y sin desbordes
 * horizontales (Req 11.3). Sin emojis ni efectos excluidos (Req 9.6). El
 * contenido es estático (sin backend, Req 14).
 *
 * Requirements: 1.3, 2.3, 11.4
 */
@Component({
  selector: 'app-calculators-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    RouterLink,
    EmptyStateComponent,
    OtherToolsComponent,
  ],
  templateUrl: './calculators-list.component.html',
  styleUrl: './calculators-list.component.scss',
})
export class CalculatorsListComponent {
  /** Registro completo de calculadoras, origen del índice editorial (Req 1.3). */
  protected readonly registry: readonly CalculatorMeta[] = CALCULATOR_REGISTRY;

  /** Término de búsqueda escrito por el usuario (enlazado por `ngModel`). */
  protected readonly term = signal('');

  /**
   * Lista filtrada derivada del término (Req 2.2). Delega en la función pura
   * `searchCalculators`; un término vacío devuelve el registro completo en su
   * orden editorial original (Req 2.4).
   */
  protected readonly filtered = computed(() =>
    searchCalculators(this.registry, this.term()),
  );

  /** Verdadero cuando no hay coincidencias para el término actual (Req 2.3). */
  protected readonly hasNoMatches = computed(() => this.filtered().length === 0);

  /** Mensaje del estado vacío mostrado cuando la búsqueda no coincide (Req 2.3). */
  protected readonly emptyMessage =
    'No encontramos calculadoras que coincidan con tu búsqueda. ' +
    'Revisa la ortografía o prueba con otra palabra.';

  /** Actualiza la signal del término desde el input de búsqueda. */
  protected onTermChange(value: string): void {
    this.term.set(value);
  }

  /** Construye la ruta de detalle de una calculadora (`calculadoras/:id`). */
  protected calculatorPath(calculator: CalculatorMeta): string {
    return `/calculadoras/${calculator.id}`;
  }
}
