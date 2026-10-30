// Pruebas de ejemplo del Constants_Module (tarea 9.1).
//
// Verifican que las constantes del año fiscal 2026 coinciden con los valores
// oficiales verificados en la Fase 0 (docs/formulas.md) y que las tablas
// conservan sus invariantes estructurales. Fallan si alguna cifra se desvía
// del valor oficial documentado.

import { Injector, runInInjectionContext } from '@angular/core';
import { FISCAL_CONSTANTS_2026 } from './fiscal-constants.2026';
import {
  CURRENT_FISCAL_CONSTANTS,
  FISCAL_CONSTANTS,
  provideFiscalConstants,
} from './fiscal-constants.token';
import type { FiscalConstants } from './fiscal-constants.types';

describe('Constants_Module — año fiscal 2026', () => {
  it('fija el año fiscal y los metadatos de vigencia en ISO (Req 5.3)', () => {
    expect(FISCAL_CONSTANTS_2026.fiscalYear).toBe(2026);
    // Entrada en vigor exacta del año fiscal 2026 (docs/formulas.md §1).
    expect(FISCAL_CONSTANTS_2026.effectiveFrom).toBe('2026-01-01');

    // effectiveFrom y lastVerified están presentes y son fechas ISO (YYYY-MM-DD)
    // reales y parseables (no basta el formato: 2026-13-40 debe fallar).
    const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
    const isValidIsoDate = (value: string): boolean => {
      if (!ISO_DATE.test(value)) {
        return false;
      }
      const parsed = new Date(`${value}T00:00:00Z`);
      // Date no debe ser inválida y debe reserializarse al mismo día ISO
      // (descarta desbordes como 2026-02-31 que Date normaliza a otro día).
      return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
    };

    for (const field of ['effectiveFrom', 'lastVerified'] as const) {
      const value = FISCAL_CONSTANTS_2026[field];
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
      expect(isValidIsoDate(value)).toBe(true);
    }

    // lastVerified no es anterior a la entrada en vigor del año fiscal.
    expect(FISCAL_CONSTANTS_2026.lastVerified >= FISCAL_CONSTANTS_2026.effectiveFrom).toBe(true);
  });

  it('usa los valores oficiales de salario mínimo y UMA (docs/formulas.md §1, §2)', () => {
    // Caso de referencia: salario mínimo general 2026 = 315.04/día.
    expect(FISCAL_CONSTANTS_2026.minimumDailyWage).toBe(315.04);
    // Caso de referencia: UMA diaria 2026 = 117.31.
    expect(FISCAL_CONSTANTS_2026.uma).toBe(117.31);
  });

  it('contiene los 11 tramos de la tarifa ISR ordenados por límite inferior (docs/formulas.md §3)', () => {
    const table = FISCAL_CONSTANTS_2026.isrMonthlyTable;
    expect(table).toHaveLength(11);
    // Primer y último tramo contra valores oficiales.
    expect(table[0]).toEqual({ lowerLimit: 0.01, fixedFee: 0.0, rateOnExcess: 1.92 });
    expect(table[table.length - 1]).toEqual({
      lowerLimit: 425642.0,
      fixedFee: 133488.54,
      rateOnExcess: 35.0,
    });
    // Orden ascendente estricto por límite inferior y porcentajes en [0, 35].
    for (let i = 0; i < table.length; i++) {
      expect(table[i].rateOnExcess).toBeGreaterThanOrEqual(0);
      expect(table[i].rateOnExcess).toBeLessThanOrEqual(35);
      if (i > 0) {
        expect(table[i].lowerLimit).toBeGreaterThan(table[i - 1].lowerLimit);
      }
    }
  });

  it('contiene la tabla de días de vacaciones monótona no decreciente (docs/formulas.md §4)', () => {
    const table = FISCAL_CONSTANTS_2026.vacationDaysTable;
    // Casos de referencia: 1→12, 5→20, 6→22, 11→24.
    const byYears = new Map(table.map((row) => [row.yearsOfService, row.days]));
    expect(byYears.get(1)).toBe(12);
    expect(byYears.get(5)).toBe(20);
    expect(byYears.get(6)).toBe(22);
    expect(byYears.get(11)).toBe(24);
    // Antigüedad y días no decrecen a lo largo de la tabla.
    for (let i = 1; i < table.length; i++) {
      expect(table[i].yearsOfService).toBeGreaterThan(table[i - 1].yearsOfService);
      expect(table[i].days).toBeGreaterThanOrEqual(table[i - 1].days);
    }
  });

  it('documenta la fuente oficial de cada valor y tabla (Req 5.2)', () => {
    const refs = FISCAL_CONSTANTS_2026.sourceRefs;
    expect(refs['minimumDailyWage']).toBeTruthy();
    expect(refs['uma']).toBeTruthy();
    expect(refs['isrMonthlyTable']).toBeTruthy();
    expect(refs['vacationDaysTable']).toBeTruthy();
  });
});

describe('Constants_Module — token y provider del año vigente', () => {
  it('el año vigente apunta a las constantes de 2026', () => {
    expect(CURRENT_FISCAL_CONSTANTS).toBe(FISCAL_CONSTANTS_2026);
  });

  it('el provider entrega las constantes vigentes a través del InjectionToken (Req 5.4)', () => {
    const injector = Injector.create({ providers: [provideFiscalConstants()] });
    const constants = runInInjectionContext(injector, () =>
      injector.get<FiscalConstants>(FISCAL_CONSTANTS),
    );
    expect(constants).toBe(CURRENT_FISCAL_CONSTANTS);
    expect(constants.fiscalYear).toBe(2026);
  });
});
