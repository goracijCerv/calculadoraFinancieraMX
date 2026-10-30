// Prueba de humo del scaffolding (tarea 2.1).
// Verifica que el runner de pruebas (Vitest) y la integración de `fast-check`
// funcionan antes de implementar la lógica real. No sustituye a los property
// tests numerados del diseño; solo valida que las herramientas están listas.
import fc from 'fast-check';

describe('Scaffolding smoke test', () => {
  it('runs the test runner', () => {
    expect(1 + 1).toBe(2);
  });

  it('runs fast-check property-based tests', () => {
    // Propiedad trivial: la suma de enteros es conmutativa.
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (a, b) => a + b === b + a),
      { numRuns: 100 },
    );
  });
});
