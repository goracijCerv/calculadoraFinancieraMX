/**
 * Property test del Staleness_Check — relación estricta de desfase (tarea 11.8).
 *
 * A diferencia de la prueba de ejemplo (`staleness.spec.ts`, que fija casos
 * representativos y la pureza de la función), esta prueba verifica la RELACIÓN
 * UNIVERSAL que `checkStaleness` debe cumplir para CUALQUIER par de años, usando
 * `fast-check` con ≥100 iteraciones.
 *
 * Propiedad cubierta (ver design.md → "Staleness_Check y aviso de vigencia"):
 *   - Property 23: Detección de desfase (Req 17.2, 17.3)
 *     `isStale` es `true` si y solo si `currentYear > fiscalYear`, y la función
 *     refleja de vuelta el año fiscal y el año actual observados.
 */

import fc from 'fast-check';

import { checkStaleness } from './staleness';

/** Rango de años acotado (cubre pasado y futuro sin perder cobertura). */
const yearArb = fc.integer({ min: 0, max: 9999 });

describe('checkStaleness — propiedad de detección de desfase', () => {
  // ── Property 23: Detección de desfase (Req 17.2, 17.3) ──
  it('Feature: calcula-facil, Property 23: isStale ⇔ currentYear > fiscalYear y se reflejan los años', () => {
    fc.assert(
      fc.property(yearArb, yearArb, (currentYear, fiscalYear) => {
        const status = checkStaleness(currentYear, { fiscalYear });

        // Relación estricta de desfase: verdadero si y solo si el año actual es
        // posterior al año fiscal de las constantes cargadas (Req 17.2, 17.3).
        expect(status.isStale).toBe(currentYear > fiscalYear);

        // La función refleja de vuelta los años observados (Req 17.1).
        expect(status.fiscalYear).toBe(fiscalYear);
        expect(status.currentYear).toBe(currentYear);
      }),
      { numRuns: 100 },
    );
  });
});
