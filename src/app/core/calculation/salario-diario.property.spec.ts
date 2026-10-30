/**
 * Prueba de propiedad de `calculateSalarioDiario` (tarea 20.2).
 *
 * A diferencia de la prueba de ejemplo (`salario-diario.calculation.spec.ts`,
 * que fija casos concretos de referencia y casos límite de validación), esta
 * prueba verifica la RELACIÓN UNIVERSAL que debe cumplirse para CUALQUIER monto
 * positivo y CUALQUIER periodicidad válida, usando `fast-check` con ≥100
 * iteraciones.
 *
 * Property 13 (ver design.md): para todo salario de periodicidad distinta a la
 * diaria, convertirlo a su equivalente diario y reexpandirlo a la periodicidad
 * original (salarioDiario × díasDelPeriodo) reproduce el monto original dentro
 * de la tolerancia de redondeo monetario a dos decimales. Adicionalmente, el
 * salario diario es positivo y nunca excede el monto de origen.
 *
 * La función no consume `FiscalConstants`; se pasa `FISCAL_CONSTANTS_2026` para
 * respetar la firma `CalculationFn`, pero el resultado no depende de él.
 *
 * _Requirements: 8.4_
 */

import fc from 'fast-check';

import { FISCAL_CONSTANTS_2026 } from '../constants/fiscal-constants.2026';
import {
  calculateSalarioDiario,
  PERIOD_DIVISORS,
  type SalarioPeriod,
} from './salario-diario.calculation';

/** Periodicidades válidas (las claves del mapa de divisores documentado). */
const PERIODS = Object.keys(PERIOD_DIVISORS) as SalarioPeriod[];

describe('calculateSalarioDiario — propiedad de conversión de salario diario', () => {
  // ── Property 13: la conversión es consistente (Req 8.4) ──
  it('Feature: calcula-facil, Property 13: reexpandir el salario diario reproduce el monto original y el diario es positivo y ≤ al monto', () => {
    fc.assert(
      fc.property(
        // Monto > 0, finito y acotado a un rango monetario razonable. El mínimo
        // es 1 peso: por debajo de ~0.30 el salario diario (monto / 30 como
        // máximo divisor) se redondearía por debajo de un centavo a $0.00, lo
        // cual es el comportamiento correcto del redondeo monetario pero no un
        // caso significativo para un conversor de salarios. Un monto ≥ 1 peso
        // garantiza un salario diario de al menos un centavo.
        fc.double({ min: 1, max: 10_000_000, noNaN: true, noDefaultInfinity: true }),
        fc.constantFrom(...PERIODS),
        (amount, period) => {
          const divisor = PERIOD_DIVISORS[period];
          const result = calculateSalarioDiario({ amount, period }, FISCAL_CONSTANTS_2026);
          const dailySalary = result.total;

          // (a) Consistencia: reexpandir el diario a la periodicidad de origen
          // reproduce el monto original salvo el redondeo monetario. El salario
          // diario se redondea a 2 decimales, por lo que el error por día está
          // acotado por 0.005; al reexpandir multiplicando por el divisor, la
          // tolerancia correcta de la reconstrucción es 0.005 × díasDelPeriodo
          // (no una tolerancia fija: escala con el divisor). Se añade un épsilon
          // por el ruido de punto flotante de la multiplicación.
          const reconstructed = dailySalary * divisor;
          const tolerance = 0.005 * divisor + 1e-9;
          expect(Math.abs(reconstructed - amount)).toBeLessThanOrEqual(tolerance);

          // (b) El salario diario es estrictamente positivo (monto > 0).
          expect(dailySalary).toBeGreaterThan(0);

          // (c) El salario diario nunca excede el monto de origen (divisor ≥ 7),
          // con un margen por el redondeo hacia arriba del último centavo.
          expect(dailySalary).toBeLessThanOrEqual(amount + 0.005);
        },
      ),
      { numRuns: 100 },
    );
  });
});
