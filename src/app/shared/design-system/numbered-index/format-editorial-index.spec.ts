// Pruebas de ejemplo del helper puro del índice editorial (Req 1.3, 9.5).
// Las pruebas de propiedad numeradas (Property 19) viven en la tarea 5.4.
import { formatEditorialIndex } from './format-editorial-index';

describe('formatEditorialIndex', () => {
  it('rellena con cero los valores de un dígito', () => {
    expect(formatEditorialIndex(1)).toBe('01');
    expect(formatEditorialIndex(9)).toBe('09');
  });

  it('mantiene dos dígitos sin relleno adicional', () => {
    expect(formatEditorialIndex(10)).toBe('10');
    expect(formatEditorialIndex(42)).toBe('42');
    expect(formatEditorialIndex(99)).toBe('99');
  });

  it('conserva todos los dígitos para valores de tres dígitos (sin truncar)', () => {
    expect(formatEditorialIndex(100)).toBe('100');
  });

  it('rechaza valores menores que 1', () => {
    expect(() => formatEditorialIndex(0)).toThrow(RangeError);
    expect(() => formatEditorialIndex(-1)).toThrow(RangeError);
  });

  it('rechaza valores no enteros o no finitos', () => {
    expect(() => formatEditorialIndex(1.5)).toThrow(RangeError);
    expect(() => formatEditorialIndex(Number.NaN)).toThrow(RangeError);
    expect(() => formatEditorialIndex(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});
