/**
 * Prueba de ejemplo del aguinaldo contra la fuente oficial (tarea 14.3).
 *
 * A diferencia de las pruebas de propiedades (relaciones universales) y las
 * pruebas unitarias de 14.1, esta prueba fija los CASOS DE REFERENCIA
 * documentados en `docs/formulas.md` §6 (LFT Art. 87) y verifica los IMPORTES
 * EXACTOS del desglose y el total usando las constantes verificadas en Fase 0
 * (`FISCAL_CONSTANTS_2026`). Si la fórmula o alguna constante se desvía del
 * valor oficial documentado, los asertos fallan.
 *
 * Casos de referencia (docs/formulas.md §6):
 *   salario diario $400.00:
 *     - Año completo (365 días): 400 × 15             = $6,000.00
 *     - Medio año (182 días):    400 × 15 × (182/365) = $2,991.78 (2 decimales)
 *
 * _Requirements: 5.2, 7.2_
 */

import { FISCAL_CONSTANTS_2026 } from '../constants/fiscal-constants.2026';
import { calculateAguinaldo, type AguinaldoInput } from './aguinaldo.calculation';

describe('calculateAguinaldo — caso de referencia oficial (docs/formulas.md §6)', () => {
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

  describe('año completo — salario diario $400.00 (LFT Art. 87 · §6)', () => {
    const fullYearInput: AguinaldoInput = { dailySalary: 400, daysWorked: 365 };

    it('calcula el aguinaldo oficial de $6,000.00 (400 × 15)', () => {
      const result = calculateAguinaldo(fullYearInput, FISCAL_CONSTANTS_2026);
      expect(amountOf(result.breakdown, 'Aguinaldo')).toBe(6000.0);
    });

    it('el total coincide con el valor oficial documentado de $6,000.00', () => {
      const result = calculateAguinaldo(fullYearInput, FISCAL_CONSTANTS_2026);
      expect(result.total).toBe(6000.0);
    });
  });

  describe('medio año — salario diario $400.00, 182 días (§6)', () => {
    const halfYearInput: AguinaldoInput = { dailySalary: 400, daysWorked: 182 };

    it('calcula el aguinaldo proporcional oficial de $2,991.78 (400 × 15 × 182/365)', () => {
      const result = calculateAguinaldo(halfYearInput, FISCAL_CONSTANTS_2026);
      expect(amountOf(result.breakdown, 'Aguinaldo')).toBe(2991.78);
    });

    it('el total coincide con el valor oficial documentado de $2,991.78', () => {
      const result = calculateAguinaldo(halfYearInput, FISCAL_CONSTANTS_2026);
      expect(result.total).toBe(2991.78);
    });
  });

  it('el total es exactamente la suma del desglose documentado (Req 7.2 · Property 3/8)', () => {
    const input: AguinaldoInput = { dailySalary: 400, daysWorked: 182 };
    const result = calculateAguinaldo(input, FISCAL_CONSTANTS_2026);
    const sum = result.breakdown.reduce((acc, item) => acc + item.amount, 0);
    expect(result.total).toBe(sum);
    expect(result.total).toBe(2991.78);
  });
});
