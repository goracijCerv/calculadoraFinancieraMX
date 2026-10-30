// Pruebas del helper de metadatos de recibo (Req 3.7).
import { generateFolio } from './receipt-meta';

describe('generateFolio', () => {
  const date = new Date(2026, 0, 15); // 2026-01-15 (mes 0-based)

  it('incluye el prefijo y la fecha en formato YYYYMMDD', () => {
    const folio = generateFolio('FINIQUITO', date, 0.5);
    expect(folio.startsWith('FINIQUITO-20260115-')).toBe(true);
  });

  it('es determinista: misma entrada produce el mismo folio', () => {
    expect(generateFolio('ISR', date, 0.3)).toBe(generateFolio('ISR', date, 0.3));
  });

  it('produce un sufijo de 4 caracteres del alfabeto sin ambigüedades', () => {
    const folio = generateFolio('X', date, 0.77);
    const suffix = folio.split('-').pop() ?? '';
    expect(suffix).toHaveLength(4);
    expect(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/.test(suffix)).toBe(true);
  });

  it('semillas distintas tienden a producir sufijos distintos', () => {
    const a = generateFolio('X', date, 0.1);
    const b = generateFolio('X', date, 0.9);
    expect(a).not.toBe(b);
  });

  it('tolera semillas fuera de rango sin lanzar', () => {
    expect(() => generateFolio('X', date, Number.NaN)).not.toThrow();
    expect(() => generateFolio('X', date, 5)).not.toThrow();
  });
});
