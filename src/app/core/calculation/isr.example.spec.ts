/**
 * Prueba de ejemplo del ISR mensual contra la fuente oficial (tarea 18.3).
 *
 * A diferencia de la prueba de propiedad (relaciones universales, tarea 18.2) y
 * de las pruebas unitarias/helpers de 18.1 (`isr.calculation.spec.ts`), esta
 * prueba fija los CASOS DE REFERENCIA documentados en `docs/formulas.md` §3
 * (tarifa mensual del SAT, Art. 96 LISR, Anexo 8 RMF · DOF 28-dic-2025) en las
 * FRONTERAS de los tramos de la tabla, y verifica los IMPORTES EXACTOS usando
 * las constantes verificadas en Fase 0 (`FISCAL_CONSTANTS_2026`). Si la tabla
 * del `Constants_Module` o la fórmula de tarifa se desvían del valor oficial
 * documentado, los asertos fallan.
 *
 * Casos de referencia en los límites de tramo (docs/formulas.md §3):
 *   - Ingreso $844.59 (tope del tramo 1):
 *       0.00 + (844.59 − 0.01) × 1.92% = 16.2160… ⇒ $16.22
 *       (coincide con la cuota fija del tramo 2 — continuidad).
 *   - Ingreso $12,598.02 (tope del tramo 3):
 *       420.95 + (12,598.02 − 7,168.52) × 10.88% = $1,011.68
 *       (coincide con la cuota fija del tramo 4 — continuidad).
 *   - Ingreso $30,000.00 (dentro del tramo 6):
 *       1,856.84 + (30,000.00 − 17,533.65) × 21.36% = $4,519.65.
 *
 * _Requirements: 5.2, 8.1_
 */

import { FISCAL_CONSTANTS_2026 } from '../constants/fiscal-constants.2026';
import {
  EMPLOYMENT_SUBSIDY_INCOME_CAP,
  calculateIsr,
  calculateIsrTariff,
  type IsrInput,
} from './isr.calculation';

describe('calculateIsr — casos de referencia oficiales en fronteras de tramo (docs/formulas.md §3)', () => {
  const table = FISCAL_CONSTANTS_2026.isrMonthlyTable;

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

  describe('tope del tramo 1 — ingreso $844.59 (§3)', () => {
    it('ISR de tarifa = $16.22 (0.00 + (844.59 − 0.01) × 1.92%)', () => {
      expect(calculateIsrTariff(table, 844.59)).toBe(16.22);
    });

    it('coincide con la cuota fija del tramo 2 (continuidad de la tabla SAT)', () => {
      const bracket2 = table.find((row) => row.lowerLimit === 844.6);
      // El tramo 2 (844.60 → 7,168.51) debe existir en el Constants_Module.
      expect(bracket2).toBeDefined();
      expect(bracket2!.fixedFee).toBe(16.22);
      expect(calculateIsrTariff(table, 844.59)).toBe(bracket2!.fixedFee);
    });
  });

  describe('tope del tramo 3 — ingreso $12,598.02 (§3)', () => {
    it('ISR de tarifa = $1,011.68 (420.95 + (12,598.02 − 7,168.52) × 10.88%)', () => {
      expect(calculateIsrTariff(table, 12598.02)).toBe(1011.68);
    });

    it('coincide con la cuota fija del tramo 4 (continuidad de la tabla SAT)', () => {
      const bracket4 = table.find((row) => row.lowerLimit === 12598.03);
      // El tramo 4 (12,598.03 → 14,644.64) debe existir en el Constants_Module.
      expect(bracket4).toBeDefined();
      expect(bracket4!.fixedFee).toBe(1011.68);
      expect(calculateIsrTariff(table, 12598.02)).toBe(bracket4!.fixedFee);
    });
  });

  describe('dentro del tramo 6 — ingreso $30,000.00 (§3)', () => {
    const input: IsrInput = { monthlyIncome: 30000 };

    it('ISR de tarifa = $4,519.65 (1,856.84 + (30,000 − 17,533.65) × 21.36%)', () => {
      expect(calculateIsrTariff(table, 30000)).toBe(4519.65);
    });

    it('el ISR neto a retener coincide con el valor oficial de $4,519.65', () => {
      const result = calculateIsr(input, FISCAL_CONSTANTS_2026);
      expect(amountOf(result.breakdown, 'ISR de tarifa')).toBe(4519.65);
      expect(result.total).toBe(4519.65);
    });

    it('no aplica subsidio: $30,000 rebasa el tope de $11,492.66 (§3)', () => {
      // El ingreso supera el tope de subsidio al empleo documentado.
      expect(input.monthlyIncome).toBeGreaterThan(EMPLOYMENT_SUBSIDY_INCOME_CAP);
      const result = calculateIsr(input, FISCAL_CONSTANTS_2026);
      expect(
        result.breakdown.find((row) => row.concept === 'Subsidio al empleo'),
      ).toBeUndefined();
    });

    it('el total es exactamente la suma del desglose documentado (Property 3)', () => {
      const result = calculateIsr(input, FISCAL_CONSTANTS_2026);
      const sum = result.breakdown.reduce((acc, item) => acc + item.amount, 0);
      expect(result.total).toBe(sum);
      expect(result.total).toBe(4519.65);
    });
  });
});
