/**
 * PTU — Participación de los Trabajadores en las Utilidades — función pura de
 * cálculo (Fase 3) (Req 5.5, 5.6, 8.5, 8.6).
 *
 * Calcula la PTU que corresponde a UNA persona trabajadora dentro del reparto
 * global de la empresa. El monto a repartir (10 % de la renta gravable
 * declarada ante el SAT) se divide en dos mitades iguales: la Mitad A se reparte
 * por los días trabajados y la Mitad B en proporción a los salarios devengados.
 * Al final se aplica el tope individual de la reforma 2021.
 *
 * ── Fuentes oficiales (verificadas en Fase 0, ver `docs/formulas.md` §9) ──
 * - Reparto en dos mitades (días y salarios): LFT Art. 117–131 · 2026 · `docs/formulas.md` §9.
 * - Tope individual (3 meses de salario o promedio trienal, el mayor):
 *   reforma 2021 de la LFT · 2026 · `docs/formulas.md` §9.
 *
 * Fórmulas (todas de `docs/formulas.md` §9):
 *   mitadA = (montoARepartir / 2) × (díasTrabajados / díasTotales)
 *   mitadB = (montoARepartir / 2) × (salarioDevengado / salariosTotales)
 *   ptuBruta = mitadA + mitadB
 *   tope = max(3 × salarioMensual, promedioTrienal)
 *   ptuFinal = min(ptuBruta, tope)
 *
 * Invariante (Property 14): la suma de las partes repartidas no excede el monto
 * a repartir y cada parte es ≥ 0.
 *
 * Caso de referencia de §9 (verificación): montoARepartir 120 000, un solo
 * trabajador con 365 de 365 días y salario que representa el 100 % de la base
 * ⇒ Mitad A 60 000 + Mitad B 60 000 = reparto bruto 120 000; con salario mensual
 * 10 000 el tope por 3 meses = 30 000, por lo que la PTU final = **30 000.00**.
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

/** Meses de salario que fijan el tope individual base (reforma 2021 · §9). */
const CAP_MONTHS_OF_SALARY = 3;

/**
 * DTO de entrada de la calculadora de PTU para una persona trabajadora
 * (Req 8.5, ver design.md y `docs/formulas.md` §9).
 */
export interface PtuInput {
  /** Monto total a repartir en la empresa, en pesos (positivo) (Req 5.6). */
  amountToDistribute: number;
  /** Días trabajados por la persona en el año (≥ 0, ≤ total) (Req 5.6). */
  daysWorked: number;
  /** Suma de días trabajados por todo el personal en el año (positivo) (Req 5.6). */
  totalDaysWorked: number;
  /** Salario devengado por la persona en el año, en pesos (≥ 0, ≤ total) (Req 5.6). */
  salaryEarned: number;
  /** Suma de salarios devengados por todo el personal en el año (positivo) (Req 5.6). */
  totalSalaries: number;
  /** Salario mensual de la persona, base del tope de 3 meses (positivo) (Req 5.6). */
  monthlySalary: number;
  /**
   * Promedio de la PTU recibida en los últimos 3 años (≥ 0). El tope individual
   * es el mayor entre 3 meses de salario y este promedio (reforma 2021 · §9).
   * Opcional: si se omite se asume 0 (sin histórico).
   */
  triennialAverage?: number;
}

/**
 * Valida que un número de entrada sea finito y ≥ 0; lanza INVALID_INPUT si no.
 *
 * @throws CalculationError('INVALID_INPUT', campo, …) ante dato no numérico,
 *   no finito o negativo (Req 5.6).
 */
function assertNonNegative(value: number, field: string, label: string): void {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new CalculationError(
      'INVALID_INPUT',
      field,
      `${label} debe ser un número mayor o igual a cero.`,
    );
  }
}

/**
 * Valida que un denominador (días o salarios totales) sea finito y > 0.
 *
 * @throws CalculationError('INVALID_INPUT', campo, …) si es ≤ 0 o no finito
 *   (no se puede repartir sobre una base nula) (Req 5.6).
 */
function assertPositiveTotal(value: number, field: string, label: string): void {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new CalculationError(
      'INVALID_INPUT',
      field,
      `${label} debe ser un número mayor a cero.`,
    );
  }
}

/**
 * Calcula la PTU de una persona trabajadora (función pura, Req 5.5).
 *
 * El parámetro `constants` se recibe por uniformidad con `CalculationFn`
 * (todas las calculadoras comparten la firma), aunque la PTU no depende de las
 * constantes del año fiscal: su base la declara el patrón ante el SAT.
 *
 * @throws CalculationError('INVALID_INPUT', campo, …) si un dato falta o queda
 *   fuera de rango (negativos, totales ≤ 0, la parte de la persona excede el
 *   total) (Req 5.6).
 */
export const calculatePtu: CalculationFn<PtuInput, FiscalConstants> = (
  input,
): CalculationResult => {
  // ── Validación de datos de entrada (Req 5.6) ──
  assertNonNegative(input.amountToDistribute, 'amountToDistribute', 'El monto a repartir');
  assertNonNegative(input.daysWorked, 'daysWorked', 'Los días trabajados');
  assertPositiveTotal(input.totalDaysWorked, 'totalDaysWorked', 'El total de días trabajados');
  assertNonNegative(input.salaryEarned, 'salaryEarned', 'El salario devengado');
  assertPositiveTotal(input.totalSalaries, 'totalSalaries', 'El total de salarios devengados');
  assertPositiveTotal(input.monthlySalary, 'monthlySalary', 'El salario mensual');

  const triennialAverage = input.triennialAverage ?? 0;
  assertNonNegative(triennialAverage, 'triennialAverage', 'El promedio trienal de PTU');

  // La parte de la persona no puede exceder la base total del reparto (Req 5.6).
  if (input.daysWorked > input.totalDaysWorked) {
    throw new CalculationError(
      'INVALID_INPUT',
      'daysWorked',
      'Los días trabajados no pueden exceder el total de días trabajados.',
    );
  }
  if (input.salaryEarned > input.totalSalaries) {
    throw new CalculationError(
      'INVALID_INPUT',
      'salaryEarned',
      'El salario devengado no puede exceder el total de salarios devengados.',
    );
  }

  // ── Reparto en dos mitades iguales (`docs/formulas.md` §9) ──
  const half = input.amountToDistribute / 2;

  // Mitad A: proporcional a los días trabajados por la persona.
  const halfA = roundMoney(half * (input.daysWorked / input.totalDaysWorked));

  // Mitad B: proporcional a los salarios devengados por la persona.
  const halfB = roundMoney(half * (input.salaryEarned / input.totalSalaries));

  // PTU bruta antes del tope individual.
  const grossPtu = halfA + halfB;

  // ── Tope individual (reforma 2021): mayor de 3 meses de salario o promedio
  //    trienal (`docs/formulas.md` §9) ──
  const cap = Math.max(CAP_MONTHS_OF_SALARY * input.monthlySalary, triennialAverage);
  const finalPtu = roundMoney(Math.min(grossPtu, cap));

  const breakdown: BreakdownItem[] = [
    { concept: 'Mitad por días trabajados', amount: halfA },
    { concept: 'Mitad por salarios devengados', amount: halfB },
  ];

  // Si el tope individual recorta la PTU bruta, se refleja en el desglose como
  // un ajuste negativo, de modo que total = suma del desglose (Property 3) y la
  // PTU repartida nunca excede el monto a repartir (Property 14).
  if (finalPtu < roundMoney(grossPtu)) {
    breakdown.push({
      concept: 'Ajuste por tope individual',
      amount: roundMoney(finalPtu - roundMoney(grossPtu)),
    });
  }

  const total = roundMoney(breakdown.reduce((sum, item) => sum + item.amount, 0));

  return { total, breakdown };
};
