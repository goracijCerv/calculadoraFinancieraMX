import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { CalculationResult } from '../../core/calculation/calculation.types';
import { calculateFiniquito, type FiniquitoInput } from '../../core/calculation/finiquito.calculation';
import {
  CURRENT_FISCAL_CONSTANTS,
  FISCAL_CONSTANTS,
} from '../../core/constants/fiscal-constants.token';
import {
  CALCULATOR_REGISTRY,
  CalculatorMeta,
} from '../../core/registry/calculator-registry';

/**
 * Caso fijo de la tarjeta de ejemplo del inicio. Se calcula con la misma función
 * pura que usa la calculadora real, así las cifras son verdaderas y no
 * inventadas. La tarjeta lo etiqueta como ejemplo.
 */
const EXAMPLE_INPUT: FiniquitoInput = {
  dailySalaryOrMonthly: 500,
  startDate: '2024-01-15',
  endDate: '2026-10-15',
  pendingVacationDays: 0,
  aguinaldoProportional: true,
};

/**
 * `HomeComponent` — página de inicio editorial (ruta `''`, Req 1.1).
 *
 * Dos bloques:
 * 1. Hero asimétrico 60/40: a la izquierda el titular ("Tus derechos también
 *    cuentan."), la bajada y la acción principal; a la derecha una tarjeta con
 *    un finiquito de ejemplo (desglose + total).
 * 2. Índice de calculadoras en filas táctiles: "Lo que te corresponde" (fases 1
 *    y 2) y "Sueldo e impuestos" (fase 3). Cada fila enlaza a `calculadoras/:id` (Req 1.4).
 *
 * Contenido estático, sin backend (Req 14). Sin desbordes horizontales (Req 11.3).
 *
 * Requirements: 1.1
 */
@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private readonly constants = inject(FISCAL_CONSTANTS, { optional: true }) ?? CURRENT_FISCAL_CONSTANTS;

  /** Título héroe editorial de la página de inicio (Req 1.1). */
  protected readonly heroTitle = 'Tus derechos también cuentan.';

  /** Bajada que acompaña al título héroe. */
  protected readonly heroLead =
    'Calculadoras laborales y fiscales para México, gratuitas y sin registro. ' +
    'Resuelve tus dudas de dinero al instante, directo en tu navegador.';

  /** Descripción del caso de la tarjeta de ejemplo (coincide con `EXAMPLE_INPUT`). */
  protected readonly exampleCaption =
    'Salario diario de $500 y 2 años 9 meses de antigüedad.';

  /** Resultado del finiquito de ejemplo, o `null` si no pudo calcularse. */
  protected readonly example = computed<CalculationResult | null>(() => {
    try {
      return calculateFiniquito(EXAMPLE_INPUT, this.constants);
    } catch {
      return null;
    }
  });

  /** Calculadoras principales: finiquito (fase 1) y laborales (fase 2). */
  protected readonly mainCalculators: readonly CalculatorMeta[] =
    CALCULATOR_REGISTRY.filter((calculator) => calculator.phase <= 2);

  /** Herramientas adicionales: calculadoras fiscales y extras (fase 3). */
  protected readonly additionalTools: readonly CalculatorMeta[] =
    CALCULATOR_REGISTRY.filter((calculator) => calculator.phase === 3);

  /** Construye la ruta de detalle de una calculadora (`calculadoras/:id`). */
  protected calculatorPath(calculator: CalculatorMeta): string {
    return `/calculadoras/${calculator.id}`;
  }
}
