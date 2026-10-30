/**
 * Pruebas de propiedades transversales del Calculation_Service, con el
 * finiquito como primer caso representativo (tarea 11.2).
 *
 * A diferencia de la prueba de ejemplo (`finiquito.example.spec.ts`, que fija el
 * caso de referencia oficial y verifica importes exactos), estas pruebas
 * verifican RELACIONES UNIVERSALES que toda función pura de cálculo debe cumplir
 * para CUALQUIER entrada válida, usando `fast-check` con ≥100 iteraciones.
 *
 * Propiedades cubiertas (ver design.md):
 *   - Property 1: Determinismo e inmutabilidad          (Req 5.5, 14.1, 14.2)
 *   - Property 2: Redondeo monetario a dos decimales     (Req 5.1)
 *   - Property 3: Consistencia total = suma del desglose (Req 3.2, 3.3, 6.1, 7.1)
 *   - Property 4: Rechazo de entradas fuera de rango     (Req 5.6, 4.1, 4.3)
 *   - Property 5: Rechazo por constante faltante         (Req 5.7)
 *   - Property 6: Finiquito incluye los conceptos        (Req 6.1, 6.2)
 */

import fc from 'fast-check';

import { FISCAL_CONSTANTS_2026 } from '../constants/fiscal-constants.2026';
import type { FiscalConstants } from '../constants/fiscal-constants.types';
import { CalculationError } from './calculation.types';
import { calculateFiniquito, type FiniquitoInput } from './finiquito.calculation';
import { MONEY_DECIMALS } from './rounding';

/** Salario mínimo diario vigente (cota inferior del salario válido, Req 4.1). */
const MIN_DAILY_WAGE = FISCAL_CONSTANTS_2026.minimumDailyWage;

/** Rango de fechas acotado (evita años extremos sin perder cobertura). */
const DATE_MIN = new Date(Date.UTC(1990, 0, 1));
const DATE_MAX = new Date(Date.UTC(2060, 11, 31));

/** Formatea una `Date` a cadena ISO "YYYY-MM-DD" usando componentes UTC. */
function toIsoDate(date: Date): string {
  const year = String(date.getUTCFullYear()).padStart(4, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generador de entradas VÁLIDAS de finiquito:
 * - salario diario ≥ salario mínimo (Req 4.1),
 * - rango de fechas ISO válido con `endDate ≥ startDate` (Req 4.2),
 * - días pendientes como entero ≥ 0.
 */
const validInputArb: fc.Arbitrary<FiniquitoInput> = fc
  .record({
    dailySalaryOrMonthly: fc.double({
      min: MIN_DAILY_WAGE,
      max: 100_000,
      noNaN: true,
      noDefaultInfinity: true,
    }),
    startDate: fc.date({ min: DATE_MIN, max: DATE_MAX, noInvalidDate: true }),
    endDate: fc.date({ min: DATE_MIN, max: DATE_MAX, noInvalidDate: true }),
    pendingVacationDays: fc.integer({ min: 0, max: 60 }),
    aguinaldoProportional: fc.boolean(),
  })
  .map(({ startDate, endDate, ...rest }) => {
    // Ordena el par para garantizar endDate ≥ startDate (Req 4.2).
    // Se compara por día calendario ISO (no por ms redondeados) para evitar que
    // fracciones de día dejen el fin un día antes del inicio.
    const a = toIsoDate(startDate);
    const b = toIsoDate(endDate);
    return { ...rest, startDate: a <= b ? a : b, endDate: a <= b ? b : a };
  });

describe('calculateFiniquito — propiedades transversales del Calculation_Service', () => {
  // ── Property 1: Determinismo e inmutabilidad (Req 5.5, 14.1, 14.2) ──
  it('Feature: calcula-facil, Property 1: es determinista y no muta la entrada', () => {
    fc.assert(
      fc.property(validInputArb, (input) => {
        // Copia profunda independiente para detectar mutaciones de `input`.
        const snapshot: FiniquitoInput = JSON.parse(JSON.stringify(input));

        const first = calculateFiniquito(input, FISCAL_CONSTANTS_2026);
        const second = calculateFiniquito(input, FISCAL_CONSTANTS_2026);

        // Misma entrada ⇒ misma salida (deep-equal).
        expect(second).toEqual(first);
        // La entrada no fue mutada por la función pura.
        expect(input).toEqual(snapshot);
      }),
      { numRuns: 100 },
    );
  });

  // ── Property 2: Redondeo monetario a dos decimales (Req 5.1) ──
  it('Feature: calcula-facil, Property 2: todo importe y el total tienen ≤2 decimales', () => {
    const factor = 10 ** MONEY_DECIMALS;
    const hasAtMostTwoDecimals = (value: number): boolean => {
      const scaled = value * factor;
      return Math.abs(scaled - Math.round(scaled)) < 1e-6;
    };

    fc.assert(
      fc.property(validInputArb, (input) => {
        const result = calculateFiniquito(input, FISCAL_CONSTANTS_2026);

        expect(hasAtMostTwoDecimals(result.total)).toBe(true);
        for (const item of result.breakdown) {
          expect(hasAtMostTwoDecimals(item.amount)).toBe(true);
        }
      }),
      { numRuns: 100 },
    );
  });

  // ── Property 3: Consistencia total = suma del desglose (Req 3.2, 3.3, 6.1, 7.1) ──
  it('Feature: calcula-facil, Property 3: el total es la suma redondeada del desglose', () => {
    const factor = 10 ** MONEY_DECIMALS;
    const roundMoney2 = (amount: number): number => Math.round((amount + Number.EPSILON) * factor) / factor;

    fc.assert(
      fc.property(validInputArb, (input) => {
        const result = calculateFiniquito(input, FISCAL_CONSTANTS_2026);
        const sum = roundMoney2(result.breakdown.reduce((acc, item) => acc + item.amount, 0));

        expect(result.total).toBe(sum);
      }),
      { numRuns: 100 },
    );
  });

  // ── Property 4: Rechazo de entradas fuera de rango (Req 5.6, 4.1, 4.3) ──
  describe('Feature: calcula-facil, Property 4: rechaza entradas fuera de rango con INVALID_INPUT', () => {
    it('salario menor al salario mínimo', () => {
      const belowMinSalaryArb = fc.record({
        dailySalaryOrMonthly: fc.double({
          min: 0,
          max: MIN_DAILY_WAGE - 0.01,
          noNaN: true,
          noDefaultInfinity: true,
        }),
        startDate: fc.constant('2020-01-01'),
        endDate: fc.constant('2024-01-01'),
        pendingVacationDays: fc.integer({ min: 0, max: 60 }),
        aguinaldoProportional: fc.boolean(),
      });

      fc.assert(
        fc.property(belowMinSalaryArb, (input) => {
          try {
            calculateFiniquito(input, FISCAL_CONSTANTS_2026);
            return false;
          } catch (error) {
            return error instanceof CalculationError && error.code === 'INVALID_INPUT';
          }
        }),
        { numRuns: 100 },
      );
    });

    it('fecha de fin anterior a la de inicio', () => {
      const reversedDatesArb = fc
        .record({
          dailySalaryOrMonthly: fc.double({
            min: MIN_DAILY_WAGE,
            max: 100_000,
            noNaN: true,
            noDefaultInfinity: true,
          }),
          a: fc.date({ min: DATE_MIN, max: DATE_MAX, noInvalidDate: true }),
          b: fc.date({ min: DATE_MIN, max: DATE_MAX, noInvalidDate: true }),
          pendingVacationDays: fc.integer({ min: 0, max: 60 }),
          aguinaldoProportional: fc.boolean(),
        })
        // Ordena por las cadenas ISO ya truncadas a día (comparación
        // lexicográfica == cronológica para "YYYY-MM-DD"), descartando los
        // pares del mismo día civil (que no serían un rango invertido).
        .map(({ a, b, ...rest }) => ({ ...rest, isoA: toIsoDate(a), isoB: toIsoDate(b) }))
        .filter(({ isoA, isoB }) => isoA !== isoB)
        .map(({ isoA, isoB, ...rest }) => {
          const [earlier, later] = isoA < isoB ? [isoA, isoB] : [isoB, isoA];
          // startDate = la posterior, endDate = la anterior ⇒ endDate < startDate.
          return { ...rest, startDate: later, endDate: earlier } as FiniquitoInput;
        });

      fc.assert(
        fc.property(reversedDatesArb, (input) => {
          try {
            calculateFiniquito(input, FISCAL_CONSTANTS_2026);
            return false;
          } catch (error) {
            return (
              error instanceof CalculationError &&
              error.code === 'INVALID_INPUT' &&
              error.field === 'endDate'
            );
          }
        }),
        { numRuns: 100 },
      );
    });

    it('días pendientes negativos o no enteros', () => {
      const invalidDaysArb = fc.record({
        dailySalaryOrMonthly: fc.double({
          min: MIN_DAILY_WAGE,
          max: 100_000,
          noNaN: true,
          noDefaultInfinity: true,
        }),
        startDate: fc.constant('2020-01-01'),
        endDate: fc.constant('2024-01-01'),
        pendingVacationDays: fc.oneof(
          fc.integer({ min: -60, max: -1 }),
          fc
            .double({ min: 0.01, max: 60, noNaN: true, noDefaultInfinity: true })
            .filter((value) => !Number.isInteger(value)),
        ),
        aguinaldoProportional: fc.boolean(),
      });

      fc.assert(
        fc.property(invalidDaysArb, (input) => {
          try {
            calculateFiniquito(input, FISCAL_CONSTANTS_2026);
            return false;
          } catch (error) {
            return (
              error instanceof CalculationError &&
              error.code === 'INVALID_INPUT' &&
              error.field === 'pendingVacationDays'
            );
          }
        }),
        { numRuns: 100 },
      );
    });
  });

  // ── Property 5: Rechazo por constante faltante (Req 5.7) ──
  it('Feature: calcula-facil, Property 5: rechaza constantes faltantes con MISSING_CONSTANT', () => {
    // Variante sin salario mínimo y variante con tabla de vacaciones vacía.
    const brokenConstantsArb = fc.constantFrom<FiscalConstants>(
      { ...FISCAL_CONSTANTS_2026, minimumDailyWage: undefined as unknown as number },
      { ...FISCAL_CONSTANTS_2026, vacationDaysTable: [] },
    );

    fc.assert(
      fc.property(validInputArb, brokenConstantsArb, (input, constants) => {
        try {
          calculateFiniquito(input, constants);
          return false;
        } catch (error) {
          return error instanceof CalculationError && error.code === 'MISSING_CONSTANT';
        }
      }),
      { numRuns: 100 },
    );
  });

  // ── Property 6: Finiquito incluye los conceptos proporcionales exigidos (Req 6.1, 6.2) ──
  it('Feature: calcula-facil, Property 6: el desglose incluye los conceptos proporcionales exigidos', () => {
    fc.assert(
      fc.property(validInputArb, (input) => {
        const result = calculateFiniquito(input, FISCAL_CONSTANTS_2026);
        const concepts = result.breakdown.map((item) => item.concept);

        // Siempre presentes: vacaciones proporcionales, prima vacacional y días pendientes.
        expect(concepts).toContain('Vacaciones proporcionales');
        expect(concepts).toContain('Prima vacacional');
        expect(concepts).toContain('Días pendientes');
        // Aguinaldo proporcional presente si y solo si se solicitó.
        expect(concepts.includes('Aguinaldo proporcional')).toBe(input.aguinaldoProportional);
      }),
      { numRuns: 100 },
    );
  });
});
