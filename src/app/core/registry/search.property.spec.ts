// Property test del filtrado de búsqueda en el cliente (tarea 7.2).
//
// Feature: calcula-facil, Property 15: El filtrado de búsqueda es correcto
// Validates: Requirements 2.1, 2.2
//
// Property 15 (design.md): para todo registry de calculadoras y para todo
// término de búsqueda no vacío, cada calculadora devuelta por `Search` coincide
// con el término en su nombre o descripción, y ninguna calculadora que no
// coincide aparece en el resultado (el resultado es, por tanto, subconjunto del
// registry).
//
// Estas pruebas de propiedad complementan las de ejemplo (no las reemplazan).
// Se usa fast-check con ≥100 iteraciones, según el estándar de pruebas de
// propiedad del proyecto.
import fc from 'fast-check';

import { CALCULATOR_REGISTRY, type CalculatorMeta, type CalculatorPhase } from './calculator-registry';
import { searchCalculators } from './search';

const NUM_RUNS = 200;

/** Fases válidas del registry (Req 6.3, 7.5, 8.6). */
const PHASES: readonly CalculatorPhase[] = [1, 2, 3];

/** Genera una calculadora arbitraria con `name`/`description` no triviales. */
const calculatorArb: fc.Arbitrary<CalculatorMeta> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 12 }),
  index: fc.integer({ min: 1, max: 99 }),
  name: fc.string({ minLength: 0, maxLength: 20 }),
  description: fc.string({ minLength: 0, maxLength: 40 }),
  phase: fc.constantFrom(...PHASES),
});

/** Genera un registry arbitrario (incluye el caso vacío). */
const registryArb: fc.Arbitrary<readonly CalculatorMeta[]> = fc.array(calculatorArb, {
  minLength: 0,
  maxLength: 15,
});

/**
 * ¿`result` es un subconjunto de `all` preservando el orden relativo? Compara
 * por identidad de referencia: cada elemento del resultado debe ser uno de los
 * objetos del registry de entrada, y en el mismo orden en que aparecen allí.
 */
function isOrderedSubset(
  result: readonly CalculatorMeta[],
  all: readonly CalculatorMeta[],
): boolean {
  let searchFrom = 0;
  for (const item of result) {
    const foundAt = all.indexOf(item, searchFrom);
    if (foundAt === -1) {
      return false;
    }
    searchFrom = foundAt + 1;
  }
  return true;
}

/** ¿`meta` coincide con `term` por subcadena, sin distinguir mayúsculas? */
function matchesTerm(meta: CalculatorMeta, term: string): boolean {
  const normalized = term.trim().toLowerCase();
  return (
    meta.name.toLowerCase().includes(normalized) ||
    meta.description.toLowerCase().includes(normalized)
  );
}

describe('Feature: calcula-facil, Property 15: El filtrado de búsqueda es correcto', () => {
  it('(a) todo resultado es un subconjunto del registry y coincide con el término (términos arbitrarios)', () => {
    fc.assert(
      fc.property(
        registryArb,
        // Términos no vacíos: Property 15 aplica a términos de búsqueda no vacíos.
        fc.string({ minLength: 1, maxLength: 15 }).filter((t) => t.trim().length > 0),
        (registry, term) => {
          const result = searchCalculators(registry, term);

          // (a) Subconjunto del registry, preservando el orden relativo.
          expect(isOrderedSubset(result, registry)).toBe(true);

          // (b) Cada resultado coincide con el término en name o description.
          for (const meta of result) {
            expect(matchesTerm(meta, term)).toBe(true);
          }

          // (c) Ninguna calculadora que coincide queda fuera del resultado:
          // el resultado es exactamente el filtro de coincidencias del registry.
          const expected = registry.filter((meta) => matchesTerm(meta, term));
          expect(result).toEqual(expected);
        },
      ),
      { numRuns: NUM_RUNS },
    );
  });

  it('(b) términos derivados de entradas existentes recuperan esa entrada', () => {
    fc.assert(
      fc.property(
        // Registry con al menos un elemento del que derivar el término.
        fc.array(calculatorArb, { minLength: 1, maxLength: 15 }),
        (registry) => {
          for (const source of registry) {
            const haystack = source.name.length > 0 ? source.name : source.description;

            // Solo tiene sentido derivar un término cuando hay texto no vacío.
            if (haystack.trim().length === 0) {
              continue;
            }

            // Subcadena no vacía tomada del name/description de una entrada real.
            const term = haystack;
            const result = searchCalculators(registry, term);

            // La entrada de la que derivamos el término debe estar presente.
            expect(result).toContain(source);
            // Y el resultado sigue siendo subconjunto coincidente del registry.
            expect(isOrderedSubset(result, registry)).toBe(true);
            for (const meta of result) {
              expect(matchesTerm(meta, term)).toBe(true);
            }
          }
        },
      ),
      { numRuns: NUM_RUNS },
    );
  });

  it('(c) sobre el registry real, los resultados siguen siendo subconjunto coincidente', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 15 }).filter((t) => t.trim().length > 0),
        (term) => {
          const result = searchCalculators(CALCULATOR_REGISTRY, term);

          expect(isOrderedSubset(result, CALCULATOR_REGISTRY)).toBe(true);
          for (const meta of result) {
            expect(matchesTerm(meta, term)).toBe(true);
          }
        },
      ),
      { numRuns: NUM_RUNS },
    );
  });
});
