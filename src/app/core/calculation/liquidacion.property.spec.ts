/**
 * Prueba de propiedad de la liquidación por despido injustificado (tarea 13.2).
 *
 * A diferencia de las pruebas de ejemplo (que fijan el caso de referencia oficial
 * y verifican importes exactos), esta prueba verifica una RELACIÓN UNIVERSAL que
 * `calculateLiquidacion` debe cumplir para CUALQUIER entrada válida, usando
 * `fast-check` con ≥100 iteraciones.
 *
 * Propiedad cubierta (ver design.md):
 *   - Property 7: Liquidación incluye los tres componentes legales (Req 7.1)
 *     Para toda entrada válida, el `breakdown` incluye la indemnización de tres
 *     meses, los veinte días de salario por año trabajado y la prima de
 *     antigüedad; el total es la suma redondeada del desglose y ningún importe
 *     es negativo.
 */

import fc from 'fast-check';

import { FISCAL_CONSTANTS_2026 } from '../constants/fiscal-constants.2026';
import { calculateLiquidacion, type LiquidacionInput } from './liquidacion.calculation';
import { MONEY_DECIMALS } from './rounding';

/** Salario mínimo diario vigente (cota inferior del salario válido, Req 4.1). */
const MIN_DAILY_WAGE = FISCAL_CONSTANTS_2026.minimumDailyWage;

/**
 * Generador de entradas VÁLIDAS de liquidación:
 * - salario diario ≥ salario mínimo vigente (Req 5.6),
 * - años de servicio como entero ≥ 0 (Req 5.6).
 */
const validInputArb: fc.Arbitrary<LiquidacionInput> = fc.record({
  dailySalary: fc.double({
    min: MIN_DAILY_WAGE,
    max: 100_000,
    noNaN: true,
    noDefaultInfinity: true,
  }),
  yearsOfService: fc.integer({ min: 0, max: 60 }),
});

describe('calculateLiquidacion — propiedad de la liquidación', () => {
  // ── Property 7: Liquidación incluye los tres componentes legales (Req 7.1) ──
  it('Feature: calcula-facil, Property 7: el desglose incluye los tres componentes legales', () => {
    const factor = 10 ** MONEY_DECIMALS;
    const roundMoney2 = (amount: number): number =>
      Math.round((amount + Number.EPSILON) * factor) / factor;

    fc.assert(
      fc.property(validInputArb, (input) => {
        const result = calculateLiquidacion(input, FISCAL_CONSTANTS_2026);
        const concepts = result.breakdown.map((item) => item.concept);

        // Los tres componentes legales están SIEMPRE presentes (Req 7.1).
        expect(concepts).toContain('Indemnización de 3 meses');
        expect(concepts).toContain('20 días de salario por año');
        expect(concepts).toContain('Prima de antigüedad');

        // El total es la suma redondeada del desglose.
        const sum = roundMoney2(
          result.breakdown.reduce((acc, item) => acc + item.amount, 0),
        );
        expect(result.total).toBe(sum);

        // Ningún importe (ni el total) es negativo.
        expect(result.total).toBeGreaterThanOrEqual(0);
        for (const item of result.breakdown) {
          expect(item.amount).toBeGreaterThanOrEqual(0);
        }
      }),
      { numRuns: 100 },
    );
  });
});
