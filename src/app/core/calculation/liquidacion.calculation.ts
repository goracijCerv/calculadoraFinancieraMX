/**
 * Liquidación por despido injustificado — función pura de cálculo (Fase 2)
 * (Req 5.5, 5.6, 7.1, 7.5).
 *
 * Calcula la INDEMNIZACIÓN por despido injustificado: los tres componentes
 * legales que, a diferencia del finiquito, proceden solo por despido (no por
 * renuncia). Esta calculadora cubre exclusivamente la indemnización; las partes
 * proporcionales del finiquito se calculan en su propia calculadora (§7).
 *
 * ── Fuentes oficiales (verificadas en Fase 0, ver `docs/formulas.md` §8) ──
 * - Indemnización constitucional de 3 meses: LFT Art. 48 · 2026 · `docs/formulas.md` §8.
 * - 20 días de salario por año de servicio: LFT Art. 50 fr. II · 2026 · `docs/formulas.md` §8.
 * - Prima de antigüedad:                     LFT Art. 162 · 2026 · `docs/formulas.md` §8.
 * - Tope del salario de la prima de antigüedad (2 × salario mínimo): LFT Art. 485–486
 *   · 2026 · `docs/formulas.md` §0, §8.
 *
 * Fórmulas (todas de `docs/formulas.md` §8):
 *   1. indemnización 3 meses = salarioDiario × 90
 *   2. 20 días por año       = salarioDiario × 20 × añosDeServicio
 *   3. prima de antigüedad   = salarioTopado × 12 × añosDeServicio,
 *      donde salarioTopado = min(salarioDiario, 2 × salarioMínimo) (Art. 485–486).
 *   total = suma de los tres componentes (Property 7, Property 3).
 *
 * Caso de referencia de §8 (verificación): salarioDiario 500, antigüedad 5 años,
 * zona general (tope 630.08, no aplica porque 500 < 630.08) ⇒ 3 meses 45 000,
 * 20 días/año 50 000, prima de antigüedad 30 000, **total 125 000.00**.
 *
 * Caso con tope aplicado (§8): salarioDiario 1 000, antigüedad 3 años, zona
 * general ⇒ prima de antigüedad = min(1000, 630.08) × 12 × 3 = **22 682.88**.
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
import type { FiscalConstants } from '../constants/fiscal-constants.types';

/** Días de indemnización constitucional de 3 meses (LFT Art. 48 · §8). */
const INDEMNIZACION_DAYS = 90;

/** Días de salario por año de servicio (LFT Art. 50 fr. II · §8). */
const DAYS_PER_YEAR = 20;

/** Días de prima de antigüedad por año de servicio (LFT Art. 162 · §8). */
const PRIMA_ANTIGUEDAD_DAYS_PER_YEAR = 12;

/**
 * Multiplicador del salario mínimo para topar el salario de la prima de
 * antigüedad (LFT Art. 485–486 · `docs/formulas.md` §0, §8).
 */
const PRIMA_ANTIGUEDAD_WAGE_CAP_MULTIPLIER = 2;

/**
 * DTO de entrada de la calculadora de liquidación (Req 7.1, ver design.md).
 */
export interface LiquidacionInput {
  /** Salario diario del trabajador, en pesos (positivo, ≥ salario mínimo) (Req 4.1, 5.6). */
  dailySalary: number;
  /** Años completos de servicio (entero ≥ 0) (Req 5.6). */
  yearsOfService: number;
}

/**
 * Calcula la liquidación por despido injustificado (función pura, Req 5.5).
 *
 * @throws CalculationError('INVALID_INPUT', campo, …) si un dato falta o queda
 *   fuera de rango (salario < salario mínimo, años negativos o no enteros)
 *   (Req 5.6).
 * @throws CalculationError('MISSING_CONSTANT', nombre, …) si falta una constante
 *   requerida del año fiscal (Req 5.7).
 */
export const calculateLiquidacion: CalculationFn<LiquidacionInput, FiscalConstants> = (
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
      'Los años de servicio deben ser un entero mayor o igual a cero.',
    );
  }

  // ── Componentes del desglose (Req 7.1 · `docs/formulas.md` §8) ──
  const breakdown: BreakdownItem[] = [];

  // 1) Indemnización constitucional de 3 meses (LFT Art. 48): salarioDiario × 90.
  const indemnizacion = roundMoney(dailySalary * INDEMNIZACION_DAYS);
  breakdown.push({ concept: 'Indemnización de 3 meses', amount: indemnizacion });

  // 2) 20 días de salario por año (LFT Art. 50 fr. II): salarioDiario × 20 × años.
  const veinteDiasPorAnio = roundMoney(dailySalary * DAYS_PER_YEAR * years);
  breakdown.push({ concept: '20 días de salario por año', amount: veinteDiasPorAnio });

  // 3) Prima de antigüedad (LFT Art. 162): salarioTopado × 12 × años, con tope de
  //    2 × salario mínimo (LFT Art. 485–486).
  const cappedWage = Math.min(
    dailySalary,
    PRIMA_ANTIGUEDAD_WAGE_CAP_MULTIPLIER * constants.minimumDailyWage,
  );
  const primaAntiguedad = roundMoney(cappedWage * PRIMA_ANTIGUEDAD_DAYS_PER_YEAR * years);
  breakdown.push({ concept: 'Prima de antigüedad', amount: primaAntiguedad });

  // Total = suma del desglose (Property 3, Property 7), redondeado a 2 decimales.
  const total = roundMoney(breakdown.reduce((sum, item) => sum + item.amount, 0));

  return { total, breakdown };
};
