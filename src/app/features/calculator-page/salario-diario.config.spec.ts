// Pruebas de la CalculatorConfig de salario diario (tarea 20.1).
//
// Verifican: la metadata es consistente con `CALCULATOR_REGISTRY` (id, index,
// name, description, phase); los campos exigidos están declarados con el tipo y
// las validaciones correctas (monto moneda > 0 y periodicidad como `period` con
// sus opciones); `toInput` mapea los valores crudos al `SalarioDiarioInput`; y
// la config expone `calculateSalarioDiario` como función de cálculo.

import { CALCULATOR_REGISTRY } from '../../core/registry/calculator-registry';
import { SALARIO_DIARIO_CONFIG } from './salario-diario.config';

describe('SALARIO_DIARIO_CONFIG', () => {
  it('es consistente con la entrada de salario diario del registry (Req 8.6)', () => {
    const meta = CALCULATOR_REGISTRY.find((entry) => entry.id === 'salario-diario');
    expect(meta).toBeDefined();
    expect(SALARIO_DIARIO_CONFIG.id).toBe(meta!.id);
    expect(SALARIO_DIARIO_CONFIG.index).toBe(meta!.index);
    expect(SALARIO_DIARIO_CONFIG.name).toBe(meta!.name);
    expect(SALARIO_DIARIO_CONFIG.description).toBe(meta!.description);
    expect(SALARIO_DIARIO_CONFIG.phase).toBe(meta!.phase);
    expect(SALARIO_DIARIO_CONFIG.phase).toBe(3);
    expect(SALARIO_DIARIO_CONFIG.index).toBe(8);
  });

  it('declara los campos de salario diario con sus tipos (Req 8.4)', () => {
    const byKey = new Map(SALARIO_DIARIO_CONFIG.fields.map((f) => [f.key, f]));
    expect([...byKey.keys()]).toEqual(['amount', 'period']);

    expect(byKey.get('amount')?.type).toBe('currency');
    expect(byKey.get('amount')?.required).toBe(true);
    expect(byKey.get('amount')?.min).toBeGreaterThan(0);

    const period = byKey.get('period');
    expect(period?.type).toBe('period');
    expect(period?.required).toBe(true);
    expect(period?.initialValue).toBe('monthly');
    expect(period?.options?.map((o) => o.value)).toEqual(['weekly', 'biweekly', 'monthly']);
  });

  it('tiene una explicación en lenguaje simple (Req 3.4)', () => {
    expect(SALARIO_DIARIO_CONFIG.explanation.length).toBeGreaterThan(0);
    expect(SALARIO_DIARIO_CONFIG.explanation.toLowerCase()).toContain('salario diario');
  });

  it('toInput mapea los valores crudos del formulario al SalarioDiarioInput', () => {
    const input = SALARIO_DIARIO_CONFIG.toInput({ amount: '9000', period: 'monthly' });
    expect(input).toEqual({ amount: 9000, period: 'monthly' });
  });

  it('expone calculateSalarioDiario como función de cálculo', () => {
    expect(typeof SALARIO_DIARIO_CONFIG.calculate).toBe('function');
  });
});
