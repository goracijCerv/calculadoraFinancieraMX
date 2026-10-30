// Property test de término vacío de `searchCalculators` (tarea 7.3).
//
// Feature: calcula-facil, Property 16: Término vacío devuelve el registry completo
// Validates: Requirements 2.4
//
// Property 16 (design.md): para todo registry de calculadoras y todo término
// vacío o compuesto únicamente por espacios en blanco (incluido ''),
// `searchCalculators` devuelve exactamente el registry original: los mismos
// elementos y en el mismo orden.
//
// Se usa fast-check con ≥100 iteraciones, según el estándar de pruebas de
// propiedad del proyecto. Complementa (no reemplaza) el property test del
// filtrado de búsqueda (tarea 7.2).
import fc from 'fast-check';

import type { CalculatorMeta, CalculatorPhase } from './calculator-registry';
import { searchCalculators } from './search';

const NUM_RUNS = 200;

/** Generador de una calculadora arbitraria del registry. */
const calculatorMetaArb: fc.Arbitrary<CalculatorMeta> = fc.record({
  id: fc.string(),
  index: fc.integer({ min: 1, max: 99 }),
  name: fc.string(),
  description: fc.string(),
  phase: fc.constantFrom<CalculatorPhase>(1, 2, 3),
});

/** Generador de un registry arbitrario (incluye el vacío). */
const registryArb: fc.Arbitrary<CalculatorMeta[]> = fc.array(calculatorMetaArb, {
  maxLength: 20,
});

/**
 * Generador de términos solo de espacios en blanco, incluido el vacío ''.
 * Combina espacios, tabulaciones, saltos de línea y retornos de carro.
 */
const whitespaceTermArb: fc.Arbitrary<string> = fc
  .array(fc.constantFrom(' ', '\t', '\n', '\r', '\f', '\v', '\u00a0'), {
    maxLength: 10,
  })
  .map((parts) => parts.join(''));

describe('Feature: calcula-facil, Property 16: Término vacío devuelve el registry completo', () => {
  it('devuelve los mismos elementos en el mismo orden para cualquier término en blanco', () => {
    fc.assert(
      fc.property(registryArb, whitespaceTermArb, (registry, term) => {
        const result = searchCalculators(registry, term);

        // Mismo número de elementos: no se filtra nada.
        expect(result).toHaveLength(registry.length);

        // Mismos elementos (por identidad de referencia) y mismo orden: cada
        // posición del resultado es exactamente la del registry original.
        result.forEach((calculator, i) => {
          expect(calculator).toBe(registry[i]);
        });
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it('el término vacío "" devuelve el registry completo sin cambios', () => {
    fc.assert(
      fc.property(registryArb, (registry) => {
        const result = searchCalculators(registry, '');

        expect(result).toHaveLength(registry.length);
        result.forEach((calculator, i) => {
          expect(calculator).toBe(registry[i]);
        });
      }),
      { numRuns: NUM_RUNS },
    );
  });
});
