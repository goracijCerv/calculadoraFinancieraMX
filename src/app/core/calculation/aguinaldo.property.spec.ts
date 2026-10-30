/**
 * Prueba de propiedad de `calculateAguinaldo` (tarea 14.2).
 *
 * A diferencia de la prueba de ejemplo (`aguinaldo.calculation.spec.ts`, que
 * fija casos concretos de referencia contra la fuente oficial), esta prueba
 * verifica la RELACIÓN UNIVERSAL que debe cumplirse para CUALQUIER entrada
 * válida de aguinaldo, usando `fast-check` con ≥100 iteraciones.
 *
 * Property 8 (ver design.md): para toda entrada válida de aguinaldo
 * correspondiente a un AÑO COMPLETO trabajado (díasTrabajados = 365), el
 * aguinaldo calculado no es menor que el equivalente a quince días de salario
 * (la cota inferior de ley, LFT Art. 87). Complementariamente se verifica que:
 *   - el año completo equivale EXACTAMENTE a 15 días de salario (nunca menos);
 *   - los casos proporcionales escalan linealmente con los días trabajados y
 *     nunca superan el importe del año completo;
 *   - el total es la suma redondeada del desglose;
 *   - el aguinaldo nunca es negativo.
 *
 * _Requirements: 7.2_
 */

import fc from 'fast-check';

import { FISCAL_CONSTANTS_2026 } from '../constants/fiscal-constants.2026';
import { calculateAguinaldo, type AguinaldoInput } from './aguinaldo.calculation';
import { MONEY_DECIMALS } from './rounding';

/** Salario mínimo diario vigente (cota inferior del salario válido, Req 4.1). */
const MIN_DAILY_WAGE = FISCAL_CONSTANTS_2026.minimumDailyWage;

/** Días de aguinaldo mínimos de ley (LFT Art. 87, `docs/formulas.md` §6). */
const AGUINALDO_MIN_DAYS = 15;

/** Base de prorrateo anual fijada en `docs/formulas.md` §6/§7 (año de 365 días). */
const PRORATION_YEAR_DAYS = 365;

/** Redondeo monetario a dos decimales, espejo del usado por la función pura. */
const MONEY_FACTOR = 10 ** MONEY_DECIMALS;
const roundMoney2 = (amount: number): number =>
  Math.round((amount + Number.EPSILON) * MONEY_FACTOR) / MONEY_FACTOR;

/** Generador de salarios diarios válidos (≥ salario mínimo vigente). */
const dailySalaryArb: fc.Arbitrary<number> = fc.double({
  min: MIN_DAILY_WAGE,
  max: 100_000,
  noNaN: true,
  noDefaultInfinity: true,
});

/** Generador de días trabajados válidos (entero 0..365). */
const daysWorkedArb: fc.Arbitrary<number> = fc.integer({ min: 0, max: PRORATION_YEAR_DAYS });

describe('calculateAguinaldo — propiedad de cota inferior de 15 días', () => {
  // ── Property 8: año completo ⇒ al menos (exactamente) 15 días (Req 7.2) ──
  it('Feature: calcula-facil, Property 8: un año completo equivale al menos a 15 días de salario y nunca menos', () => {
    fc.assert(
      fc.property(dailySalaryArb, (dailySalary) => {
        const input: AguinaldoInput = { dailySalary, daysWorked: PRORATION_YEAR_DAYS };
        const result = calculateAguinaldo(input, FISCAL_CONSTANTS_2026);

        const fullYearMinimum = roundMoney2(dailySalary * AGUINALDO_MIN_DAYS);

        // Cota inferior de ley: nunca por debajo de 15 días de salario.
        expect(result.total).toBeGreaterThanOrEqual(fullYearMinimum);
        // El año completo coincide exactamente con el mínimo de 15 días.
        expect(result.total).toBe(fullYearMinimum);
      }),
      { numRuns: 100 },
    );
  });

  // ── Proporcionalidad: escala lineal y acotada por el año completo (Req 7.2) ──
  it('Feature: calcula-facil, Property 8: el aguinaldo proporcional escala con los días y no supera el año completo', () => {
    fc.assert(
      fc.property(dailySalaryArb, daysWorkedArb, (dailySalary, daysWorked) => {
        const result = calculateAguinaldo({ dailySalary, daysWorked }, FISCAL_CONSTANTS_2026);

        // No negativo para cualquier entrada válida.
        expect(result.total).toBeGreaterThanOrEqual(0);

        // Nunca excede el importe del año completo (= 15 días de salario).
        const fullYear = calculateAguinaldo(
          { dailySalary, daysWorked: PRORATION_YEAR_DAYS },
          FISCAL_CONSTANTS_2026,
        );
        expect(result.total).toBeLessThanOrEqual(fullYear.total);

        // Escala lineal: coincide con la fórmula de prorrateo redondeada.
        const expected = roundMoney2(
          (dailySalary * AGUINALDO_MIN_DAYS * daysWorked) / PRORATION_YEAR_DAYS,
        );
        expect(result.total).toBe(expected);

        // Total = suma redondeada del desglose (Property 3).
        const sum = roundMoney2(result.breakdown.reduce((acc, item) => acc + item.amount, 0));
        expect(result.total).toBe(sum);
      }),
      { numRuns: 100 },
    );
  });

  // ── Monotonía: a más días trabajados, el aguinaldo no decrece (Req 7.2) ──
  it('Feature: calcula-facil, Property 8: el aguinaldo es monótono no decreciente respecto a los días trabajados', () => {
    fc.assert(
      fc.property(
        dailySalaryArb,
        fc.integer({ min: 0, max: PRORATION_YEAR_DAYS - 1 }),
        (dailySalary, days) => {
          const lower = calculateAguinaldo({ dailySalary, daysWorked: days }, FISCAL_CONSTANTS_2026);
          const upper = calculateAguinaldo(
            { dailySalary, daysWorked: days + 1 },
            FISCAL_CONSTANTS_2026,
          );
          expect(upper.total).toBeGreaterThanOrEqual(lower.total);
        },
      ),
      { numRuns: 100 },
    );
  });
});
