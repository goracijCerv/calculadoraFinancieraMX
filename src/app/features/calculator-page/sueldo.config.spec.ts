// Pruebas de la CalculatorConfig de sueldo neto ↔ bruto (tarea 19.1).
//
// Verifican: la metadata es consistente con `CALCULATOR_REGISTRY` (id, index,
// name, description, phase); los campos exigidos están declarados con su tipo y
// validaciones; el campo de dirección es un select con las dos opciones;
// `toInput` mapea los valores crudos al `SueldoInput`; y la config queda
// registrada en el mapa de configuraciones.

import { CALCULATOR_REGISTRY } from '../../core/registry/calculator-registry';
import { getCalculatorConfig } from './calculator-configs';
import { SUELDO_CONFIG } from './sueldo.config';

describe('SUELDO_CONFIG', () => {
  it('es consistente con la entrada de sueldo del registry (Req 8.6)', () => {
    const meta = CALCULATOR_REGISTRY.find((entry) => entry.id === 'sueldo');
    expect(meta).toBeDefined();
    expect(SUELDO_CONFIG.id).toBe(meta!.id);
    expect(SUELDO_CONFIG.index).toBe(meta!.index);
    expect(SUELDO_CONFIG.name).toBe(meta!.name);
    expect(SUELDO_CONFIG.description).toBe(meta!.description);
    expect(SUELDO_CONFIG.phase).toBe(meta!.phase);
    expect(SUELDO_CONFIG.phase).toBe(3);
    expect(SUELDO_CONFIG.index).toBe(7);
  });

  it('declara los campos de sueldo con sus tipos (Req 8.2, 8.3)', () => {
    const byKey = new Map(SUELDO_CONFIG.fields.map((f) => [f.key, f]));
    expect([...byKey.keys()]).toEqual(['amount', 'direction']);
    expect(byKey.get('amount')?.type).toBe('currency');
    expect(byKey.get('amount')?.required).toBe(true);
    expect(byKey.get('amount')?.min).toBeGreaterThan(0);
    expect(byKey.get('direction')?.type).toBe('select');
    expect(byKey.get('direction')?.required).toBe(true);
  });

  it('el campo de dirección ofrece las dos conversiones', () => {
    const direction = SUELDO_CONFIG.fields.find((f) => f.key === 'direction');
    expect(direction?.options?.map((o) => o.value)).toEqual(['gross-to-net', 'net-to-gross']);
    expect(direction?.initialValue).toBe('gross-to-net');
  });

  it('tiene una explicación en lenguaje simple (Req 3.4)', () => {
    expect(SUELDO_CONFIG.explanation.length).toBeGreaterThan(0);
    expect(SUELDO_CONFIG.explanation.toLowerCase()).toContain('neto');
    expect(SUELDO_CONFIG.explanation.toLowerCase()).toContain('bruto');
  });

  it('toInput mapea los valores crudos del formulario al SueldoInput', () => {
    expect(
      SUELDO_CONFIG.toInput({ amount: '30000', direction: 'net-to-gross' }),
    ).toEqual({ amount: 30000, direction: 'net-to-gross' });
  });

  it('expone calculateSueldo como función de cálculo', () => {
    expect(typeof SUELDO_CONFIG.calculate).toBe('function');
  });

  it('queda registrada en el mapa de configuraciones', () => {
    expect(getCalculatorConfig('sueldo')).toBe(SUELDO_CONFIG);
  });
});
