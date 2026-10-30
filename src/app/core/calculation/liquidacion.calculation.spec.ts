// Pruebas de ejemplo de la función pura de liquidación (tarea 13.1).
//
// Verifican los tres componentes legales y los casos de referencia de
// `docs/formulas.md` §8 (LFT Art. 48, 50, 162, 485–486). Las pruebas de
// propiedad numeradas (Property 7) y la prueba de ejemplo contra fuente oficial
// corresponden a las tareas 13.2 y 13.3.

import { calculateLiquidacion } from './liquidacion.calculation';
import type { LiquidacionInput } from './liquidacion.calculation';
import { CalculationError } from './calculation.types';
import type { FiscalConstants } from '../constants/fiscal-constants.types';

/**
 * Constantes mínimas para el cálculo: zona general 2026 (salario mínimo
 * $315.04/día, tope de prima de antigüedad 2 × 315.04 = $630.08).
 */
const constants: FiscalConstants = {
  fiscalYear: 2026,
  effectiveFrom: '2026-01-01',
  lastVerified: '2026-01-01',
  minimumDailyWage: 315.04,
  uma: 117.31,
  isrMonthlyTable: [],
  vacationDaysTable: [],
  sourceRefs: {},
};

describe('calculateLiquidacion', () => {
  it('desglosa los tres componentes legales (caso de referencia §8, sin tope)', () => {
    const input: LiquidacionInput = { dailySalary: 500, yearsOfService: 5 };

    const result = calculateLiquidacion(input, constants);

    expect(result.breakdown).toEqual([
      { concept: 'Indemnización de 3 meses', amount: 45000 },
      { concept: '20 días de salario por año', amount: 50000 },
      { concept: 'Prima de antigüedad', amount: 30000 },
    ]);
    expect(result.total).toBe(125000);
  });

  it('aplica el tope de 2 × salario mínimo en la prima de antigüedad (caso §8)', () => {
    const input: LiquidacionInput = { dailySalary: 1000, yearsOfService: 3 };

    const result = calculateLiquidacion(input, constants);

    // min(1000, 630.08) × 12 × 3 = 630.08 × 36 = 22 682.88.
    const prima = result.breakdown.find((item) => item.concept === 'Prima de antigüedad');
    expect(prima?.amount).toBe(22682.88);
  });

  it('el total es la suma del desglose redondeada a 2 decimales', () => {
    const input: LiquidacionInput = { dailySalary: 753.21, yearsOfService: 4 };

    const result = calculateLiquidacion(input, constants);

    const sum = result.breakdown.reduce((acc, item) => acc + item.amount, 0);
    expect(result.total).toBeCloseTo(sum, 2);
  });

  it('con cero años de servicio solo queda la indemnización de 3 meses', () => {
    const input: LiquidacionInput = { dailySalary: 400, yearsOfService: 0 };

    const result = calculateLiquidacion(input, constants);

    expect(result.breakdown).toEqual([
      { concept: 'Indemnización de 3 meses', amount: 36000 },
      { concept: '20 días de salario por año', amount: 0 },
      { concept: 'Prima de antigüedad', amount: 0 },
    ]);
    expect(result.total).toBe(36000);
  });

  it('no muta la entrada (pureza, Req 5.5)', () => {
    const input: LiquidacionInput = { dailySalary: 500, yearsOfService: 5 };
    const snapshot: LiquidacionInput = { ...input };

    calculateLiquidacion(input, constants);

    expect(input).toEqual(snapshot);
  });

  it('es determinista: misma entrada ⇒ misma salida (Req 5.5)', () => {
    const input: LiquidacionInput = { dailySalary: 612.5, yearsOfService: 7 };

    expect(calculateLiquidacion(input, constants)).toEqual(
      calculateLiquidacion(input, constants),
    );
  });

  it('rechaza un salario diario menor al salario mínimo (INVALID_INPUT, Req 5.6)', () => {
    const input: LiquidacionInput = { dailySalary: 300, yearsOfService: 2 };

    try {
      calculateLiquidacion(input, constants);
      throw new Error('Se esperaba un CalculationError');
    } catch (error) {
      expect(error).toBeInstanceOf(CalculationError);
      expect((error as CalculationError).code).toBe('INVALID_INPUT');
      expect((error as CalculationError).field).toBe('dailySalary');
    }
  });

  it('rechaza años de servicio negativos (INVALID_INPUT, Req 5.6)', () => {
    const input: LiquidacionInput = { dailySalary: 500, yearsOfService: -1 };

    try {
      calculateLiquidacion(input, constants);
      throw new Error('Se esperaba un CalculationError');
    } catch (error) {
      expect(error).toBeInstanceOf(CalculationError);
      expect((error as CalculationError).code).toBe('INVALID_INPUT');
      expect((error as CalculationError).field).toBe('yearsOfService');
    }
  });

  it('rechaza años de servicio no enteros (INVALID_INPUT, Req 5.6)', () => {
    const input: LiquidacionInput = { dailySalary: 500, yearsOfService: 2.5 };

    try {
      calculateLiquidacion(input, constants);
      throw new Error('Se esperaba un CalculationError');
    } catch (error) {
      expect(error).toBeInstanceOf(CalculationError);
      expect((error as CalculationError).code).toBe('INVALID_INPUT');
      expect((error as CalculationError).field).toBe('yearsOfService');
    }
  });

  it('rechaza un salario diario no finito (INVALID_INPUT, Req 5.6)', () => {
    const input: LiquidacionInput = {
      dailySalary: Number.POSITIVE_INFINITY,
      yearsOfService: 2,
    };

    try {
      calculateLiquidacion(input, constants);
      throw new Error('Se esperaba un CalculationError');
    } catch (error) {
      expect(error).toBeInstanceOf(CalculationError);
      expect((error as CalculationError).code).toBe('INVALID_INPUT');
      expect((error as CalculationError).field).toBe('dailySalary');
    }
  });

  it('lanza MISSING_CONSTANT si falta el salario mínimo (Req 5.7)', () => {
    const input: LiquidacionInput = { dailySalary: 500, yearsOfService: 5 };
    const missing = {
      ...constants,
      minimumDailyWage: undefined,
    } as unknown as FiscalConstants;

    try {
      calculateLiquidacion(input, missing);
      throw new Error('Se esperaba un CalculationError');
    } catch (error) {
      expect(error).toBeInstanceOf(CalculationError);
      expect((error as CalculationError).code).toBe('MISSING_CONSTANT');
      expect((error as CalculationError).field).toBe('minimumDailyWage');
    }
  });
});
