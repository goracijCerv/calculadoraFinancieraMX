/**
 * Pruebas unitarias de `calculateVacaciones` (tarea 15.1).
 *
 * Cubren ejemplos concretos y casos límite de la función pura: lectura de la
 * tabla de días de vacaciones por antigüedad (Art. 76 LFT · §4), el pago de
 * vacaciones y la prima vacacional del 25 % (Art. 80 LFT · §5), y el rechazo de
 * entradas inválidas (Req 5.6) y de constantes faltantes (Req 5.7).
 *
 * El property test de la relación universal (Property 9) y la prueba de ejemplo
 * contra la fuente oficial viven en sus propias tareas (15.2 y 15.3).
 *
 * _Requirements: 5.5, 5.6, 5.7, 7.3_
 */

import { FISCAL_CONSTANTS_2026 } from '../constants/fiscal-constants.2026';
import type { FiscalConstants } from '../constants/fiscal-constants.types';
import { CalculationError } from './calculation.types';
import { calculateVacaciones, type VacacionesInput } from './vacaciones.calculation';

/** Busca el importe de un concepto del desglose por su nombre. */
function amountOf(
  breakdown: readonly { concept: string; amount: number }[],
  concept: string,
): number {
  const item = breakdown.find((row) => row.concept === concept);
  expect(item).toBeDefined();
  return item!.amount;
}

/**
 * Invoca el cálculo esperando que lance un `CalculationError`, y devuelve el
 * error capturado para aseverar su `code` y su `field`. Falla el test si no se
 * lanza ningún error.
 */
function expectCalculationError(fn: () => unknown): CalculationError {
  let caught: unknown;
  expect(fn).toThrow(CalculationError);
  try {
    fn();
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeInstanceOf(CalculationError);
  return caught as CalculationError;
}

describe('calculateVacaciones — ejemplos y casos límite', () => {
  it('toma los días de la tabla (1 año ⇒ 12 días) y calcula pago y prima', () => {
    const input: VacacionesInput = { dailySalary: 500, yearsOfService: 1 };

    const result = calculateVacaciones(input, FISCAL_CONSTANTS_2026);

    // pagoVacaciones = 500 × 12 = 6 000; primaVacacional = 6 000 × 0.25 = 1 500.
    expect(amountOf(result.breakdown, 'Pago de vacaciones')).toBe(6000);
    expect(amountOf(result.breakdown, 'Prima vacacional')).toBe(1500);
  });

  it('el total es exactamente la suma del desglose', () => {
    const input: VacacionesInput = { dailySalary: 500, yearsOfService: 1 };

    const result = calculateVacaciones(input, FISCAL_CONSTANTS_2026);

    const sum = result.breakdown.reduce((acc, item) => acc + item.amount, 0);
    expect(result.total).toBe(sum);
    expect(result.total).toBe(7500);
  });

  it('la prima vacacional es exactamente el 25 % del pago de vacaciones (Property 9)', () => {
    const input: VacacionesInput = { dailySalary: 700, yearsOfService: 6 };

    const result = calculateVacaciones(input, FISCAL_CONSTANTS_2026);

    const pago = amountOf(result.breakdown, 'Pago de vacaciones');
    const prima = amountOf(result.breakdown, 'Prima vacacional');
    expect(prima).toBe(pago * 0.25);
  });

  it('usa la fila mayor que no excede la antigüedad (7 años ⇒ 22 días)', () => {
    const input: VacacionesInput = { dailySalary: 400, yearsOfService: 7 };

    const result = calculateVacaciones(input, FISCAL_CONSTANTS_2026);

    // 7 años cae en la fila de 6 años (22 días): 400 × 22 = 8 800.
    expect(amountOf(result.breakdown, 'Pago de vacaciones')).toBe(8800);
  });

  it('con antigüedad 0 no hay días de vacaciones (pago y prima en cero)', () => {
    const input: VacacionesInput = { dailySalary: 500, yearsOfService: 0 };

    const result = calculateVacaciones(input, FISCAL_CONSTANTS_2026);

    expect(amountOf(result.breakdown, 'Pago de vacaciones')).toBe(0);
    expect(amountOf(result.breakdown, 'Prima vacacional')).toBe(0);
    expect(result.total).toBe(0);
  });

  it('redondea cada importe a 2 decimales', () => {
    // 315.04 × 12 = 3 780.48; prima = 945.12.
    const input: VacacionesInput = { dailySalary: 315.04, yearsOfService: 1 };

    const result = calculateVacaciones(input, FISCAL_CONSTANTS_2026);

    expect(amountOf(result.breakdown, 'Pago de vacaciones')).toBe(3780.48);
    expect(amountOf(result.breakdown, 'Prima vacacional')).toBe(945.12);
  });

  it('no muta la entrada (pureza, Req 5.5)', () => {
    const input: VacacionesInput = { dailySalary: 500, yearsOfService: 3 };
    const snapshot: VacacionesInput = { ...input };

    calculateVacaciones(input, FISCAL_CONSTANTS_2026);

    expect(input).toEqual(snapshot);
  });

  describe('rechazo de entradas inválidas (Req 5.6)', () => {
    it('rechaza salario menor al mínimo vigente', () => {
      const input: VacacionesInput = { dailySalary: 300, yearsOfService: 1 };

      const error = expectCalculationError(() => calculateVacaciones(input, FISCAL_CONSTANTS_2026));
      expect(error.code).toBe('INVALID_INPUT');
      expect(error.field).toBe('dailySalary');
    });

    it('rechaza salario no numérico', () => {
      const input = { dailySalary: Number.NaN, yearsOfService: 1 } as VacacionesInput;

      const error = expectCalculationError(() => calculateVacaciones(input, FISCAL_CONSTANTS_2026));
      expect(error.code).toBe('INVALID_INPUT');
      expect(error.field).toBe('dailySalary');
    });

    it('rechaza antigüedad negativa', () => {
      const input: VacacionesInput = { dailySalary: 500, yearsOfService: -1 };

      const error = expectCalculationError(() => calculateVacaciones(input, FISCAL_CONSTANTS_2026));
      expect(error.code).toBe('INVALID_INPUT');
      expect(error.field).toBe('yearsOfService');
    });

    it('rechaza antigüedad no entera', () => {
      const input: VacacionesInput = { dailySalary: 500, yearsOfService: 1.5 };

      const error = expectCalculationError(() => calculateVacaciones(input, FISCAL_CONSTANTS_2026));
      expect(error.code).toBe('INVALID_INPUT');
      expect(error.field).toBe('yearsOfService');
    });
  });

  describe('rechazo por constante faltante (Req 5.7)', () => {
    it('rechaza si falta el salario mínimo', () => {
      const constants = {
        ...FISCAL_CONSTANTS_2026,
        minimumDailyWage: Number.NaN,
      } as FiscalConstants;
      const input: VacacionesInput = { dailySalary: 500, yearsOfService: 1 };

      const error = expectCalculationError(() => calculateVacaciones(input, constants));
      expect(error.code).toBe('MISSING_CONSTANT');
      expect(error.field).toBe('minimumDailyWage');
    });

    it('rechaza si falta la tabla de días de vacaciones', () => {
      const constants = {
        ...FISCAL_CONSTANTS_2026,
        vacationDaysTable: [],
      } as FiscalConstants;
      const input: VacacionesInput = { dailySalary: 500, yearsOfService: 1 };

      const error = expectCalculationError(() => calculateVacaciones(input, constants));
      expect(error.code).toBe('MISSING_CONSTANT');
      expect(error.field).toBe('vacationDaysTable');
    });
  });
});
