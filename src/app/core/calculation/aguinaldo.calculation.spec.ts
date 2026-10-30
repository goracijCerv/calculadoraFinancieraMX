/**
 * Pruebas unitarias de `calculateAguinaldo` (función pura, tarea 14.1).
 *
 * Verifican ejemplos concretos del caso de referencia de `docs/formulas.md` §6
 * (LFT Art. 87) y los casos límite de validación (Req 5.6): salario menor al
 * mínimo, días fuera del rango 0..365, datos no numéricos/no enteros y la
 * constante faltante (Req 5.7). Las relaciones universales (Property 8) y la
 * prueba de ejemplo oficial completa viven en las tareas 14.2 y 14.3.
 */

import { FISCAL_CONSTANTS_2026 } from '../constants/fiscal-constants.2026';
import type { FiscalConstants } from '../constants/fiscal-constants.types';
import { calculateAguinaldo, type AguinaldoInput } from './aguinaldo.calculation';
import { CalculationError } from './calculation.types';

describe('calculateAguinaldo', () => {
  const amountOf = (
    breakdown: readonly { concept: string; amount: number }[],
    concept: string,
  ): number => {
    const item = breakdown.find((row) => row.concept === concept);
    expect(item).toBeDefined();
    return item!.amount;
  };

  describe('casos de referencia (docs/formulas.md §6)', () => {
    it('año completo: salario 400 × 15 días = $6,000.00 (LFT Art. 87)', () => {
      const input: AguinaldoInput = { dailySalary: 400, daysWorked: 365 };
      const result = calculateAguinaldo(input, FISCAL_CONSTANTS_2026);
      expect(result.total).toBe(6000.0);
      expect(amountOf(result.breakdown, 'Aguinaldo')).toBe(6000.0);
    });

    it('medio año: 400 × 15 × (182/365) = $2,991.78', () => {
      const input: AguinaldoInput = { dailySalary: 400, daysWorked: 182 };
      const result = calculateAguinaldo(input, FISCAL_CONSTANTS_2026);
      expect(result.total).toBe(2991.78);
    });
  });

  describe('estructura del resultado', () => {
    it('el total es exactamente la suma del desglose', () => {
      const input: AguinaldoInput = { dailySalary: 500, daysWorked: 300 };
      const result = calculateAguinaldo(input, FISCAL_CONSTANTS_2026);
      const sum = result.breakdown.reduce((acc, item) => acc + item.amount, 0);
      expect(result.total).toBe(sum);
    });

    it('cero días trabajados produce aguinaldo de $0.00', () => {
      const input: AguinaldoInput = { dailySalary: 500, daysWorked: 0 };
      const result = calculateAguinaldo(input, FISCAL_CONSTANTS_2026);
      expect(result.total).toBe(0);
    });

    it('no muta la entrada (pureza, Req 5.5)', () => {
      const input: AguinaldoInput = { dailySalary: 500, daysWorked: 100 };
      const snapshot = { ...input };
      calculateAguinaldo(input, FISCAL_CONSTANTS_2026);
      expect(input).toEqual(snapshot);
    });
  });

  describe('validación de entradas (Req 5.6)', () => {
    it('rechaza salario menor al mínimo vigente', () => {
      const input: AguinaldoInput = {
        dailySalary: FISCAL_CONSTANTS_2026.minimumDailyWage - 1,
        daysWorked: 365,
      };
      expect(() => calculateAguinaldo(input, FISCAL_CONSTANTS_2026)).toThrow(CalculationError);
      try {
        calculateAguinaldo(input, FISCAL_CONSTANTS_2026);
      } catch (error) {
        expect(error).toBeInstanceOf(CalculationError);
        expect((error as CalculationError).code).toBe('INVALID_INPUT');
        expect((error as CalculationError).field).toBe('dailySalary');
      }
    });

    it('acepta exactamente el salario mínimo (límite válido)', () => {
      const input: AguinaldoInput = {
        dailySalary: FISCAL_CONSTANTS_2026.minimumDailyWage,
        daysWorked: 365,
      };
      expect(() => calculateAguinaldo(input, FISCAL_CONSTANTS_2026)).not.toThrow();
    });

    it('rechaza salario no numérico', () => {
      const input = { dailySalary: Number.NaN, daysWorked: 365 } as AguinaldoInput;
      expect(() => calculateAguinaldo(input, FISCAL_CONSTANTS_2026)).toThrow(CalculationError);
    });

    it('rechaza días trabajados negativos', () => {
      const input: AguinaldoInput = { dailySalary: 500, daysWorked: -1 };
      try {
        calculateAguinaldo(input, FISCAL_CONSTANTS_2026);
        throw new Error('se esperaba una CalculationError');
      } catch (error) {
        expect(error).toBeInstanceOf(CalculationError);
        expect((error as CalculationError).code).toBe('INVALID_INPUT');
        expect((error as CalculationError).field).toBe('daysWorked');
      }
    });

    it('rechaza días trabajados mayores a 365', () => {
      const input: AguinaldoInput = { dailySalary: 500, daysWorked: 366 };
      try {
        calculateAguinaldo(input, FISCAL_CONSTANTS_2026);
        throw new Error('se esperaba una CalculationError');
      } catch (error) {
        expect(error).toBeInstanceOf(CalculationError);
        expect((error as CalculationError).code).toBe('INVALID_INPUT');
        expect((error as CalculationError).field).toBe('daysWorked');
      }
    });

    it('rechaza días trabajados no enteros', () => {
      const input: AguinaldoInput = { dailySalary: 500, daysWorked: 100.5 };
      expect(() => calculateAguinaldo(input, FISCAL_CONSTANTS_2026)).toThrow(CalculationError);
    });
  });

  describe('constante faltante (Req 5.7)', () => {
    it('lanza MISSING_CONSTANT si falta el salario mínimo', () => {
      const broken = {
        ...FISCAL_CONSTANTS_2026,
        minimumDailyWage: undefined,
      } as unknown as FiscalConstants;
      const input: AguinaldoInput = { dailySalary: 500, daysWorked: 365 };
      try {
        calculateAguinaldo(input, broken);
        throw new Error('se esperaba una CalculationError');
      } catch (error) {
        expect(error).toBeInstanceOf(CalculationError);
        expect((error as CalculationError).code).toBe('MISSING_CONSTANT');
        expect((error as CalculationError).field).toBe('minimumDailyWage');
      }
    });
  });
});
