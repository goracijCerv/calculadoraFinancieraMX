// Vitest configuration for the calcula-facil unit tests.
//
// El runner por defecto de `@angular/build:unit-test` es Vitest. Se sube el
// `testTimeout` global porque la suite incluye numerosas pruebas de propiedad
// (fast-check, ≥100 iteraciones) y pruebas de componente que reconstruyen el
// TestBed por iteración; bajo la ejecución concurrente de todo el proyecto, el
// límite por defecto de 5000 ms resulta demasiado ajustado y produce timeouts
// intermitentes (no fallos reales). 30 s da holgura suficiente sin ocultar
// cuelgues verdaderos.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
