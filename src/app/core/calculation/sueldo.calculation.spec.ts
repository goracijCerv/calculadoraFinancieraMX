// Pruebas de ejemplo de la función pura de sueldo neto ↔ bruto (tarea 19.1).
//
// Verifican la conversión en ambas direcciones con la tarifa de ISR de
// `docs/formulas.md` §3, la consistencia del desglose (total = suma), el
// round trip bruto → neto → bruto (coherente con Property 12, tarea 19.2), la
// pureza/determinismo y el rechazo de entradas inválidas / constante faltante.
// La prueba de propiedad numerada (Property 12) corresponde a la tarea 19.2.

import {
  calculateSueldo,
  computeIsrFromBrackets,
  solveGrossFromNet,
  type SueldoInput,
} from './sueldo.calculation';
import { CalculationError } from './calculation.types';
import { roundMoney } from './rounding';
import { FISCAL_CONSTANTS_2026 } from '../constants/fiscal-constants.2026';
import type { FiscalConstants } from '../constants/fiscal-constants.types';

const constants = FISCAL_CONSTANTS_2026;
const table = constants.isrMonthlyTable;

describe('computeIsrFromBrackets', () => {
  it('usa la fórmula de §3 en el interior de un tramo (ingreso 30 000)', () => {
    // §3: 1 856.84 + (30 000 − 17 533.65) × 21.36% = 4 519.6524…
    expect(roundMoney(computeIsrFromBrackets(30000, table))).toBe(4519.65);
  });

  it('coincide con la cuota fija del tramo siguiente en la frontera (12 598.02)', () => {
    // §3: 420.95 + (12 598.02 − 7 168.52) × 10.88% = 1 011.68 (cuota fija tramo 4).
    expect(roundMoney(computeIsrFromBrackets(12598.02, table))).toBe(1011.68);
  });

  it('es cero para ingresos no positivos', () => {
    expect(computeIsrFromBrackets(0, table)).toBe(0);
    expect(computeIsrFromBrackets(-100, table)).toBe(0);
  });

  it('es monótono no decreciente respecto al ingreso', () => {
    const a = computeIsrFromBrackets(10000, table);
    const b = computeIsrFromBrackets(20000, table);
    const c = computeIsrFromBrackets(60000, table);
    expect(a).toBeLessThanOrEqual(b);
    expect(b).toBeLessThanOrEqual(c);
  });
});

describe('solveGrossFromNet', () => {
  it('invierte exactamente el neto de un bruto conocido', () => {
    const gross = 30000;
    const net = gross - computeIsrFromBrackets(gross, table);
    expect(roundMoney(solveGrossFromNet(net, table))).toBeCloseTo(gross, 2);
  });
});

describe('calculateSueldo', () => {
  it('convierte de bruto a neto restando el ISR (bruto 30 000)', () => {
    const input: SueldoInput = { amount: 30000, direction: 'gross-to-net' };

    const result = calculateSueldo(input, constants);

    // ISR 4 519.65 ⇒ neto 25 480.35.
    expect(result.total).toBe(25480.35);
    expect(result.breakdown).toEqual([
      { concept: 'Sueldo bruto', amount: 30000 },
      { concept: 'ISR retenido', amount: -4519.65 },
      { concept: 'Sueldo neto', amount: 25480.35 },
    ]);
  });

  it('convierte de neto a bruto recuperando el bruto original', () => {
    const input: SueldoInput = { amount: 25480.35, direction: 'net-to-gross' };

    const result = calculateSueldo(input, constants);

    expect(result.total).toBeCloseTo(30000, 2);
  });

  it('el total del desglose es coherente: bruto = neto + ISR', () => {
    const result = calculateSueldo({ amount: 45000, direction: 'gross-to-net' }, constants);
    const bruto = result.breakdown.find((b) => b.concept === 'Sueldo bruto')!.amount;
    const isr = result.breakdown.find((b) => b.concept === 'ISR retenido')!.amount;
    const neto = result.breakdown.find((b) => b.concept === 'Sueldo neto')!.amount;
    expect(roundMoney(neto + -isr)).toBeCloseTo(bruto, 2);
  });

  it('round trip bruto → neto → bruto reproduce el bruto (Property 12)', () => {
    for (const gross of [5000, 12000, 30000, 60000, 150000]) {
      const net = calculateSueldo({ amount: gross, direction: 'gross-to-net' }, constants).total;
      const back = calculateSueldo({ amount: net, direction: 'net-to-gross' }, constants).total;
      expect(back).toBeCloseTo(gross, 1);
    }
  });

  it('no muta la entrada (pureza, Req 5.5)', () => {
    const input: SueldoInput = { amount: 30000, direction: 'gross-to-net' };
    const snapshot: SueldoInput = { ...input };

    calculateSueldo(input, constants);

    expect(input).toEqual(snapshot);
  });

  it('es determinista: misma entrada ⇒ misma salida (Req 5.5)', () => {
    const input: SueldoInput = { amount: 42314.78, direction: 'net-to-gross' };

    expect(calculateSueldo(input, constants)).toEqual(calculateSueldo(input, constants));
  });

  it('rechaza un importe menor o igual a cero (INVALID_INPUT, Req 5.6)', () => {
    const input: SueldoInput = { amount: 0, direction: 'gross-to-net' };

    try {
      calculateSueldo(input, constants);
      throw new Error('Se esperaba un CalculationError');
    } catch (error) {
      expect(error).toBeInstanceOf(CalculationError);
      expect((error as CalculationError).code).toBe('INVALID_INPUT');
      expect((error as CalculationError).field).toBe('amount');
    }
  });

  it('rechaza un importe no finito (INVALID_INPUT, Req 5.6)', () => {
    const input: SueldoInput = {
      amount: Number.POSITIVE_INFINITY,
      direction: 'gross-to-net',
    };

    try {
      calculateSueldo(input, constants);
      throw new Error('Se esperaba un CalculationError');
    } catch (error) {
      expect(error).toBeInstanceOf(CalculationError);
      expect((error as CalculationError).code).toBe('INVALID_INPUT');
      expect((error as CalculationError).field).toBe('amount');
    }
  });

  it('rechaza una dirección inválida (INVALID_INPUT, Req 5.6)', () => {
    const input = { amount: 30000, direction: 'invalid' } as unknown as SueldoInput;

    try {
      calculateSueldo(input, constants);
      throw new Error('Se esperaba un CalculationError');
    } catch (error) {
      expect(error).toBeInstanceOf(CalculationError);
      expect((error as CalculationError).code).toBe('INVALID_INPUT');
      expect((error as CalculationError).field).toBe('direction');
    }
  });

  it('lanza MISSING_CONSTANT si falta la tabla del ISR (Req 5.7)', () => {
    const input: SueldoInput = { amount: 30000, direction: 'gross-to-net' };
    const missing = {
      ...constants,
      isrMonthlyTable: [],
    } as unknown as FiscalConstants;

    try {
      calculateSueldo(input, missing);
      throw new Error('Se esperaba un CalculationError');
    } catch (error) {
      expect(error).toBeInstanceOf(CalculationError);
      expect((error as CalculationError).code).toBe('MISSING_CONSTANT');
      expect((error as CalculationError).field).toBe('isrMonthlyTable');
    }
  });
});
