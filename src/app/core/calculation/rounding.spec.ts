// Pruebas unitarias de la utilidad común de redondeo monetario (Req 5.1).
import fc from 'fast-check';
import { MONEY_DECIMALS, roundMoney } from './rounding';

describe('roundMoney', () => {
  it('redondea a dos decimales', () => {
    expect(roundMoney(1.234)).toBe(1.23);
    expect(roundMoney(1.235)).toBe(1.24);
    expect(roundMoney(1.2)).toBe(1.2);
    expect(roundMoney(10)).toBe(10);
  });

  it('corrige el error de coma flotante en el límite (1.005 → 1.01)', () => {
    expect(roundMoney(1.005)).toBe(1.01);
    expect(roundMoney(2.675)).toBe(2.68);
  });

  it('redondea importes negativos', () => {
    expect(roundMoney(-1.234)).toBe(-1.23);
  });

  it('normaliza -0 a 0', () => {
    expect(Object.is(roundMoney(-0.001), 0)).toBe(true);
  });

  it('propaga valores no finitos sin romper', () => {
    expect(roundMoney(Number.POSITIVE_INFINITY)).toBe(Number.POSITIVE_INFINITY);
    expect(Number.isNaN(roundMoney(Number.NaN))).toBe(true);
  });

  it('es idempotente: redondear un valor ya redondeado no lo cambia', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1_000_000, max: 1_000_000, noNaN: true, noDefaultInfinity: true }),
        (value) => {
          const once = roundMoney(value);
          expect(roundMoney(once)).toBe(once);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('nunca produce más de dos decimales', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1_000_000, max: 1_000_000, noNaN: true, noDefaultInfinity: true }),
        (value) => {
          const result = roundMoney(value);
          const scaled = result * 10 ** MONEY_DECIMALS;
          // El valor escalado debe quedar (muy cerca de) un entero.
          expect(Math.abs(scaled - Math.round(scaled))).toBeLessThan(1e-6);
        },
      ),
      { numRuns: 100 },
    );
  });
});
