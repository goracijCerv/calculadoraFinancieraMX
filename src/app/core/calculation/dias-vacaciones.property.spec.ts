/**
 * Prueba de propiedad de `calculateDiasVacaciones` (tarea 16.2).
 *
 * A diferencia de la prueba de ejemplo (`dias-vacaciones.calculation.spec.ts`,
 * que fija casos concretos de referencia y casos límite), esta prueba verifica
 * la RELACIÓN UNIVERSAL que debe cumplirse para CUALQUIER antigüedad válida,
 * usando `fast-check` con ≥100 iteraciones.
 *
 * Property 10 (ver design.md): para toda antigüedad válida, los días de
 * vacaciones devueltos coinciden con la fila correspondiente de la tabla de la
 * reforma 2023 del `Constants_Module` (la fila mayor cuya antigüedad no excede
 * la antigüedad dada; 0 por debajo de la primera fila), y la función es
 * monótona no decreciente respecto a la antigüedad.
 *
 * _Requirements: 7.4_
 */

import fc from 'fast-check';

import { FISCAL_CONSTANTS_2026 } from '../constants/fiscal-constants.2026';
import { calculateDiasVacaciones } from './dias-vacaciones.calculation';

/** Tabla oficial de días de vacaciones vigente (Art. 76 LFT, reforma 2023). */
const VACATION_TABLE = FISCAL_CONSTANTS_2026.vacationDaysTable;

/**
 * Referencia independiente del cálculo esperado: días correspondientes a una
 * antigüedad según la tabla (fila mayor cuya `yearsOfService` no excede `years`;
 * 0 por debajo de la primera fila). Reimplementada aquí de forma deliberada
 * para contrastar la función bajo prueba contra la tabla, no contra sí misma.
 */
function expectedDays(years: number): number {
  let days = 0;
  for (const row of VACATION_TABLE) {
    if (row.yearsOfService <= years) {
      days = row.days;
    }
  }
  return days;
}

describe('calculateDiasVacaciones — propiedad de días de vacaciones', () => {
  // ── Property 10: coinciden con la tabla y no decrecen (Req 7.4) ──
  it('Feature: calcula-facil, Property 10: los días coinciden con la tabla y son monótonos no decrecientes respecto a la antigüedad', () => {
    fc.assert(
      fc.property(fc.nat({ max: 60 }), (years) => {
        const result = calculateDiasVacaciones({ yearsOfService: years }, FISCAL_CONSTANTS_2026);

        // (a) Coincide con la fila correspondiente de la tabla.
        expect(result.total).toBe(expectedDays(years));

        // (b) Monótona no decreciente: al aumentar la antigüedad, los días nunca
        // disminuyen (se compara contra la antigüedad inmediatamente anterior).
        if (years > 0) {
          const previous = calculateDiasVacaciones(
            { yearsOfService: years - 1 },
            FISCAL_CONSTANTS_2026,
          );
          expect(result.total).toBeGreaterThanOrEqual(previous.total);
        }
      }),
      { numRuns: 100 },
    );
  });
});
