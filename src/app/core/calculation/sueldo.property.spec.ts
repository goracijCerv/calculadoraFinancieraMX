/**
 * Prueba de propiedad de la conversión de sueldo neto ↔ bruto (tarea 19.2).
 *
 * A diferencia de las pruebas de ejemplo (`sueldo.calculation.spec.ts`, tarea
 * 19.1), que fijan casos de referencia con importes exactos, esta prueba
 * verifica una RELACIÓN UNIVERSAL que `calculateSueldo` debe cumplir para
 * CUALQUIER entrada válida, usando `fast-check` con ≥100 iteraciones.
 *
 * Propiedad cubierta (ver design.md):
 *   - Property 12: Round trip de conversión neto ↔ bruto (Req 8.2, 8.3)
 *     Para todo bruto > 0, convertir bruto → neto (Req 8.2) y luego neto → bruto
 *     (Req 8.3) reproduce el bruto original dentro de la tolerancia de redondeo a
 *     dos decimales. La dirección inversa (neto → bruto → neto) también se
 *     mantiene. La inversión neto → bruto es cerrada por tramo (no iterativa),
 *     por lo que el round trip es exacto salvo por el redondeo a centavos.
 */

import fc from 'fast-check';

import { FISCAL_CONSTANTS_2026 } from '../constants/fiscal-constants.2026';
import { calculateSueldo } from './sueldo.calculation';

const constants = FISCAL_CONSTANTS_2026;

/**
 * Tolerancia del round trip, en pesos. Como `calculateSueldo` redondea su
 * resultado a centavos (dos decimales), un importe de entrada con más de dos
 * decimales se recupera con una diferencia de hasta medio centavo por cada
 * redondeo; el round trip completo acumula a lo sumo ±0.01 (un centavo). Se
 * compara con `toBeLessThanOrEqual(ROUND_TRIP_TOLERANCE)` en vez de
 * `toBeCloseTo(_, 2)` porque este último exige una diferencia < 0.005, más
 * estricta que el propio redondeo a centavos de la función.
 *
 * Se añade un épsilon (1e-9) para absorber el ruido de representación en coma
 * flotante IEEE-754: un centavo exacto puede computarse como 0.0100000000093,
 * que no es un error de cálculo sino un artefacto del binario. El épsilon es
 * muchísimo menor que un centavo, así que no afloja la cota real de un centavo.
 */
const ROUND_TRIP_TOLERANCE = 0.01 + 1e-9;

/**
 * Generador de importes mensuales VÁLIDOS (> 0), en pesos, CUANTIZADOS A
 * CENTAVOS. Un sueldo real es un importe con dos decimales exactos; la
 * calculadora redondea sus resultados a centavos, de modo que el round trip
 * solo está acotado a ±1 centavo cuando la ENTRADA también es un importe de
 * centavos exactos. Generar `double` arbitrarios (p.ej. 878103.1600000011)
 * introduciría un error de cuantización adicional ajeno a la conversión y no
 * representaría un sueldo real. Por eso se generan centavos enteros (1 a
 * 100 000 000, es decir 0.01 a 1 000 000.00 pesos) y se dividen entre 100.
 * El rango cubre todos los tramos de la tarifa del ISR.
 */
const positiveAmountArb: fc.Arbitrary<number> = fc
  .integer({ min: 1, max: 100_000_000 })
  .map((cents) => cents / 100);

describe('calculateSueldo — propiedad de conversión neto ↔ bruto', () => {
  // ── Property 12: Round trip de conversión neto ↔ bruto (Req 8.2, 8.3) ──
  it('Feature: calcula-facil, Property 12: bruto → neto → bruto reproduce el bruto original', () => {
    fc.assert(
      fc.property(positiveAmountArb, (gross) => {
        // Bruto → neto (Req 8.2).
        const net = calculateSueldo(
          { amount: gross, direction: 'gross-to-net' },
          constants,
        ).total;

        // Neto → bruto (Req 8.3).
        const back = calculateSueldo(
          { amount: net, direction: 'net-to-gross' },
          constants,
        ).total;

        // El round trip recupera el bruto original dentro de la tolerancia de
        // redondeo a centavos (±0.01).
        expect(Math.abs(back - gross)).toBeLessThanOrEqual(ROUND_TRIP_TOLERANCE);
      }),
      { numRuns: 100 },
    );
  });

  it('Feature: calcula-facil, Property 12: neto → bruto → neto reproduce el neto original', () => {
    fc.assert(
      fc.property(positiveAmountArb, (net) => {
        // Neto → bruto (Req 8.3).
        const gross = calculateSueldo(
          { amount: net, direction: 'net-to-gross' },
          constants,
        ).total;

        // Bruto → neto (Req 8.2).
        const back = calculateSueldo(
          { amount: gross, direction: 'gross-to-net' },
          constants,
        ).total;

        // El round trip recupera el neto original dentro de la tolerancia de
        // redondeo a centavos (±0.01).
        expect(Math.abs(back - net)).toBeLessThanOrEqual(ROUND_TRIP_TOLERANCE);
      }),
      { numRuns: 100 },
    );
  });
});
