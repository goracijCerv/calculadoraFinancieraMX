/**
 * Prueba de propiedad de `calculateIsr` y sus helpers (tarea 18.2).
 *
 * A diferencia de la prueba unitaria (`isr.calculation.spec.ts`, que fija casos
 * concretos de referencia en las fronteras de los tramos), esta prueba verifica
 * las RELACIONES UNIVERSALES que deben cumplirse para CUALQUIER ingreso mensual
 * válido, usando `fast-check` con ≥100 iteraciones.
 *
 * Property 11 (ver design.md): para todo ingreso mensual válido, el ISR
 * calculado:
 *   (a) corresponde al tramo (bracket) de la tabla del SAT cuyo rango contiene
 *       al ingreso — el de mayor `lowerLimit` que no lo excede — y la tarifa
 *       equivale a `cuotaFija + excedente × (% / 100)`;
 *   (b) nunca es negativo;
 *   (c) es monótono no decreciente al crecer el ingreso.
 *
 * Usa el conjunto oficial `FISCAL_CONSTANTS_2026`.
 *
 * _Requirements: 8.1_
 */

import fc from 'fast-check';

import { FISCAL_CONSTANTS_2026 } from '../constants/fiscal-constants.2026';
import type { IsrBracket } from '../constants/fiscal-constants.types';
import {
  calculateIsr,
  calculateIsrTariff,
  findIsrBracket,
  type IsrInput,
} from './isr.calculation';
import { MONEY_DECIMALS } from './rounding';

/** Tabla de la tarifa mensual del ISR del año vigente (Req 5.3, `docs/formulas.md` §3). */
const ISR_TABLE = FISCAL_CONSTANTS_2026.isrMonthlyTable;

/** Redondeo monetario a dos decimales, espejo del usado por la función pura. */
const MONEY_FACTOR = 10 ** MONEY_DECIMALS;
const roundMoney2 = (amount: number): number =>
  Math.round((amount + Number.EPSILON) * MONEY_FACTOR) / MONEY_FACTOR;

/**
 * Tramo esperado por fuerza bruta: el de mayor `lowerLimit` que no excede al
 * ingreso. Sirve de oráculo independiente del helper bajo prueba.
 */
const expectedBracket = (income: number): IsrBracket | undefined =>
  ISR_TABLE.filter((row) => income >= row.lowerLimit).reduce<IsrBracket | undefined>(
    (best, row) => (best === undefined || row.lowerLimit > best.lowerLimit ? row : best),
    undefined,
  );

/** Generador de ingresos mensuales válidos (≥ 0, finitos). */
const incomeArb: fc.Arbitrary<number> = fc.double({
  min: 0,
  max: 1_000_000,
  noNaN: true,
  noDefaultInfinity: true,
});

describe('calculateIsr — Property 11: tramo correcto, no negativo y monótono', () => {
  // ── (a) El tramo usado es el correcto y la tarifa aplica su fórmula ──
  it('Feature: calcula-facil, Property 11: la tarifa usa el tramo correcto (cuota fija + excedente × tasa)', () => {
    fc.assert(
      fc.property(incomeArb, (income) => {
        const bracket = findIsrBracket(ISR_TABLE, income);

        // El helper ubica el mismo tramo que el oráculo de fuerza bruta.
        expect(bracket).toEqual(expectedBracket(income));

        const tariff = calculateIsrTariff(ISR_TABLE, income);

        if (bracket === undefined) {
          // Ingreso por debajo del primer límite inferior ⇒ tarifa 0.
          expect(tariff).toBe(0);
        } else {
          const excess = income - bracket.lowerLimit;
          const expected = roundMoney2(bracket.fixedFee + excess * (bracket.rateOnExcess / 100));
          expect(tariff).toBe(expected);
        }
      }),
      { numRuns: 100 },
    );
  });

  // ── (b) El ISR neto a retener nunca es negativo ──
  it('Feature: calcula-facil, Property 11: el ISR calculado nunca es negativo', () => {
    fc.assert(
      fc.property(incomeArb, (income) => {
        const input: IsrInput = { monthlyIncome: income };
        const result = calculateIsr(input, FISCAL_CONSTANTS_2026);

        expect(result.total).toBeGreaterThanOrEqual(0);

        // Total = suma redondeada del desglose (coherencia estructural).
        const sum = roundMoney2(result.breakdown.reduce((acc, item) => acc + item.amount, 0));
        expect(result.total).toBe(sum);
      }),
      { numRuns: 100 },
    );
  });

  // ── (c) El ISR es monótono no decreciente al crecer el ingreso ──
  it('Feature: calcula-facil, Property 11: el ISR es monótono no decreciente respecto al ingreso', () => {
    fc.assert(
      fc.property(incomeArb, fc.double({ min: 0, max: 100_000, noNaN: true, noDefaultInfinity: true }), (income, delta) => {
        const lower = calculateIsr({ monthlyIncome: income }, FISCAL_CONSTANTS_2026);
        const upper = calculateIsr({ monthlyIncome: income + delta }, FISCAL_CONSTANTS_2026);

        // A mayor ingreso, el ISR no decrece.
        expect(upper.total).toBeGreaterThanOrEqual(lower.total);
      }),
      { numRuns: 100 },
    );
  });
});
