/**
 * Prueba de ejemplo de la liquidación contra la fuente oficial (tarea 13.3).
 *
 * A diferencia de las pruebas de propiedades (relaciones universales), esta
 * prueba fija los CASOS DE REFERENCIA documentados en `docs/formulas.md` §8
 * (LFT Art. 48, 50, 162, 485–486) y verifica los IMPORTES EXACTOS del desglose
 * y el total. Usa las constantes oficiales del año fiscal vigente
 * (`FISCAL_CONSTANTS_2026`): salario mínimo general $315.04/día ⇒ tope de la
 * prima de antigüedad 2 × 315.04 = $630.08/día. Si la fórmula o alguna de esas
 * constantes se desvía del valor oficial documentado, los asertos fallan.
 *
 * Caso de referencia (a) — sin tope (docs/formulas.md §8):
 *   salario diario $500.00, antigüedad 5 años, zona general (tope $630.08, no
 *   aplica porque 500 < 630.08):
 *     - Indemnización 3 meses   = 500 × 90       = $45,000.00  (LFT Art. 48)
 *     - 20 días por año         = 500 × 20 × 5   = $50,000.00  (LFT Art. 50 fr. II)
 *     - Prima de antigüedad     = 500 × 12 × 5   = $30,000.00  (LFT Art. 162)
 *     - TOTAL                   =                 $125,000.00
 *
 * Caso de referencia (b) — con tope aplicado (docs/formulas.md §8):
 *   salario diario $1,000.00, antigüedad 3 años, zona general:
 *     - Prima de antigüedad = min(1000, 630.08) × 12 × 3 = $22,682.88
 *
 * _Requirements: 5.2, 7.1_
 */

import { FISCAL_CONSTANTS_2026 } from '../constants/fiscal-constants.2026';
import { calculateLiquidacion, type LiquidacionInput } from './liquidacion.calculation';

describe('calculateLiquidacion — casos de referencia oficiales (docs/formulas.md §8)', () => {
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

  describe('caso (a): salario $500.00, 5 años, sin tope (500 < 630.08)', () => {
    /** Insumo exacto del caso de referencia (a) de §8. */
    const referenceInput: LiquidacionInput = { dailySalary: 500, yearsOfService: 5 };

    it('calcula la indemnización constitucional oficial de $45,000.00 (LFT Art. 48 · §8)', () => {
      const result = calculateLiquidacion(referenceInput, FISCAL_CONSTANTS_2026);
      expect(amountOf(result.breakdown, 'Indemnización de 3 meses')).toBe(45000.0);
    });

    it('calcula los 20 días por año oficiales de $50,000.00 (LFT Art. 50 fr. II · §8)', () => {
      const result = calculateLiquidacion(referenceInput, FISCAL_CONSTANTS_2026);
      expect(amountOf(result.breakdown, '20 días de salario por año')).toBe(50000.0);
    });

    it('calcula la prima de antigüedad oficial de $30,000.00 (salario sin topar · LFT Art. 162 · §8)', () => {
      const result = calculateLiquidacion(referenceInput, FISCAL_CONSTANTS_2026);
      expect(amountOf(result.breakdown, 'Prima de antigüedad')).toBe(30000.0);
    });

    it('calcula el total de liquidación oficial de $125,000.00 (§8)', () => {
      const result = calculateLiquidacion(referenceInput, FISCAL_CONSTANTS_2026);
      expect(result.total).toBe(125000.0);
    });

    it('el total es exactamente la suma del desglose documentado (Req 7.1 · Property 3/7)', () => {
      const result = calculateLiquidacion(referenceInput, FISCAL_CONSTANTS_2026);
      const sum = result.breakdown.reduce((acc, item) => acc + item.amount, 0);
      expect(result.total).toBe(sum);
      expect(result.total).toBe(125000.0);
    });
  });

  describe('caso (b): salario $1,000.00, 3 años, con tope aplicado (1000 > 630.08)', () => {
    /** Insumo exacto del caso de referencia (b) de §8 (tope 2 × 315.04 = 630.08). */
    const cappedInput: LiquidacionInput = { dailySalary: 1000, yearsOfService: 3 };

    it('aplica el tope oficial de $630.08/día en la prima de antigüedad ⇒ $22,682.88 (LFT Art. 162, 485–486 · §8)', () => {
      const result = calculateLiquidacion(cappedInput, FISCAL_CONSTANTS_2026);
      // min(1000, 2 × 315.04) × 12 × 3 = 630.08 × 36 = 22 682.88.
      expect(amountOf(result.breakdown, 'Prima de antigüedad')).toBe(22682.88);
    });
  });
});
