/**
 * Prueba de propiedad de `calculatePtu` (tarea 21.2).
 *
 * A diferencia de la prueba de ejemplo (`ptu.calculation.spec.ts`, que fija el
 * caso de referencia oficial de `docs/formulas.md` §9), esta prueba verifica la
 * RELACIÓN UNIVERSAL de conservación del reparto para CUALQUIER entrada válida
 * de PTU, usando `fast-check` con ≥100 iteraciones.
 *
 * Property 14 (ver design.md): para toda entrada válida de PTU, la suma de las
 * partes repartidas no excede el monto de utilidades a repartir y cada parte es
 * mayor o igual a cero. En concreto se comprueba que:
 *   - cada mitad del desglose (días y salarios) es ≥ 0;
 *   - la PTU final repartida (total) es ≥ 0;
 *   - la PTU final nunca excede el monto a repartir (dentro de la tolerancia de
 *     redondeo);
 *   - la PTU final nunca excede el tope individual (3 meses de salario o el
 *     promedio trienal, el mayor), dentro de la tolerancia de redondeo.
 *
 * _Requirements: 8.5_
 */

import fc from 'fast-check';

import { FISCAL_CONSTANTS_2026 } from '../constants/fiscal-constants.2026';
import { calculatePtu, type PtuInput } from './ptu.calculation';
import { MONEY_DECIMALS } from './rounding';

/** Meses de salario que fijan el tope individual base (reforma 2021 · §9). */
const CAP_MONTHS_OF_SALARY = 3;

/** Tolerancia de redondeo monetario (medio centavo) para comparaciones de cota. */
const MONEY_TOLERANCE = 0.5 / 10 ** MONEY_DECIMALS;

/**
 * Generador de entradas VÁLIDAS de PTU:
 * - montos y días no negativos y finitos (Req 5.6),
 * - totales estrictamente positivos (bases de reparto no nulas, Req 5.6),
 * - la parte de la persona nunca excede el total correspondiente
 *   (daysWorked ≤ totalDaysWorked, salaryEarned ≤ totalSalaries, Req 5.6),
 * - salario mensual positivo y promedio trienal no negativo (opcional).
 */
const validInputArb: fc.Arbitrary<PtuInput> = fc
  .record({
    amountToDistribute: fc.double({
      min: 0,
      max: 10_000_000,
      noNaN: true,
      noDefaultInfinity: true,
    }),
    totalDaysWorked: fc.double({
      min: 1,
      max: 1_000_000,
      noNaN: true,
      noDefaultInfinity: true,
    }),
    dayFraction: fc.double({ min: 0, max: 1, noNaN: true, noDefaultInfinity: true }),
    totalSalaries: fc.double({
      min: 1,
      max: 100_000_000,
      noNaN: true,
      noDefaultInfinity: true,
    }),
    salaryFraction: fc.double({ min: 0, max: 1, noNaN: true, noDefaultInfinity: true }),
    monthlySalary: fc.double({
      min: 1,
      max: 500_000,
      noNaN: true,
      noDefaultInfinity: true,
    }),
    triennialAverage: fc.option(
      fc.double({ min: 0, max: 1_000_000, noNaN: true, noDefaultInfinity: true }),
      { nil: undefined },
    ),
  })
  .map(({ totalDaysWorked, dayFraction, totalSalaries, salaryFraction, ...rest }) => ({
    ...rest,
    totalDaysWorked,
    // La fracción (0..1) garantiza que la parte de la persona ≤ el total.
    daysWorked: totalDaysWorked * dayFraction,
    totalSalaries,
    salaryEarned: totalSalaries * salaryFraction,
  }));

describe('calculatePtu — propiedad de conservación del reparto', () => {
  // ── Property 14: conservación del reparto de PTU (Req 8.5) ──
  it('Feature: calcula-facil, Property 14: Conservación del reparto de PTU — cada parte es ≥ 0 y la PTU repartida no excede el monto a repartir ni el tope individual', () => {
    fc.assert(
      fc.property(validInputArb, (input) => {
        const result = calculatePtu(input, FISCAL_CONSTANTS_2026);

        // Cada mitad del desglose por días/salarios es no negativa.
        const halfItems = result.breakdown.filter(
          (item) =>
            item.concept === 'Mitad por días trabajados' ||
            item.concept === 'Mitad por salarios devengados',
        );
        for (const item of halfItems) {
          expect(item.amount).toBeGreaterThanOrEqual(0);
        }

        // La PTU final repartida nunca es negativa.
        expect(result.total).toBeGreaterThanOrEqual(0);

        // La PTU final no excede el monto total a repartir (dentro del redondeo).
        expect(result.total).toBeLessThanOrEqual(input.amountToDistribute + MONEY_TOLERANCE);

        // La PTU final no excede el tope individual (dentro del redondeo).
        const cap = Math.max(
          CAP_MONTHS_OF_SALARY * input.monthlySalary,
          input.triennialAverage ?? 0,
        );
        expect(result.total).toBeLessThanOrEqual(cap + MONEY_TOLERANCE);
      }),
      { numRuns: 100 },
    );
  });
});
