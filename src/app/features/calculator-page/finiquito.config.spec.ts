// Pruebas de la CalculatorConfig de finiquito (tarea 11.5).
//
// Verifican: la metadata es consistente con `CALCULATOR_REGISTRY` (id, index,
// name, description, phase); los campos exigidos están declarados con el tipo y
// las validaciones correctas; `toInput` mapea los valores crudos al
// `FiniquitoInput`; y el validador cruzado exige fin ≥ inicio (Req 4.2).

import { FormControl, FormGroup } from '@angular/forms';

import { CALCULATOR_REGISTRY } from '../../core/registry/calculator-registry';
import { endDateNotBeforeStartDate, FINIQUITO_CONFIG } from './finiquito.config';

describe('FINIQUITO_CONFIG', () => {
  it('es consistente con la entrada de finiquito del registry (Req 6.3)', () => {
    const meta = CALCULATOR_REGISTRY.find((entry) => entry.id === 'finiquito');
    expect(meta).toBeDefined();
    expect(FINIQUITO_CONFIG.id).toBe(meta!.id);
    expect(FINIQUITO_CONFIG.index).toBe(meta!.index);
    expect(FINIQUITO_CONFIG.name).toBe(meta!.name);
    expect(FINIQUITO_CONFIG.description).toBe(meta!.description);
    expect(FINIQUITO_CONFIG.phase).toBe(meta!.phase);
    expect(FINIQUITO_CONFIG.phase).toBe(1);
  });

  it('declara los campos de finiquito con sus tipos (Req 6.1)', () => {
    const byKey = new Map(FINIQUITO_CONFIG.fields.map((f) => [f.key, f]));
    expect([...byKey.keys()]).toEqual([
      'dailySalaryOrMonthly',
      'startDate',
      'endDate',
      'pendingVacationDays',
      'aguinaldoProportional',
    ]);
    expect(byKey.get('dailySalaryOrMonthly')?.type).toBe('currency');
    expect(byKey.get('dailySalaryOrMonthly')?.required).toBe(true);
    expect(byKey.get('dailySalaryOrMonthly')?.min).toBeGreaterThan(0);
    expect(byKey.get('startDate')?.type).toBe('date');
    expect(byKey.get('endDate')?.type).toBe('date');
    expect(byKey.get('pendingVacationDays')?.type).toBe('integer');
    expect(byKey.get('pendingVacationDays')?.min).toBe(0);
    expect(byKey.get('aguinaldoProportional')?.type).toBe('boolean');
  });

  it('tiene una explicación en lenguaje simple (Req 3.4)', () => {
    expect(FINIQUITO_CONFIG.explanation.length).toBeGreaterThan(0);
    expect(FINIQUITO_CONFIG.explanation.toLowerCase()).toContain('finiquito');
  });

  it('toInput mapea los valores crudos del formulario al FiniquitoInput', () => {
    const input = FINIQUITO_CONFIG.toInput({
      dailySalaryOrMonthly: '500',
      startDate: '2025-01-01',
      endDate: '2026-01-01',
      pendingVacationDays: '3',
      aguinaldoProportional: true,
    });
    expect(input).toEqual({
      dailySalaryOrMonthly: 500,
      startDate: '2025-01-01',
      endDate: '2026-01-01',
      pendingVacationDays: 3,
      aguinaldoProportional: true,
    });
  });

  it('expone calculateFiniquito como función de cálculo', () => {
    expect(typeof FINIQUITO_CONFIG.calculate).toBe('function');
  });

  describe('endDateNotBeforeStartDate (Req 4.2)', () => {
    const group = (start: string, end: string): FormGroup =>
      new FormGroup({
        startDate: new FormControl(start),
        endDate: new FormControl(end),
      });

    it('registra el validador cruzado en la config', () => {
      expect(FINIQUITO_CONFIG.crossValidators).toContain(endDateNotBeforeStartDate);
    });

    it('marca error cuando fin es anterior a inicio', () => {
      expect(endDateNotBeforeStartDate(group('2026-01-01', '2025-12-31'))).toEqual({
        endBeforeStart: true,
      });
    });

    it('no marca error cuando fin es igual o posterior a inicio', () => {
      expect(endDateNotBeforeStartDate(group('2025-01-01', '2025-01-01'))).toBeNull();
      expect(endDateNotBeforeStartDate(group('2025-01-01', '2026-01-01'))).toBeNull();
    });

    it('no marca error de orden si falta alguna fecha (lo exige `required`)', () => {
      expect(endDateNotBeforeStartDate(group('', '2026-01-01'))).toBeNull();
      expect(endDateNotBeforeStartDate(group('2025-01-01', ''))).toBeNull();
    });
  });
});
