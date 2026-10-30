/**
 * Aguinaldo — función pura de cálculo (Fase 2) (Req 5.1, 5.2, 5.5, 5.6, 5.7, 7.2).
 *
 * Calcula el aguinaldo anual de un trabajador. La LFT garantiza un mínimo de
 * 15 días de salario; quien no cumple el año completo tiene derecho a la parte
 * proporcional a los días trabajados.
 *
 * ── Fuente oficial (verificada en Fase 0, ver `docs/formulas.md` §6) ──
 * - Aguinaldo: LFT Art. 87 · 2026 · `docs/formulas.md` §6.
 *   "aguinaldo anual de al menos 15 días de salario, pagadero antes del 20 de
 *   diciembre. Quien no cumple el año tiene derecho a la parte proporcional."
 *
 * ── Fórmulas (todas de `docs/formulas.md` §6) ──
 *   aguinaldoCompleto      = salarioDiario × 15                         (año completo)
 *   aguinaldoProporcional  = salarioDiario × 15 × (díasTrabajados / 365)
 *
 * El caso de un año completo (díasTrabajados = 365) coincide con el mínimo de
 * ley de 15 días (Property 8: el aguinaldo nunca es menor que 15 días por un
 * año completo). La base de prorrateo es el año de 365 días, fijada en §6/§7
 * para garantizar el determinismo de la función pura (Req 5.5).
 *
 * Caso de referencia de §6 (verificación): salarioDiario 400, año completo ⇒
 * aguinaldo 400 × 15 = $6,000.00; medio año (182 días) ⇒
 * 400 × 15 × (182/365) = $2,991.78.
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

/** Días de aguinaldo mínimos de ley (LFT Art. 87 · `docs/formulas.md` §6). */
const AGUINALDO_MIN_DAYS = 15;

/** Base de prorrateo anual fijada en `docs/formulas.md` §6/§7 (año de 365 días). */
const PRORATION_YEAR_DAYS = 365;

/**
 * DTO de entrada de la calculadora de aguinaldo (Req 7.2, ver design.md).
 */
export interface AguinaldoInput {
  /** Salario diario del trabajador, en pesos (positivo, ≥ salario mínimo) (Req 4.1, 5.6). */
  dailySalary: number;
  /** Días trabajados en el año (entero 0..365; 365 = año completo) (Req 4.1). */
  daysWorked: number;
}

/**
 * Calcula el aguinaldo (función pura, Req 5.5).
 *
 * @throws CalculationError('INVALID_INPUT', campo, …) si un dato falta o queda
 *   fuera de rango (salario < salario mínimo, días negativos o > 365) (Req 5.6).
 * @throws CalculationError('MISSING_CONSTANT', nombre, …) si falta una constante
 *   requerida del año fiscal (Req 5.7).
 */
export const calculateAguinaldo: CalculationFn<AguinaldoInput, FiscalConstants> = (
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

  const daysWorked = input.daysWorked;
  if (typeof daysWorked !== 'number' || !Number.isInteger(daysWorked)) {
    throw new CalculationError(
      'INVALID_INPUT',
      'daysWorked',
      'Los días trabajados deben ser un número entero.',
    );
  }
  if (daysWorked < 0 || daysWorked > PRORATION_YEAR_DAYS) {
    throw new CalculationError(
      'INVALID_INPUT',
      'daysWorked',
      `Los días trabajados (${daysWorked}) deben estar entre 0 y ${PRORATION_YEAR_DAYS}.`,
    );
  }

  // ── Concepto del desglose (Req 7.2 · `docs/formulas.md` §6) ──
  // Aguinaldo proporcional (LFT Art. 87): salarioDiario × 15 × díasTrabajados/365.
  // Para un año completo (días = 365) equivale al mínimo de ley de 15 días.
  const aguinaldo = roundMoney(
    (dailySalary * AGUINALDO_MIN_DAYS * daysWorked) / PRORATION_YEAR_DAYS,
  );

  const breakdown: BreakdownItem[] = [
    { concept: 'Aguinaldo', amount: aguinaldo },
  ];

  // Total = suma del desglose (Property 3), redondeado a 2 decimales.
  const total = roundMoney(breakdown.reduce((sum, item) => sum + item.amount, 0));

  return { total, breakdown };
};
