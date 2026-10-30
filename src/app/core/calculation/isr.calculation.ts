/**
 * ISR mensual (tarifa Art. 96 LISR) y subsidio al empleo — función pura de
 * cálculo (Fase 3) (Req 5.5, 5.6, 8.1, 8.6).
 *
 * Calcula el ISR mensual a retener de un ingreso gravable: aplica la tarifa
 * mensual del SAT (Art. 96 LISR) por tramos y, cuando el ingreso no rebasa el
 * tope, resta el subsidio al empleo (cantidad fija mensual del decreto vigente).
 *
 * ── Fuentes oficiales (verificadas en Fase 0, ver `docs/formulas.md` §3) ──
 * - Tarifa mensual del ISR: SAT · Art. 96 LISR, Anexo 8 RMF · DOF 28-dic-2025 ·
 *   2026 · `docs/formulas.md` §3. La tabla vive en el `Constants_Module`
 *   (`FiscalConstants.isrMonthlyTable`), no se define aquí (Req 5.3).
 * - Subsidio al empleo: Decreto del subsidio al empleo · DOF 31-dic-2025 · 2026 ·
 *   `docs/formulas.md` §0, §3. Desde el decreto de finales de 2024 el subsidio
 *   es una CANTIDAD FIJA mensual (ya no una tabla de tramos) para ingresos que
 *   no rebasen un tope.
 *
 * ── Regla de cálculo por tramo (`docs/formulas.md` §3) ──
 *   1. Ubicar el tramo cuyo límite inferior ≤ ingreso (el mayor que lo cumple).
 *   2. excedente = ingreso − límite inferior del tramo.
 *   3. impuesto marginal = excedente × (% sobre excedente / 100).
 *   4. ISR de tarifa = cuota fija del tramo + impuesto marginal.
 *   5. ISR neto a retener = ISR de tarifa − subsidio aplicable, acotado a no
 *      volverse negativo a cargo (el ISR nunca es negativo, Property 11).
 *
 * El ISR es no negativo y monótono no decreciente respecto al ingreso
 * (Property 11).
 *
 * Caso de referencia de §3 (verificación): ingreso 30 000 (tramo 6) ⇒
 * 1 856.84 + (30 000 − 17 533.65) × 21.36% = **4 519.65** (sin subsidio, porque
 * 30 000 rebasa el tope de 11 492.66).
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
import type {
  FiscalConstants,
  IsrBracket,
} from '../constants/fiscal-constants.types';

/**
 * Subsidio al empleo mensual vigente (feb–dic 2026), en pesos.
 * Fuente: Decreto DOF 31-dic-2025 · `docs/formulas.md` §0, §3. Cantidad fija
 * mensual del decreto (ya no una tabla de tramos).
 */
export const EMPLOYMENT_SUBSIDY_MONTHLY = 535.65;

/**
 * Tope de ingreso gravable mensual para aplicar el subsidio al empleo, en pesos.
 * Fuente: Decreto DOF 31-dic-2025 · `docs/formulas.md` §0, §3. El subsidio solo
 * aplica si el ingreso gravable mensual no excede este monto.
 */
export const EMPLOYMENT_SUBSIDY_INCOME_CAP = 11_492.66;

/**
 * DTO de entrada de la calculadora de ISR mensual (Req 8.1, ver design.md).
 */
export interface IsrInput {
  /** Ingreso gravable mensual, en pesos (≥ 0, finito) (Req 5.6). */
  monthlyIncome: number;
}

/**
 * Ubica el tramo de la tarifa mensual del ISR aplicable a un ingreso gravable
 * (`docs/formulas.md` §3, paso 1): el tramo con el mayor `lowerLimit` que no
 * excede al ingreso.
 *
 * La tabla del `Constants_Module` está ordenada ascendentemente por
 * `lowerLimit`, de modo que recorrerla hacia atrás devuelve el primer tramo
 * cuyo `lowerLimit ≤ income`. Devuelve `undefined` si ningún tramo aplica
 * (p.ej. ingreso por debajo del primer `lowerLimit`, que es 0.01).
 *
 * Se exporta como helper puro para que otras calculadoras (p.ej. sueldo neto ↔
 * bruto, tarea 19.1) reutilicen la misma búsqueda de tramo (Req 8.1).
 *
 * @param table tarifa mensual del ISR (ordenada ascendentemente por `lowerLimit`).
 * @param income ingreso gravable mensual.
 */
export function findIsrBracket(
  table: readonly IsrBracket[],
  income: number,
): IsrBracket | undefined {
  for (let i = table.length - 1; i >= 0; i -= 1) {
    if (income >= table[i].lowerLimit) {
      return table[i];
    }
  }
  return undefined;
}

/**
 * Calcula el ISR de tarifa (antes de subsidio) de un ingreso gravable mensual
 * aplicando la tabla del SAT (`docs/formulas.md` §3, pasos 1–4).
 *
 * Para ingresos por debajo del primer límite inferior (< 0.01) el ISR de tarifa
 * es 0. Se exporta como helper puro para su reutilización (tarea 19.1).
 *
 * @param table tarifa mensual del ISR del `Constants_Module`.
 * @param income ingreso gravable mensual (≥ 0).
 * @returns el ISR de tarifa redondeado a 2 decimales.
 */
export function calculateIsrTariff(
  table: readonly IsrBracket[],
  income: number,
): number {
  const bracket = findIsrBracket(table, income);
  if (bracket === undefined) {
    return 0;
  }
  const excess = income - bracket.lowerLimit;
  const marginalTax = excess * (bracket.rateOnExcess / 100);
  return roundMoney(bracket.fixedFee + marginalTax);
}

/**
 * Calcula el ISR mensual a retener (función pura, Req 5.5).
 *
 * Aplica la tarifa del SAT y resta el subsidio al empleo cuando el ingreso no
 * rebasa el tope, acotando el resultado a no ser negativo (Property 11).
 *
 * @throws CalculationError('INVALID_INPUT', campo, …) si el ingreso falta o es
 *   inválido (negativo o no finito) (Req 5.6).
 * @throws CalculationError('MISSING_CONSTANT', nombre, …) si la tabla ISR del
 *   año fiscal está vacía o ausente (Req 5.7).
 */
export const calculateIsr: CalculationFn<IsrInput, FiscalConstants> = (
  input,
  constants,
): CalculationResult => {
  // ── Constantes requeridas (Req 5.7) ──
  if (
    constants.isrMonthlyTable == null ||
    !Array.isArray(constants.isrMonthlyTable) ||
    constants.isrMonthlyTable.length === 0
  ) {
    throw new CalculationError(
      'MISSING_CONSTANT',
      'isrMonthlyTable',
      'Falta la tarifa mensual del ISR del año fiscal vigente.',
    );
  }

  // ── Validación de datos de entrada (Req 5.6) ──
  const income = input.monthlyIncome;
  if (typeof income !== 'number' || !Number.isFinite(income)) {
    throw new CalculationError(
      'INVALID_INPUT',
      'monthlyIncome',
      'El ingreso mensual debe ser un número válido.',
    );
  }
  if (income < 0) {
    throw new CalculationError(
      'INVALID_INPUT',
      'monthlyIncome',
      `El ingreso mensual (${income}) no puede ser negativo.`,
    );
  }

  // ── Conceptos del desglose (Req 8.1 · `docs/formulas.md` §3) ──
  const breakdown: BreakdownItem[] = [];

  // 1) ISR de tarifa (Art. 96 LISR): cuota fija + excedente × % sobre excedente.
  const tariff = calculateIsrTariff(constants.isrMonthlyTable, income);
  breakdown.push({ concept: 'ISR de tarifa', amount: tariff });

  // 2) Subsidio al empleo (Decreto DOF 31-dic-2025): cantidad fija mensual que
  //    aplica solo si el ingreso no rebasa el tope. Se registra como monto
  //    negativo (reduce el ISR). Acotado para que el ISR neto no sea negativo.
  let subsidy = 0;
  if (income <= EMPLOYMENT_SUBSIDY_INCOME_CAP) {
    subsidy = Math.min(EMPLOYMENT_SUBSIDY_MONTHLY, tariff);
  }
  if (subsidy > 0) {
    breakdown.push({ concept: 'Subsidio al empleo', amount: roundMoney(-subsidy) });
  }

  // ISR neto a retener = ISR de tarifa − subsidio aplicable (no negativo,
  // Property 11). Total = suma del desglose (Property 3), redondeado.
  const total = roundMoney(breakdown.reduce((sum, item) => sum + item.amount, 0));

  return { total, breakdown };
};
