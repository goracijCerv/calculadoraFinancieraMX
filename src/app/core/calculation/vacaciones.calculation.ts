/**
 * Vacaciones y prima vacacional — función pura de cálculo (Fase 2)
 * (Req 5.1, 5.2, 5.5, 5.6, 5.7, 7.3, 7.5).
 *
 * Calcula, a partir del salario diario y la antigüedad, los DÍAS de vacaciones
 * que corresponden según la tabla del Art. 76 LFT, el PAGO de esas vacaciones y
 * la PRIMA VACACIONAL del 25 % que marca el Art. 80 LFT.
 *
 * ── Fuentes oficiales (verificadas en Fase 0, ver `docs/formulas.md` §4, §5) ──
 * - Días de vacaciones: LFT Art. 76 (reforma 2023 "Vacaciones Dignas") · 2026 ·
 *   `docs/formulas.md` §4. La tabla vive en el `Constants_Module`
 *   (`vacationDaysTable`) y es monótona no decreciente.
 * - Prima vacacional:   LFT Art. 80 (mínimo 25 %) · 2026 · `docs/formulas.md` §5.
 *
 * Fórmulas (todas de `docs/formulas.md` §5):
 *   1. díasVacaciones = tabla Art. 76 (según antigüedad)
 *   2. pagoVacaciones = salarioDiario × díasVacaciones
 *   3. primaVacacional = pagoVacaciones × 0.25
 *   total = pagoVacaciones + primaVacacional (Property 9).
 *
 * Caso de referencia de §5 (verificación): salarioDiario 500, antigüedad 1 año
 * (12 días) ⇒ pagoVacaciones 6 000.00, primaVacacional 1 500.00,
 * **total 7 500.00**.
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

/** Porcentaje mínimo de prima vacacional (LFT Art. 80 · `docs/formulas.md` §5). */
const PRIMA_VACACIONAL_RATE = 0.25;

/**
 * DTO de entrada de la calculadora de vacaciones y prima vacacional
 * (Req 7.3, ver design.md).
 */
export interface VacacionesInput {
  /** Salario diario del trabajador, en pesos (positivo, ≥ salario mínimo) (Req 4.1, 5.6). */
  dailySalary: number;
  /** Antigüedad en años completos de servicio (entero ≥ 0) (Req 4.1, 5.6). */
  yearsOfService: number;
}

/**
 * Días de vacaciones correspondientes a una antigüedad, según la tabla del
 * Constants_Module (LFT Art. 76, reforma 2023 · `docs/formulas.md` §4). Toma la
 * fila cuya `yearsOfService` es la mayor que no excede la antigüedad. Puro.
 *
 * Refleja el helper equivalente de `finiquito.calculation.ts` para mantener una
 * única regla de lectura de la tabla en todas las calculadoras.
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
 * Calcula las vacaciones y la prima vacacional (función pura, Req 5.5).
 *
 * @throws CalculationError('INVALID_INPUT', campo, …) si un dato falta o queda
 *   fuera de rango (salario < salario mínimo, antigüedad negativa o no entera)
 *   (Req 5.6).
 * @throws CalculationError('MISSING_CONSTANT', nombre, …) si falta una constante
 *   requerida del año fiscal (Req 5.7).
 */
export const calculateVacaciones: CalculationFn<VacacionesInput, FiscalConstants> = (
  input,
  constants,
): CalculationResult => {
  // ── Constantes requeridas (Req 5.7) ──
  if (constants.minimumDailyWage == null || !Number.isFinite(constants.minimumDailyWage)) {
    throw new CalculationError(
      'MISSING_CONSTANT',
      'minimumDailyWage',
      'Falta el salario mínimo diario del año fiscal vigente.',
    );
  }
  if (!Array.isArray(constants.vacationDaysTable) || constants.vacationDaysTable.length === 0) {
    throw new CalculationError(
      'MISSING_CONSTANT',
      'vacationDaysTable',
      'Falta la tabla de días de vacaciones del año fiscal vigente.',
    );
  }

  // ── Validación de datos de entrada (Req 5.6) ──
  const dailySalary = input.dailySalary;
  if (typeof dailySalary !== 'number' || !Number.isFinite(dailySalary)) {
    throw new CalculationError(
      'INVALID_INPUT',
      'dailySalary',
      'El salario diario debe ser un número válido.',
    );
  }
  if (dailySalary < constants.minimumDailyWage) {
    throw new CalculationError(
      'INVALID_INPUT',
      'dailySalary',
      `El salario diario (${dailySalary}) no puede ser menor al salario mínimo vigente (${constants.minimumDailyWage}).`,
    );
  }

  const years = input.yearsOfService;
  if (typeof years !== 'number' || !Number.isInteger(years) || years < 0) {
    throw new CalculationError(
      'INVALID_INPUT',
      'yearsOfService',
      'La antigüedad debe ser un entero mayor o igual a cero.',
    );
  }

  // ── Conceptos del desglose (Req 7.3 · `docs/formulas.md` §5) ──
  const breakdown: BreakdownItem[] = [];

  // Días de vacaciones según la tabla del Art. 76 (Constants_Module · §4).
  const vacationDays = vacationDaysForService(constants.vacationDaysTable, years);

  // 1) Pago de vacaciones (LFT Art. 76): salarioDiario × díasVacaciones.
  const pagoVacaciones = roundMoney(dailySalary * vacationDays);
  breakdown.push({ concept: 'Pago de vacaciones', amount: pagoVacaciones });

  // 2) Prima vacacional (LFT Art. 80): pagoVacaciones × 25 %.
  const primaVacacional = roundMoney(pagoVacaciones * PRIMA_VACACIONAL_RATE);
  breakdown.push({ concept: 'Prima vacacional', amount: primaVacacional });

  // Total = suma del desglose (Property 3, Property 9), redondeado a 2 decimales.
  const total = roundMoney(breakdown.reduce((sum, item) => sum + item.amount, 0));

  return { total, breakdown };
};
