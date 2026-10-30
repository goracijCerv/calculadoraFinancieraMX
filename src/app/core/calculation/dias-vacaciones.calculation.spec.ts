/**
 * Pruebas unitarias de `calculateDiasVacaciones` (tarea 16.1).
 *
 * Cubren ejemplos concretos y casos límite de la función pura: lectura de la
 * tabla de días de vacaciones por antigüedad (Art. 76 LFT · §4), incluidos los
 * casos de referencia de `docs/formulas.md` §4 (1→12, 5→20, 6→22, 11→24), la
 * monotonía no decreciente respecto a la antigüedad (Property 10) y el rechazo
 * de entradas inválidas (Req 5.6) y de constantes faltantes (Req 5.7).
 *
 * _Requirements: 5.5, 5.6, 7.4, 7.5_
 */

import { FISCAL_CONSTANTS_2026 } from '../constants/fiscal-constants.2026';
import type { FiscalConstants } from '../constants/fiscal-constants.types';
import { CalculationError } from './calculation.types';
import {
  calculateDiasVacaciones,
  type DiasVacacionesInput,
} from './dias-vacaciones.calculation';

/** Busca el importe (aquí, días) de un concepto del desglose por su nombre. */
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

describe('calculateDiasVacaciones — ejemplos y casos límite', () => {
  it('representa los días como total y único concepto del desglose', () => {
    const input: DiasVacacionesInput = { yearsOfService: 1 };

    const result = calculateDiasVacaciones(input, FISCAL_CONSTANTS_2026);

    expect(result.breakdown).toHaveLength(1);
    expect(result.total).toBe(12);
    expect(amountOf(result.breakdown, 'Días de vacaciones')).toBe(12);
  });

  // Casos de referencia de `docs/formulas.md` §4.
  it.each([
    [1, 12],
    [5, 20],
    [6, 22],
    [11, 24],
  ])('antigüedad %i año(s) ⇒ %i días (tabla Art. 76)', (years, expectedDays) => {
    const result = calculateDiasVacaciones({ yearsOfService: years }, FISCAL_CONSTANTS_2026);

    expect(result.total).toBe(expectedDays);
    expect(amountOf(result.breakdown, 'Días de vacaciones')).toBe(expectedDays);
  });

  it('usa la fila mayor que no excede la antigüedad (7 años ⇒ 22 días)', () => {
    const result = calculateDiasVacaciones({ yearsOfService: 7 }, FISCAL_CONSTANTS_2026);

    // 7 años cae en la fila de 6 años (22 días).
    expect(result.total).toBe(22);
  });

  it('con antigüedad 0 no hay días de vacaciones', () => {
    const result = calculateDiasVacaciones({ yearsOfService: 0 }, FISCAL_CONSTANTS_2026);

    expect(result.total).toBe(0);
    expect(amountOf(result.breakdown, 'Días de vacaciones')).toBe(0);
  });

  it('es monótona no decreciente respecto a la antigüedad (Property 10)', () => {
    let previous = -1;
    for (let years = 0; years <= 40; years++) {
      const result = calculateDiasVacaciones({ yearsOfService: years }, FISCAL_CONSTANTS_2026);
      expect(result.total).toBeGreaterThanOrEqual(previous);
      previous = result.total;
    }
  });

  it('devuelve días enteros', () => {
    const result = calculateDiasVacaciones({ yearsOfService: 3 }, FISCAL_CONSTANTS_2026);

    expect(Number.isInteger(result.total)).toBe(true);
    expect(Number.isInteger(amountOf(result.breakdown, 'Días de vacaciones'))).toBe(true);
  });

  it('no muta la entrada (pureza, Req 5.5)', () => {
    const input: DiasVacacionesInput = { yearsOfService: 3 };
    const snapshot: DiasVacacionesInput = { ...input };

    calculateDiasVacaciones(input, FISCAL_CONSTANTS_2026);

    expect(input).toEqual(snapshot);
  });

  describe('rechazo de entradas inválidas (Req 5.6)', () => {
    it('rechaza antigüedad negativa', () => {
      const error = expectCalculationError(() =>
        calculateDiasVacaciones({ yearsOfService: -1 }, FISCAL_CONSTANTS_2026),
      );
      expect(error.code).toBe('INVALID_INPUT');
      expect(error.field).toBe('yearsOfService');
    });

    it('rechaza antigüedad no entera', () => {
      const error = expectCalculationError(() =>
        calculateDiasVacaciones({ yearsOfService: 1.5 }, FISCAL_CONSTANTS_2026),
      );
      expect(error.code).toBe('INVALID_INPUT');
      expect(error.field).toBe('yearsOfService');
    });

    it('rechaza antigüedad no numérica', () => {
      const input = { yearsOfService: Number.NaN } as DiasVacacionesInput;

      const error = expectCalculationError(() =>
        calculateDiasVacaciones(input, FISCAL_CONSTANTS_2026),
      );
      expect(error.code).toBe('INVALID_INPUT');
      expect(error.field).toBe('yearsOfService');
    });
  });

  describe('rechazo por constante faltante (Req 5.7)', () => {
    it('rechaza si falta la tabla de días de vacaciones', () => {
      const constants = {
        ...FISCAL_CONSTANTS_2026,
        vacationDaysTable: [],
      } as FiscalConstants;

      const error = expectCalculationError(() =>
        calculateDiasVacaciones({ yearsOfService: 1 }, constants),
      );
      expect(error.code).toBe('MISSING_CONSTANT');
      expect(error.field).toBe('vacationDaysTable');
    });
  });
});
