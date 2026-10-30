/**
 * Días de vacaciones — función pura de cálculo (Fase 2)
 * (Req 5.1, 5.2, 5.5, 5.6, 5.7, 7.4, 7.5).
 *
 * Consulta, a partir de la antigüedad en años completos, los DÍAS de vacaciones
 * que corresponden según la tabla del Art. 76 LFT (reforma 2023 "Vacaciones
 * Dignas"). A diferencia de las demás calculadoras, el resultado NO es un
 * importe monetario sino un CONTEO DE DÍAS: para reutilizar la plantilla común
 * (`CalculationResult`), los días se representan como `total` (entero) y un
 * único concepto del desglose `{ concept: 'Días de vacaciones', amount: días }`.
 *
 * ── Fuentes oficiales (verificadas en Fase 0, ver `docs/formulas.md` §4) ──
 * - Días de vacaciones: LFT Art. 76 (reforma 2023 "Vacaciones Dignas") · 2026 ·
 *   `docs/formulas.md` §4. La tabla vive en el `Constants_Module`
 *   (`vacationDaysTable`) y es monótona no decreciente (Property 10).
 *
 * Regla (de `docs/formulas.md` §4):
 *   díasVacaciones = tabla Art. 76 (fila mayor cuya antigüedad no excede `years`).
 *
 * Caso de referencia de §4 (verificación): 1 año ⇒ 12 días; 5 años ⇒ 20 días;
 * 6 años ⇒ 22 días; 11 años ⇒ 24 días.
 *
 * Pureza (Req 5.5): misma entrada ⇒ misma salida; sin DOM, sin `Date`, sin
 * `Math.random`, sin mutar la entrada.
 */

import type {
  BreakdownItem,
  CalculationFn,
  CalculationResult,
} from './calculation.types';
import { CalculationError } from './calculation.types';
import { roundMoney } from './rounding';
import type { FiscalConstants, VacationDaysRow } from '../constants/fiscal-constants.types';

/**
 * DTO de entrada de la calculadora de días de vacaciones (Req 7.4, ver design.md).
 */
export interface DiasVacacionesInput {
  /** Antigüedad en años completos de servicio (entero ≥ 0) (Req 4.1, 5.6). */
  yearsOfService: number;
}

/**
 * Días de vacaciones correspondientes a una antigüedad, según la tabla del
 * Constants_Module (LFT Art. 76, reforma 2023 · `docs/formulas.md` §4). Toma la
 * fila cuya `yearsOfService` es la mayor que no excede la antigüedad. Puro.
 *
 * Refleja el helper equivalente de `vacaciones.calculation.ts` y
 * `finiquito.calculation.ts` para mantener una única regla de lectura de la
 * tabla en todas las calculadoras.
 */
function vacationDaysForService(table: readonly VacationDaysRow[], years: number): number {
  let days = 0;
  for (const row of table) {
    if (row.yearsOfService <= years) {
      days = row.days;
    }
  }
  return days;
}

/**
 * Calcula los días de vacaciones según la antigüedad (función pura, Req 5.5).
 *
 * El resultado es un CONTEO DE DÍAS, no un importe: `total` son los días y el
 * desglose contiene un único concepto 'Días de vacaciones'. Los días son
 * enteros; `roundMoney` sobre un entero es inocuo y se usa por consistencia con
 * las demás calculadoras.
 *
 * @throws CalculationError('INVALID_INPUT', campo, …) si la antigüedad falta o
 *   queda fuera de rango (negativa o no entera) (Req 5.6).
 * @throws CalculationError('MISSING_CONSTANT', nombre, …) si falta la tabla de
 *   días de vacaciones del año fiscal vigente (Req 5.7).
 */
export const calculateDiasVacaciones: CalculationFn<DiasVacacionesInput, FiscalConstants> = (
  input,
  constants,
): CalculationResult => {
  // ── Constantes requeridas (Req 5.7) ──
  if (!Array.isArray(constants.vacationDaysTable) || constants.vacationDaysTable.length === 0) {
    throw new CalculationError(
      'MISSING_CONSTANT',
      'vacationDaysTable',
      'Falta la tabla de días de vacaciones del año fiscal vigente.',
    );
  }

  // ── Validación de datos de entrada (Req 5.6) ──
  const years = input.yearsOfService;
  if (typeof years !== 'number' || !Number.isInteger(years) || years < 0) {
    throw new CalculationError(
      'INVALID_INPUT',
      'yearsOfService',
      'La antigüedad debe ser un entero mayor o igual a cero.',
    );
  }

  // Días de vacaciones según la tabla del Art. 76 (Constants_Module · §4).
  const vacationDays = vacationDaysForService(constants.vacationDaysTable, years);

  // El resultado es un conteo de días; se representa con la forma común
  // `CalculationResult` para reutilizar la plantilla. `roundMoney` sobre un
  // entero es inocuo (LFT Art. 76 · `docs/formulas.md` §4).
  const breakdown: BreakdownItem[] = [
    { concept: 'Días de vacaciones', amount: roundMoney(vacationDays) },
  ];

  const total = roundMoney(vacationDays);

  return { total, breakdown };
};
