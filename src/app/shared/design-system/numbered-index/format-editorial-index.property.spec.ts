// Property test del helper puro del índice editorial.
//
// Feature: calcula-facil, Property 19: Formato e integridad del índice editorial
// Validates: Requirements 1.3, 9.5
//
// Property 19 (design.md): para toda posición del registry, el índice
// formateado es su número con dos dígitos y relleno de cero, y la secuencia
// completa de índices del registry es consecutiva desde 01 sin saltos.
//
// Estas pruebas de propiedad complementan las de ejemplo en
// `format-editorial-index.spec.ts` (no la reemplazan). Se usa fast-check con
// ≥100 iteraciones, según el estándar de pruebas de propiedad del proyecto.
import fc from 'fast-check';

import { formatEditorialIndex } from './format-editorial-index';

const NUM_RUNS = 200;

describe('Feature: calcula-facil, Property 19: Formato e integridad del índice editorial', () => {
  it('(a) formato de dos dígitos con relleno de cero para posiciones 1..99', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 99 }), (n) => {
        const formatted = formatEditorialIndex(n);

        // Siempre al menos dos caracteres.
        expect(formatted.length).toBeGreaterThanOrEqual(2);
        // Para 1..99 son exactamente dos dígitos con relleno de cero.
        expect(formatted).toHaveLength(2);
        expect(formatted).toMatch(/^\d{2}$/);
        // El relleno conserva el valor numérico sin truncar.
        expect(Number.parseInt(formatted, 10)).toBe(n);
        expect(formatted).toBe(String(n).padStart(2, '0'));
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it('(b) la secuencia 1-based desde 01 sin saltos produce índices ascendentes y contiguos', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 150 }), (length) => {
        // Invariante del registry: posiciones 1, 2, …, length (desde 01, sin saltos).
        const positions = Array.from({ length }, (_, i) => i + 1);
        const formatted = positions.map(formatEditorialIndex);

        // La secuencia empieza en "01".
        expect(formatted[0]).toBe('01');

        // Cada índice corresponde exactamente a su posición 1-based: ascendente
        // y contiguo (sin saltos ni duplicados).
        for (let i = 0; i < formatted.length; i++) {
          expect(Number.parseInt(formatted[i], 10)).toBe(i + 1);
        }

        // Comprobación explícita de contigüidad entre vecinos: cada valor es
        // exactamente uno más que el anterior.
        for (let i = 1; i < formatted.length; i++) {
          const prev = Number.parseInt(formatted[i - 1], 10);
          const curr = Number.parseInt(formatted[i], 10);
          expect(curr).toBe(prev + 1);
        }
      }),
      { numRuns: NUM_RUNS },
    );
  });
});
