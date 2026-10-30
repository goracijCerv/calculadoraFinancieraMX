import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { checkStaleness } from '../../../core/calculation/staleness';
import { FISCAL_CONSTANTS } from '../../../core/constants/fiscal-constants.token';

/**
 * Texto del aviso de posible desactualización mostrado cuando hay desfase
 * (Req 17.2, 17.3). Se expone como constante para que las pruebas lo verifiquen
 * literalmente y evitar divergencias entre plantilla y especificación.
 */
export const STALENESS_WARNING_TEXT =
  'Los valores podrían estar desactualizados.';

/**
 * `FiscalYearBannerComponent` — aviso de vigencia del año fiscal (Req 17).
 *
 * Muestra SIEMPRE de forma visible el año fiscal vigente de las constantes
 * cargadas (Req 17.1), leído desde el token `FISCAL_CONSTANTS`. El año actual se
 * recibe desde la capa de presentación mediante el input `currentYear`
 * (p.ej. `new Date().getFullYear()`), de modo que el componente delega la
 * decisión de desfase en la función pura `checkStaleness` sin leer `Date`.
 * Cuando hay desfase (`isStale`), presenta además el aviso de que los valores
 * podrían estar desactualizados (Req 17.2, 17.3).
 *
 * Se usa en dos lugares (design.md → "Staleness_Check y aviso de vigencia"):
 * en el shell/footer el año fiscal es siempre visible (Req 17.1), y junto a
 * cada resultado se muestra el aviso de desfase mientras `isStale` sea `true`
 * (Req 17.3). El input `showWarningOnly` permite mostrar solo el aviso de
 * desfase (sin repetir el año) cuando el componente acompaña a un resultado.
 *
 * Identidad visual: sólo tokens aprobados (tipografía Inter, color de texto
 * secundario, filete/borde `#E5E0E2` y acento vino). SCSS puro, sin gradientes,
 * glow, blobs, glassmorphism, sombras exageradas ni emojis (Req 9.6, 9.8).
 *
 * Requirements: 17.1, 17.2, 17.3
 */
@Component({
  selector: 'app-fiscal-year-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './fiscal-year-banner.html',
  styleUrl: './fiscal-year-banner.scss',
})
export class FiscalYearBannerComponent {
  /** Constantes fiscales del año vigente (Constants_Module, Req 5.4). */
  private readonly constants = inject(FISCAL_CONSTANTS);

  /**
   * Año actual observado, inyectado desde la presentación (Req 17.2). Por
   * defecto es el año fiscal de las constantes (no hay desfase) para que el
   * banner sea utilizable como etiqueta de año sin requerir el input; quien
   * necesite detectar desfase debe pasar `new Date().getFullYear()`.
   */
  readonly currentYear = input<number>(this.constants.fiscalYear);

  /**
   * Cuando es `true`, el banner muestra únicamente el aviso de desfase (sin la
   * etiqueta del año fiscal), para acompañar un resultado (Req 17.3). Por
   * defecto `false`: muestra siempre el año fiscal vigente (Req 17.1).
   */
  readonly showWarningOnly = input<boolean>(false);

  /** Estado de vigencia calculado por la función pura (Req 17.2, 17.3). */
  protected readonly status = computed(() =>
    checkStaleness(this.currentYear(), this.constants),
  );

  /** Año fiscal vigente de las constantes cargadas (Req 17.1). */
  protected readonly fiscalYear = computed(() => this.status().fiscalYear);

  /** Hay desfase: el año actual es posterior al año fiscal (Req 17.2). */
  protected readonly isStale = computed(() => this.status().isStale);

  /** Muestra la etiqueta del año fiscal salvo en modo "sólo aviso". */
  protected readonly showYear = computed(() => !this.showWarningOnly());

  /** Texto del aviso de posible desactualización (Req 17.2). */
  protected readonly warningText = STALENESS_WARNING_TEXT;
}
