/**
 * Prueba de ejemplo de la PTU contra la fuente oficial (tarea 21.3).
 *
 * A diferencia de la prueba de propiedades (relación universal de conservación,
 * Property 14) y de las pruebas unitarias generales (tarea 21.1), esta prueba
 * fija el CASO DE REFERENCIA documentado en `docs/formulas.md` §9
 * (LFT Art. 117–131, reforma 2021) y verifica los IMPORTES EXACTOS del desglose
 * y el total. Si la fórmula de reparto en dos mitades, el tope individual de
 * 3 meses de salario o la convención de redondeo del proyecto se desvían del
 * valor oficial documentado, los asertos fallan.
 *
 * Caso de referencia (docs/formulas.md §9):
 *   monto a repartir $120,000.00, un solo trabajador con 365 de 365 días y
 *   salario que representa el 100 % de la base, salario mensual $10,000.00:
 *     - Mitad A (días trabajados)      = 60 000 × (365/365)       = $60,000.00
 *     - Mitad B (salarios devengados)  = 60 000 × (120 000/120 000) = $60,000.00
 *     - Reparto bruto                  = 60 000 + 60 000          = $120,000.00
 *     - Tope individual (3 meses)      = 3 × 10 000               = $30,000.00
 *     - PTU final del trabajador       = min(120 000, 30 000)     = $30,000.00
 *
 * _Requirements: 5.2, 8.5_
 */

import { FISCAL_CONSTANTS_2026 } from '../constants/fiscal-constants.2026';
import { calculatePtu, type PtuInput } from './ptu.calculation';

describe('calculatePtu — caso de referencia oficial (docs/formulas.md §9)', () => {
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

  /**
   * Insumo exacto del caso de referencia de §9: un solo trabajador que
   * concentra el 100 % de los días y de los salarios del reparto; salario
   * mensual $10,000.00 (tope por 3 meses = $30,000.00).
   */
  const referenceInput: PtuInput = {
    amountToDistribute: 120000,
    daysWorked: 365,
    totalDaysWorked: 365,
    salaryEarned: 120000,
    totalSalaries: 120000,
    monthlySalary: 10000,
    triennialAverage: 0,
  };

  it('reparte la Mitad A oficial de $60,000.00 por días trabajados (365/365 · §9)', () => {
    const result = calculatePtu(referenceInput, FISCAL_CONSTANTS_2026);
    expect(amountOf(result.breakdown, 'Mitad por días trabajados')).toBe(60000.0);
  });

  it('reparte la Mitad B oficial de $60,000.00 por salarios devengados (100 % de la base · §9)', () => {
    const result = calculatePtu(referenceInput, FISCAL_CONSTANTS_2026);
    expect(amountOf(result.breakdown, 'Mitad por salarios devengados')).toBe(60000.0);
  });

  it('aplica el tope individual oficial de 3 meses ($30,000.00) como ajuste de −$90,000.00 (reforma 2021 · §9)', () => {
    const result = calculatePtu(referenceInput, FISCAL_CONSTANTS_2026);
    // Reparto bruto 120 000 recortado al tope 30 000 ⇒ ajuste de −90 000.
    expect(amountOf(result.breakdown, 'Ajuste por tope individual')).toBe(-90000.0);
  });

  it('calcula la PTU final oficial del trabajador de $30,000.00 (§9)', () => {
    const result = calculatePtu(referenceInput, FISCAL_CONSTANTS_2026);
    expect(result.total).toBe(30000.0);
  });

  it('el total es exactamente la suma del desglose documentado (Req 8.5 · Property 3/14)', () => {
    const result = calculatePtu(referenceInput, FISCAL_CONSTANTS_2026);
    const sum = result.breakdown.reduce((acc, item) => acc + item.amount, 0);
    expect(result.total).toBe(sum);
    expect(result.total).toBe(30000.0);
  });
});
