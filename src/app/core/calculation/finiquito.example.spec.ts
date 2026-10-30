/**
 * Prueba de ejemplo del finiquito contra la fuente oficial (tarea 11.3).
 *
 * A diferencia de las pruebas de propiedades (relaciones universales), esta
 * prueba fija el CASO DE REFERENCIA documentado en `docs/formulas.md` §7 (con
 * sus insumos de §5 y §6) y verifica los IMPORTES EXACTOS del desglose y el
 * total. Si la fórmula o alguna constante se desvía del valor oficial
 * documentado, los asertos fallan.
 *
 * Caso de referencia (docs/formulas.md §7):
 *   salario diario $500.00, inicio 2025-01-01, fin 2026-12-31 (1 año
 *   cumplido, 2.º año de servicio en curso ⇒ 14 días de vacaciones), días pendientes 0,
 *   aguinaldo proporcional incluido:
 *     - Aguinaldo proporcional = 500 × 15 × (365/365) = $7,500.00  (§6)
 *     - Vacaciones (14 días)   = 500 × 14 × 364/365  = $6,980.82  (§5)
 *     - Prima vacacional       = 6,980.82 × 0.25     = $1,745.21  (§5)
 *     - Días pendientes        = 500 × 0             = $0.00      (§7)
 *     - TOTAL                  =                       $16,226.03 (§7)
 *
 * _Requirements: 5.2, 6.1_
 */

import { FISCAL_CONSTANTS_2026 } from '../constants/fiscal-constants.2026';
import { calculateFiniquito, type FiniquitoInput } from './finiquito.calculation';
import { roundMoney } from './rounding';

describe('calculateFiniquito — caso de referencia oficial (docs/formulas.md §7)', () => {
  /**
   * Insumo exacto del caso de referencia de §7. La función es pura, así que las
   * fechas se pasan como cadenas ISO (sin leer el reloj del sistema).
   */
  const referenceInput: FiniquitoInput = {
    dailySalaryOrMonthly: 500,
    startDate: '2025-01-01',
    endDate: '2026-12-31',
    pendingVacationDays: 0,
    aguinaldoProportional: true,
  };

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

  it('calcula el aguinaldo proporcional oficial de $7,500.00 (LFT Art. 87 · §6)', () => {
    const result = calculateFiniquito(referenceInput, FISCAL_CONSTANTS_2026);
    expect(amountOf(result.breakdown, 'Aguinaldo proporcional')).toBe(7500.0);
  });

  it('calcula las vacaciones proporcionales oficiales de $6,000.00 (14 días del 2.º año de servicio × 364/365 · LFT Art. 76 · §5)', () => {
    const result = calculateFiniquito(referenceInput, FISCAL_CONSTANTS_2026);
    expect(amountOf(result.breakdown, 'Vacaciones proporcionales')).toBe(6980.82);
  });

  it('calcula la prima vacacional oficial de $1,500.00 (25 % · LFT Art. 80 · §5)', () => {
    const result = calculateFiniquito(referenceInput, FISCAL_CONSTANTS_2026);
    expect(amountOf(result.breakdown, 'Prima vacacional')).toBe(1745.21);
  });

  it('calcula los días pendientes oficiales de $0.00 (salario al día · §7)', () => {
    const result = calculateFiniquito(referenceInput, FISCAL_CONSTANTS_2026);
    expect(amountOf(result.breakdown, 'Días pendientes')).toBe(0);
  });

  it('calcula el total de finiquito oficial de $16,226.03 (§7)', () => {
    const result = calculateFiniquito(referenceInput, FISCAL_CONSTANTS_2026);
    expect(result.total).toBe(16226.03);
  });

  it('el total es exactamente la suma del desglose documentado (Req 6.1 · Property 3/6)', () => {
    const result = calculateFiniquito(referenceInput, FISCAL_CONSTANTS_2026);
    const sum = result.breakdown.reduce((acc, item) => acc + item.amount, 0);
    // La suma de flotantes puede arrastrar ruido (16226.029999…); el total va redondeado a centavos.
    expect(result.total).toBe(roundMoney(sum));
    expect(result.total).toBe(16226.03);
  });

  it('con menos de un año prorratea el primer año de servicio: 12 días (LFT Art. 76 · §7)', () => {
    // 2026-02-01 → 2026-10-15: 256 días del primer año de servicio.
    const result = calculateFiniquito(
      { ...referenceInput, startDate: '2026-02-01', endDate: '2026-10-15' },
      FISCAL_CONSTANTS_2026,
    );
    // 500 × 12 × 256/365 = 4,208.22 ; prima 25 % = 1,052.06
    expect(amountOf(result.breakdown, 'Vacaciones proporcionales')).toBe(4208.22);
    expect(amountOf(result.breakdown, 'Prima vacacional')).toBe(1052.06);
  });

  it('a mitad del 3.er año de servicio usa los 16 días de ese año (LFT Art. 76 · §7)', () => {
    // 2024-01-15 → 2026-10-15: 2 años cumplidos, 273 días del 3.er año de servicio.
    const result = calculateFiniquito(
      { ...referenceInput, startDate: '2024-01-15', endDate: '2026-10-15' },
      FISCAL_CONSTANTS_2026,
    );
    // 500 × 16 × 273/365 = 5,983.56 ; prima 25 % = 1,495.89
    expect(amountOf(result.breakdown, 'Vacaciones proporcionales')).toBe(5983.56);
    expect(amountOf(result.breakdown, 'Prima vacacional')).toBe(1495.89);
  });

  it('al terminar exactamente en un aniversario cierra el año con sus días completos (§7)', () => {
    // 2025-01-01 → 2026-01-01: se cierra el 1.er año de servicio (12 días × 365/365).
    const result = calculateFiniquito(
      { ...referenceInput, endDate: '2026-01-01' },
      FISCAL_CONSTANTS_2026,
    );
    expect(amountOf(result.breakdown, 'Vacaciones proporcionales')).toBe(6000);
    expect(amountOf(result.breakdown, 'Prima vacacional')).toBe(1500);
  });
});
