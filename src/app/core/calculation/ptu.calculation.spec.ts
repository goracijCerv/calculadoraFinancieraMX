// Pruebas de ejemplo de la función pura de PTU (tarea 21.1).
//
// Verifican el reparto en dos mitades (días y salarios), el tope individual de
// la reforma 2021 y el caso de referencia de `docs/formulas.md` §9
// (LFT Art. 117–131). También cubren la invariante de conservación (Property 14):
// la suma de las partes repartidas no excede el monto a repartir y cada mitad es
// ≥ 0.

import { calculatePtu } from './ptu.calculation';
import type { PtuInput } from './ptu.calculation';
import { CalculationError } from './calculation.types';
import type { FiscalConstants } from '../constants/fiscal-constants.types';

/**
 * La PTU no depende de las constantes del año fiscal (su base la declara el
 * patrón ante el SAT), pero `calculatePtu` recibe `FiscalConstants` por la firma
 * uniforme de `CalculationFn`. Se pasa un objeto mínimo válido.
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

describe('calculatePtu', () => {
  it('reparte en dos mitades iguales y aplica el tope de 3 meses (caso de referencia §9)', () => {
    // Un solo trabajador: 365 de 365 días y el 100 % de los salarios ⇒ recibe
    // el reparto completo (60 000 + 60 000 = 120 000), pero el tope por 3 meses
    // de salario (3 × 10 000 = 30 000) lo acota a 30 000.00.
    const input: PtuInput = {
      amountToDistribute: 120000,
      daysWorked: 365,
      totalDaysWorked: 365,
      salaryEarned: 120000,
      totalSalaries: 120000,
      monthlySalary: 10000,
      triennialAverage: 0,
    };

    const result = calculatePtu(input, constants);

    expect(result.breakdown).toEqual([
      { concept: 'Mitad por días trabajados', amount: 60000 },
      { concept: 'Mitad por salarios devengados', amount: 60000 },
      { concept: 'Ajuste por tope individual', amount: -90000 },
    ]);
    expect(result.total).toBe(30000);
  });

  it('sin tope que recorte, reparte las dos mitades proporcionales', () => {
    // Persona con la mitad de los días y la mitad de los salarios del total;
    // salario mensual alto para que el tope no aplique.
    const input: PtuInput = {
      amountToDistribute: 120000,
      daysWorked: 182.5,
      totalDaysWorked: 365,
      salaryEarned: 60000,
      totalSalaries: 120000,
      monthlySalary: 50000,
    };

    const result = calculatePtu(input, constants);

    // Mitad A = 60 000 × (182.5/365) = 30 000; Mitad B = 60 000 × (60 000/120 000) = 30 000.
    expect(result.breakdown).toEqual([
      { concept: 'Mitad por días trabajados', amount: 30000 },
      { concept: 'Mitad por salarios devengados', amount: 30000 },
    ]);
    expect(result.total).toBe(60000);
  });

  it('usa el promedio trienal como tope cuando es mayor que 3 meses de salario', () => {
    const input: PtuInput = {
      amountToDistribute: 120000,
      daysWorked: 365,
      totalDaysWorked: 365,
      salaryEarned: 120000,
      totalSalaries: 120000,
      monthlySalary: 10000, // 3 meses = 30 000
      triennialAverage: 50000, // mayor ⇒ tope = 50 000
    };

    const result = calculatePtu(input, constants);

    expect(result.total).toBe(50000);
  });

  it('conservación (Property 14): la PTU repartida no excede el monto a repartir y cada mitad es ≥ 0', () => {
    const input: PtuInput = {
      amountToDistribute: 90000,
      daysWorked: 120,
      totalDaysWorked: 480,
      salaryEarned: 25000,
      totalSalaries: 200000,
      monthlySalary: 15000,
    };

    const result = calculatePtu(input, constants);

    const halfA = result.breakdown.find((i) => i.concept === 'Mitad por días trabajados');
    const halfB = result.breakdown.find((i) => i.concept === 'Mitad por salarios devengados');

    expect(halfA?.amount).toBeGreaterThanOrEqual(0);
    expect(halfB?.amount).toBeGreaterThanOrEqual(0);
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.total).toBeLessThanOrEqual(input.amountToDistribute);
  });

  it('el total es la suma del desglose redondeada a 2 decimales', () => {
    const input: PtuInput = {
      amountToDistribute: 73456.78,
      daysWorked: 200,
      totalDaysWorked: 730,
      salaryEarned: 33333.33,
      totalSalaries: 250000,
      monthlySalary: 40000,
    };

    const result = calculatePtu(input, constants);

    const sum = result.breakdown.reduce((acc, item) => acc + item.amount, 0);
    expect(result.total).toBeCloseTo(sum, 2);
  });

  it('no muta la entrada (pureza, Req 5.5)', () => {
    const input: PtuInput = {
      amountToDistribute: 120000,
      daysWorked: 365,
      totalDaysWorked: 365,
      salaryEarned: 120000,
      totalSalaries: 120000,
      monthlySalary: 10000,
    };
    const snapshot: PtuInput = { ...input };

    calculatePtu(input, constants);

    expect(input).toEqual(snapshot);
  });

  it('es determinista: misma entrada ⇒ misma salida (Req 5.5)', () => {
    const input: PtuInput = {
      amountToDistribute: 95000,
      daysWorked: 150,
      totalDaysWorked: 600,
      salaryEarned: 40000,
      totalSalaries: 300000,
      monthlySalary: 20000,
    };

    expect(calculatePtu(input, constants)).toEqual(calculatePtu(input, constants));
  });

  it('rechaza un monto a repartir negativo (INVALID_INPUT, Req 5.6)', () => {
    const input: PtuInput = {
      amountToDistribute: -1,
      daysWorked: 100,
      totalDaysWorked: 365,
      salaryEarned: 10000,
      totalSalaries: 50000,
      monthlySalary: 5000,
    };

    try {
      calculatePtu(input, constants);
      throw new Error('Se esperaba un CalculationError');
    } catch (error) {
      expect(error).toBeInstanceOf(CalculationError);
      expect((error as CalculationError).code).toBe('INVALID_INPUT');
      expect((error as CalculationError).field).toBe('amountToDistribute');
    }
  });

  it('rechaza un total de días ≤ 0 (INVALID_INPUT, Req 5.6)', () => {
    const input: PtuInput = {
      amountToDistribute: 120000,
      daysWorked: 0,
      totalDaysWorked: 0,
      salaryEarned: 0,
      totalSalaries: 50000,
      monthlySalary: 5000,
    };

    try {
      calculatePtu(input, constants);
      throw new Error('Se esperaba un CalculationError');
    } catch (error) {
      expect(error).toBeInstanceOf(CalculationError);
      expect((error as CalculationError).code).toBe('INVALID_INPUT');
      expect((error as CalculationError).field).toBe('totalDaysWorked');
    }
  });

  it('rechaza días de la persona que exceden el total (INVALID_INPUT, Req 5.6)', () => {
    const input: PtuInput = {
      amountToDistribute: 120000,
      daysWorked: 400,
      totalDaysWorked: 365,
      salaryEarned: 10000,
      totalSalaries: 50000,
      monthlySalary: 5000,
    };

    try {
      calculatePtu(input, constants);
      throw new Error('Se esperaba un CalculationError');
    } catch (error) {
      expect(error).toBeInstanceOf(CalculationError);
      expect((error as CalculationError).code).toBe('INVALID_INPUT');
      expect((error as CalculationError).field).toBe('daysWorked');
    }
  });

  it('rechaza un salario devengado que excede el total (INVALID_INPUT, Req 5.6)', () => {
    const input: PtuInput = {
      amountToDistribute: 120000,
      daysWorked: 100,
      totalDaysWorked: 365,
      salaryEarned: 60000,
      totalSalaries: 50000,
      monthlySalary: 5000,
    };

    try {
      calculatePtu(input, constants);
      throw new Error('Se esperaba un CalculationError');
    } catch (error) {
      expect(error).toBeInstanceOf(CalculationError);
      expect((error as CalculationError).code).toBe('INVALID_INPUT');
      expect((error as CalculationError).field).toBe('salaryEarned');
    }
  });

  it('rechaza un salario mensual ≤ 0 (INVALID_INPUT, Req 5.6)', () => {
    const input: PtuInput = {
      amountToDistribute: 120000,
      daysWorked: 100,
      totalDaysWorked: 365,
      salaryEarned: 10000,
      totalSalaries: 50000,
      monthlySalary: 0,
    };

    try {
      calculatePtu(input, constants);
      throw new Error('Se esperaba un CalculationError');
    } catch (error) {
      expect(error).toBeInstanceOf(CalculationError);
      expect((error as CalculationError).code).toBe('INVALID_INPUT');
      expect((error as CalculationError).field).toBe('monthlySalary');
    }
  });
});
