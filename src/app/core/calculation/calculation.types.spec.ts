// Pruebas unitarias del contrato de cálculo (Req 5.6, 5.7).
import { CalculationError } from './calculation.types';

describe('CalculationError', () => {
  it('es una instancia de Error y de CalculationError', () => {
    const error = new CalculationError('INVALID_INPUT', 'salario', 'salario inválido');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(CalculationError);
  });

  it('expone código, campo y mensaje', () => {
    const error = new CalculationError('MISSING_CONSTANT', 'uma', 'falta la UMA');

    expect(error.code).toBe('MISSING_CONSTANT');
    expect(error.field).toBe('uma');
    expect(error.message).toBe('falta la UMA');
    expect(error.name).toBe('CalculationError');
  });
});
