/**
 * Prueba de propiedad de `calculateVacaciones` (tarea 15.2).
 *
 * A diferencia de la prueba de ejemplo (`vacaciones.calculation.spec.ts`, que
 * fija casos concretos de referencia y casos límite contra la fuente oficial),
 * esta prueba verifica la RELACIÓN UNIVERSAL que debe cumplirse para CUALQUIER
 * entrada válida de vacaciones, usando `fast-check` con ≥100 iteraciones.
 *
 * Property 9 (ver design.md): para toda entrada válida de vacaciones, el
 * `breakdown` incluye el pago de vacaciones y la prima vacacional, y la prima
 * equivale al porcentaje definido (25 %, LFT Art. 80 · `docs/formulas.md` §5)
 * aplicado —con el mismo redondeo monetario— sobre el importe de las
 * vacaciones. Además, `total` es la suma redondeada de ambos conceptos y todos
 * los importes son no negativos.
 *
 * _Requirements: 7.3_
 */

import fc from 'fast-check';

import { FISCAL_CONSTANTS_2026 } from '../constants/fiscal-constants.2026';
import { roundMoney } from './rounding';
import { calculateVacaciones } from './vacaciones.calculation';

/** Salario mínimo diario vigente (cota inferior del salario válido, Req 4.1). */
const MIN_DAILY_WAGE = FISCAL_CONSTANTS_2026.minimumDailyWage;

/** Porcentaje de prima vacacional (LFT Art. 80 · `docs/formulas.md` §5). */
const PRIMA_VACACIONAL_RATE = 0.25;

/** Concepto del desglose correspondiente al pago de vacaciones. */
const PAGO_VACACIONES = 'Pago de vacaciones';
/** Concepto del desglose correspondiente a la prima vacacional. */
const PRIMA_VACACIONAL = 'Prima vacacional';

/**
 * Generador de entradas VÁLIDAS de vacaciones:
 * - salario diario ≥ salario mínimo (Req 4.1, 5.6),
 * - antigüedad como entero ≥ 0 (Req 5.6).
 */
const validInputArb = fc.record({
  dailySalary: fc.double({
    min: MIN_DAILY_WAGE,
    max: 100_000,
    noNaN: true,
    noDefaultInfinity: true,
  }),
  yearsOfService: fc.nat({ max: 60 }),
});

describe('calculateVacaciones — propiedad de vacaciones y prima vacacional', () => {
  // ── Property 9: vacaciones y prima vacacional guardan su relación (Req 7.3) ──
  it('Feature: calcula-facil, Property 9: el desglose incluye pago de vacaciones y prima vacacional, y la prima = 25 % del pago (mismo redondeo), con total = suma e importes no negativos', () => {
    fc.assert(
      fc.property(validInputArb, (input) => {
        const result = calculateVacaciones(input, FISCAL_CONSTANTS_2026);

        // (a) El desglose incluye ambos conceptos exigidos por Req 7.3.
        const pago = result.breakdown.find((item) => item.concept === PAGO_VACACIONES);
        const prima = result.breakdown.find((item) => item.concept === PRIMA_VACACIONAL);
        expect(pago).toBeDefined();
        expect(prima).toBeDefined();

        // (b) Relación fiscal: la prima equivale al 25 % del pago de vacaciones,
        // con el mismo redondeo monetario que aplica la función pura.
        expect(prima!.amount).toBe(roundMoney(pago!.amount * PRIMA_VACACIONAL_RATE));

        // (c) El total es la suma redondeada de ambos conceptos (Property 3/9).
        expect(result.total).toBe(roundMoney(pago!.amount + prima!.amount));

        // (d) Todos los importes son no negativos.
        expect(pago!.amount).toBeGreaterThanOrEqual(0);
        expect(prima!.amount).toBeGreaterThanOrEqual(0);
        expect(result.total).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 100 },
    );
  });
});
