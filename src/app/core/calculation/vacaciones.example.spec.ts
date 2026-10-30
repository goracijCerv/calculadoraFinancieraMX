/**
 * Prueba de ejemplo de vacaciones y prima vacacional contra la fuente oficial
 * (tarea 15.3).
 *
 * A diferencia de las pruebas unitarias de 15.1 (ejemplos y casos límite) y del
 * property test de 15.2 (Property 9, relación universal), esta prueba fija el
 * CASO DE REFERENCIA documentado en `docs/formulas.md` §5 (LFT Art. 76 y 80) y
 * verifica los IMPORTES EXACTOS del desglose y el total usando las constantes
 * verificadas en Fase 0 (`FISCAL_CONSTANTS_2026`). Si la fórmula o alguna
 * constante (p. ej. la tabla de días del Art. 76 o el 25 % del Art. 80) se
 * desvía del valor oficial documentado, los asertos fallan.
 *
 * Caso de referencia (docs/formulas.md §5):
 *   salario diario $500.00, antigüedad 1 año (12 días de vacaciones):
 *     - pagoVacaciones  = 500.00 × 12      = $6,000.00
 *     - primaVacacional = 6,000.00 × 0.25  = $1,500.00
 *     - total           = 6,000 + 1,500    = $7,500.00
 *
 * _Requirements: 5.2, 7.3_
 */

import { FISCAL_CONSTANTS_2026 } from '../constants/fiscal-constants.2026';
import { calculateVacaciones, type VacacionesInput } from './vacaciones.calculation';

describe('calculateVacaciones — caso de referencia oficial (docs/formulas.md §5)', () => {
  /** Busca el importe de un concepto del desglose por su nombre. */
  const amountOf = (
    breakdown: readonly { concept: string; amount: number }[],
    concept: string,
  ): number => {
    const item = breakdown.find((row) => row.concept === concept);
    // El desglose debe incluir el concepto buscado.
    expect(item).toBeDefined();
    return item!.amount;
  };

  describe('antigüedad 1 año — salario diario $500.00 (LFT Art. 76 y 80 · §5)', () => {
    const referenceInput: VacacionesInput = { dailySalary: 500, yearsOfService: 1 };

    it('calcula el pago de vacaciones oficial de $6,000.00 (500 × 12)', () => {
      const result = calculateVacaciones(referenceInput, FISCAL_CONSTANTS_2026);
      expect(amountOf(result.breakdown, 'Pago de vacaciones')).toBe(6000.0);
    });

    it('calcula la prima vacacional oficial de $1,500.00 (6,000 × 0.25)', () => {
      const result = calculateVacaciones(referenceInput, FISCAL_CONSTANTS_2026);
      expect(amountOf(result.breakdown, 'Prima vacacional')).toBe(1500.0);
    });

    it('el total coincide con el valor oficial documentado de $7,500.00', () => {
      const result = calculateVacaciones(referenceInput, FISCAL_CONSTANTS_2026);
      expect(result.total).toBe(7500.0);
    });

    it('el total es exactamente la suma del desglose documentado (Req 7.3 · Property 3/9)', () => {
      const result = calculateVacaciones(referenceInput, FISCAL_CONSTANTS_2026);
      const sum = result.breakdown.reduce((acc, item) => acc + item.amount, 0);
      expect(result.total).toBe(sum);
      expect(result.total).toBe(7500.0);
    });
  });
});
