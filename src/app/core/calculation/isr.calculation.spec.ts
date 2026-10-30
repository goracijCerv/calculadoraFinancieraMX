/**
 * Pruebas unitarias de `calculateIsr` y sus helpers (función pura, tarea 18.1).
 *
 * Verifican los casos de referencia de `docs/formulas.md` §3 en las fronteras
 * de los tramos de la tarifa mensual del SAT (Art. 96 LISR), la aplicación del
 * subsidio al empleo bajo el tope, el acotamiento no negativo (Property 11) y
 * los casos límite de validación (Req 5.6) más la constante faltante (Req 5.7).
 * Las relaciones universales (Property 11) y la prueba de ejemplo oficial
 * completa viven en las tareas 18.2 y 18.3.
 */

import { FISCAL_CONSTANTS_2026 } from '../constants/fiscal-constants.2026';
import type { FiscalConstants } from '../constants/fiscal-constants.types';
import { CalculationError } from './calculation.types';
import {
  EMPLOYMENT_SUBSIDY_INCOME_CAP,
  EMPLOYMENT_SUBSIDY_MONTHLY,
  calculateIsr,
  calculateIsrTariff,
  findIsrBracket,
  type IsrInput,
} from './isr.calculation';

describe('calculateIsr', () => {
  const amountOf = (
    breakdown: readonly { concept: string; amount: number }[],
    concept: string,
  ): number => {
    const item = breakdown.find((row) => row.concept === concept);
    expect(item).toBeDefined();
    return item!.amount;
  };

  describe('helper findIsrBracket', () => {
    it('devuelve el tramo con el mayor límite inferior que no excede al ingreso', () => {
      const table = FISCAL_CONSTANTS_2026.isrMonthlyTable;
      // 30 000 cae en el tramo 6 (límite inferior 17 533.65).
      const bracket = findIsrBracket(table, 30000);
      expect(bracket?.lowerLimit).toBe(17533.65);
      expect(bracket?.fixedFee).toBe(1856.84);
      expect(bracket?.rateOnExcess).toBe(21.36);
    });

    it('devuelve undefined si ningún tramo aplica (ingreso < primer límite)', () => {
      const table = FISCAL_CONSTANTS_2026.isrMonthlyTable;
      expect(findIsrBracket(table, 0)).toBeUndefined();
    });
  });

  describe('casos de referencia en fronteras de tramo (docs/formulas.md §3)', () => {
    it('ingreso 844.59 (tope del tramo 1) ⇒ ISR de tarifa $16.22', () => {
      // 0.00 + (844.59 − 0.01) × 1.92% = 16.2160… ⇒ 16.22.
      expect(calculateIsrTariff(FISCAL_CONSTANTS_2026.isrMonthlyTable, 844.59)).toBe(16.22);
    });

    it('ingreso 12,598.02 (tope del tramo 3) ⇒ ISR de tarifa $1,011.68', () => {
      // 420.95 + (12 598.02 − 7 168.52) × 10.88% = 1 011.68.
      expect(calculateIsrTariff(FISCAL_CONSTANTS_2026.isrMonthlyTable, 12598.02)).toBe(1011.68);
    });

    it('ingreso 30,000.00 (tramo 6) ⇒ ISR $4,519.65 (rebasa el tope de subsidio)', () => {
      const input: IsrInput = { monthlyIncome: 30000 };
      const result = calculateIsr(input, FISCAL_CONSTANTS_2026);
      // 1 856.84 + (30 000 − 17 533.65) × 21.36% = 4 519.65.
      expect(amountOf(result.breakdown, 'ISR de tarifa')).toBe(4519.65);
      expect(result.total).toBe(4519.65);
      // Sin subsidio: 30 000 > tope de 11 492.66.
      expect(result.breakdown.find((row) => row.concept === 'Subsidio al empleo')).toBeUndefined();
    });
  });

  describe('subsidio al empleo (docs/formulas.md §3)', () => {
    it('aplica el subsidio fijo cuando el ingreso no rebasa el tope', () => {
      const income = 10000; // ≤ 11 492.66
      const input: IsrInput = { monthlyIncome: income };
      const result = calculateIsr(input, FISCAL_CONSTANTS_2026);
      const tariff = calculateIsrTariff(FISCAL_CONSTANTS_2026.isrMonthlyTable, income);
      expect(amountOf(result.breakdown, 'ISR de tarifa')).toBe(tariff);
      expect(amountOf(result.breakdown, 'Subsidio al empleo')).toBe(-EMPLOYMENT_SUBSIDY_MONTHLY);
      expect(result.total).toBe(tariff - EMPLOYMENT_SUBSIDY_MONTHLY);
    });

    it('en el tope exacto de ingreso aplica el subsidio (límite válido)', () => {
      const input: IsrInput = { monthlyIncome: EMPLOYMENT_SUBSIDY_INCOME_CAP };
      const result = calculateIsr(input, FISCAL_CONSTANTS_2026);
      expect(result.breakdown.find((row) => row.concept === 'Subsidio al empleo')).toBeDefined();
    });

    it('acota el subsidio para que el ISR neto no sea negativo (Property 11)', () => {
      // Ingreso muy bajo: el ISR de tarifa es menor que el subsidio fijo, así
      // que el subsidio se acota al ISR de tarifa y el total queda en 0.
      const input: IsrInput = { monthlyIncome: 1000 };
      const result = calculateIsr(input, FISCAL_CONSTANTS_2026);
      expect(result.total).toBe(0);
      expect(result.total).toBeGreaterThanOrEqual(0);
    });
  });

  describe('estructura del resultado', () => {
    it('el total es exactamente la suma del desglose', () => {
      const input: IsrInput = { monthlyIncome: 20000 };
      const result = calculateIsr(input, FISCAL_CONSTANTS_2026);
      const sum = result.breakdown.reduce((acc, item) => acc + item.amount, 0);
      expect(result.total).toBe(sum);
    });

    it('ingreso 0 produce ISR de $0.00', () => {
      const input: IsrInput = { monthlyIncome: 0 };
      const result = calculateIsr(input, FISCAL_CONSTANTS_2026);
      expect(result.total).toBe(0);
    });

    it('no muta la entrada (pureza, Req 5.5)', () => {
      const input: IsrInput = { monthlyIncome: 25000 };
      const snapshot = { ...input };
      calculateIsr(input, FISCAL_CONSTANTS_2026);
      expect(input).toEqual(snapshot);
    });
  });

  describe('validación de entradas (Req 5.6)', () => {
    it('rechaza ingreso negativo', () => {
      const input: IsrInput = { monthlyIncome: -1 };
      try {
        calculateIsr(input, FISCAL_CONSTANTS_2026);
        throw new Error('se esperaba una CalculationError');
      } catch (error) {
        expect(error).toBeInstanceOf(CalculationError);
        expect((error as CalculationError).code).toBe('INVALID_INPUT');
        expect((error as CalculationError).field).toBe('monthlyIncome');
      }
    });

    it('rechaza ingreso no numérico', () => {
      const input = { monthlyIncome: Number.NaN } as IsrInput;
      expect(() => calculateIsr(input, FISCAL_CONSTANTS_2026)).toThrow(CalculationError);
    });

    it('rechaza ingreso no finito', () => {
      const input = { monthlyIncome: Number.POSITIVE_INFINITY } as IsrInput;
      expect(() => calculateIsr(input, FISCAL_CONSTANTS_2026)).toThrow(CalculationError);
    });

    it('acepta exactamente 0 (límite válido)', () => {
      const input: IsrInput = { monthlyIncome: 0 };
      expect(() => calculateIsr(input, FISCAL_CONSTANTS_2026)).not.toThrow();
    });
  });

  describe('constante faltante (Req 5.7)', () => {
    it('lanza MISSING_CONSTANT si la tabla ISR está vacía', () => {
      const broken = {
        ...FISCAL_CONSTANTS_2026,
        isrMonthlyTable: [],
      } as FiscalConstants;
      const input: IsrInput = { monthlyIncome: 20000 };
      try {
        calculateIsr(input, broken);
        throw new Error('se esperaba una CalculationError');
      } catch (error) {
        expect(error).toBeInstanceOf(CalculationError);
        expect((error as CalculationError).code).toBe('MISSING_CONSTANT');
        expect((error as CalculationError).field).toBe('isrMonthlyTable');
      }
    });

    it('lanza MISSING_CONSTANT si la tabla ISR falta', () => {
      const broken = {
        ...FISCAL_CONSTANTS_2026,
        isrMonthlyTable: undefined,
      } as unknown as FiscalConstants;
      const input: IsrInput = { monthlyIncome: 20000 };
      expect(() => calculateIsr(input, broken)).toThrow(CalculationError);
    });
  });
});
