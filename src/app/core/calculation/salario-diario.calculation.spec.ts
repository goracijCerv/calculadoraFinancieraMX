/**
 * Pruebas unitarias de `calculateSalarioDiario` (función pura, tarea 20.1).
 *
 * Verifican ejemplos concretos de la conversión por periodicidad (convención
 * de días documentada: semanal /7, quincenal /15, mensual /30) y los casos
 * límite de validación (Req 5.6): monto ≤ 0, monto no numérico y periodicidad
 * desconocida. Las relaciones universales (Property 13) viven en la tarea 20.2.
 *
 * La función no consume `FiscalConstants`; se pasa `FISCAL_CONSTANTS_2026` para
 * respetar la firma `CalculationFn`, pero el resultado no depende de él.
 */

import { FISCAL_CONSTANTS_2026 } from '../constants/fiscal-constants.2026';
import { CalculationError } from './calculation.types';
import {
  calculateSalarioDiario,
  PERIOD_DIVISORS,
  type SalarioDiarioInput,
} from './salario-diario.calculation';

describe('calculateSalarioDiario', () => {
  const constants = FISCAL_CONSTANTS_2026;

  describe('conversión por periodicidad (convención de días documentada)', () => {
    it('mensual: 9000 / 30 = $300.00 diario', () => {
      const input: SalarioDiarioInput = { amount: 9000, period: 'monthly' };
      const result = calculateSalarioDiario(input, constants);
      expect(result.total).toBe(300.0);
      expect(result.breakdown[0].amount).toBe(300.0);
    });

    it('quincenal: 4500 / 15 = $300.00 diario', () => {
      const input: SalarioDiarioInput = { amount: 4500, period: 'biweekly' };
      const result = calculateSalarioDiario(input, constants);
      expect(result.total).toBe(300.0);
    });

    it('semanal: 2100 / 7 = $300.00 diario', () => {
      const input: SalarioDiarioInput = { amount: 2100, period: 'weekly' };
      const result = calculateSalarioDiario(input, constants);
      expect(result.total).toBe(300.0);
    });

    it('redondea a dos decimales: 1000 mensual / 30 = $33.33', () => {
      const input: SalarioDiarioInput = { amount: 1000, period: 'monthly' };
      const result = calculateSalarioDiario(input, constants);
      expect(result.total).toBe(33.33);
    });

    it('usa el divisor correcto por periodicidad', () => {
      expect(PERIOD_DIVISORS).toEqual({ weekly: 7, biweekly: 15, monthly: 30 });
    });
  });

  describe('estructura del resultado', () => {
    it('el total es exactamente la suma del desglose', () => {
      const input: SalarioDiarioInput = { amount: 12345, period: 'monthly' };
      const result = calculateSalarioDiario(input, constants);
      const sum = result.breakdown.reduce((acc, item) => acc + item.amount, 0);
      expect(result.total).toBe(sum);
    });

    it('el desglose contiene un único concepto de salario diario', () => {
      const input: SalarioDiarioInput = { amount: 6000, period: 'biweekly' };
      const result = calculateSalarioDiario(input, constants);
      expect(result.breakdown).toHaveLength(1);
      expect(result.breakdown[0].concept).toContain('Salario diario');
    });

    it('no muta la entrada (pureza, Req 5.5)', () => {
      const input: SalarioDiarioInput = { amount: 7500, period: 'monthly' };
      const snapshot = { ...input };
      calculateSalarioDiario(input, constants);
      expect(input).toEqual(snapshot);
    });

    it('es determinista: misma entrada ⇒ misma salida', () => {
      const input: SalarioDiarioInput = { amount: 8800, period: 'weekly' };
      const a = calculateSalarioDiario(input, constants);
      const b = calculateSalarioDiario(input, constants);
      expect(b).toEqual(a);
    });
  });

  describe('validación de entradas (Req 5.6)', () => {
    it('rechaza monto igual a cero', () => {
      const input: SalarioDiarioInput = { amount: 0, period: 'monthly' };
      try {
        calculateSalarioDiario(input, constants);
        throw new Error('se esperaba una CalculationError');
      } catch (error) {
        expect(error).toBeInstanceOf(CalculationError);
        expect((error as CalculationError).code).toBe('INVALID_INPUT');
        expect((error as CalculationError).field).toBe('amount');
      }
    });

    it('rechaza monto negativo', () => {
      const input: SalarioDiarioInput = { amount: -100, period: 'weekly' };
      try {
        calculateSalarioDiario(input, constants);
        throw new Error('se esperaba una CalculationError');
      } catch (error) {
        expect(error).toBeInstanceOf(CalculationError);
        expect((error as CalculationError).code).toBe('INVALID_INPUT');
        expect((error as CalculationError).field).toBe('amount');
      }
    });

    it('rechaza monto no numérico', () => {
      const input = { amount: Number.NaN, period: 'monthly' } as SalarioDiarioInput;
      expect(() => calculateSalarioDiario(input, constants)).toThrow(CalculationError);
    });

    it('rechaza periodicidad desconocida', () => {
      const input = { amount: 9000, period: 'daily' } as unknown as SalarioDiarioInput;
      try {
        calculateSalarioDiario(input, constants);
        throw new Error('se esperaba una CalculationError');
      } catch (error) {
        expect(error).toBeInstanceOf(CalculationError);
        expect((error as CalculationError).code).toBe('INVALID_INPUT');
        expect((error as CalculationError).field).toBe('period');
      }
    });

    it('valida la periodicidad antes que el monto', () => {
      const input = { amount: -1, period: 'daily' } as unknown as SalarioDiarioInput;
      try {
        calculateSalarioDiario(input, constants);
        throw new Error('se esperaba una CalculationError');
      } catch (error) {
        expect((error as CalculationError).field).toBe('period');
      }
    });
  });
});
