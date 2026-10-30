// Property test de precedencia del tema inicial (tarea 4.3).
//
// Feature: calcula-facil, Property 21: Precedencia del tema inicial
// Validates: Requirements 10.4, 10.5
//
// Para toda combinación de preferencia almacenada en `localStorage` y
// preferencia del sistema (`prefers-color-scheme`), `resolveInitial()` devuelve
// la preferencia almacenada cuando existe (Req 10.4) y, en su ausencia, la del
// sistema indicada por `prefers-color-scheme` (Req 10.5).
import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import fc from 'fast-check';

import {
  THEME_STORAGE_KEY,
  ThemeManagerService,
  type ThemeMode,
} from './theme-manager.service';

/**
 * Valor crudo que puede encontrarse bajo la clave de tema en `localStorage`:
 * una preferencia válida, ausencia de valor (`null`) o un valor corrupto que el
 * servicio debe ignorar como si no existiera preferencia almacenada.
 */
type StoredRaw = ThemeMode | null | string;

interface Scenario {
  /** Valor crudo presente en el almacenamiento (o `null` si no hay). */
  readonly stored: StoredRaw;
  /** Preferencia del sistema reportada por `prefers-color-scheme: dark`. */
  readonly systemPrefersDark: boolean;
}

/** `true` si el valor crudo almacenado es una preferencia de tema válida. */
function isValidStored(value: StoredRaw): value is ThemeMode {
  return value === 'light' || value === 'dark';
}

/**
 * Construye un doble de `DOCUMENT` configurable: expone un `defaultView` con un
 * `localStorage` sembrado con `stored` y un `matchMedia` que responde según
 * `systemPrefersDark`, además de un `documentElement` capaz de recibir
 * `data-theme`. Así el servicio se ejercita de forma determinista variando la
 * preferencia almacenada y la del sistema en cada caso generado.
 */
function makeDocument(scenario: Scenario): Document {
  const store = new Map<string, string>();
  if (scenario.stored !== null) {
    store.set(THEME_STORAGE_KEY, scenario.stored);
  }

  const localStorage = {
    getItem: (key: string): string | null => store.get(key) ?? null,
    setItem: (key: string, value: string): void => {
      store.set(key, value);
    },
    removeItem: (key: string): void => {
      store.delete(key);
    },
    clear: (): void => {
      store.clear();
    },
    key: (index: number): string | null => [...store.keys()][index] ?? null,
    get length(): number {
      return store.size;
    },
  } as Storage;

  const matchMedia = (query: string): MediaQueryList =>
    ({
      matches:
        query === '(prefers-color-scheme: dark)'
          ? scenario.systemPrefersDark
          : false,
      media: query,
    }) as MediaQueryList;

  const attributes = new Map<string, string>();
  const documentElement = {
    setAttribute: (name: string, value: string): void => {
      attributes.set(name, value);
    },
    getAttribute: (name: string): string | null => attributes.get(name) ?? null,
  };

  return {
    defaultView: { localStorage, matchMedia },
    documentElement,
  } as unknown as Document;
}

/** Crea el servicio bajo el escenario dado con un `DOCUMENT` controlado. */
function serviceFor(scenario: Scenario): ThemeManagerService {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [{ provide: DOCUMENT, useValue: makeDocument(scenario) }],
  });
  return TestBed.inject(ThemeManagerService);
}

describe('ThemeManagerService — precedencia del tema inicial (Property 21)', () => {
  const storedArb: fc.Arbitrary<StoredRaw> = fc.oneof(
    fc.constant<StoredRaw>('light'),
    fc.constant<StoredRaw>('dark'),
    fc.constant<StoredRaw>(null),
    // Valores corruptos: deben tratarse como "sin preferencia almacenada".
    fc.string().filter((s) => s !== 'light' && s !== 'dark'),
  );

  it('localStorage tiene prioridad sobre prefers-color-scheme (Req 10.4)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<ThemeMode>('light', 'dark'),
        fc.boolean(),
        (stored, systemPrefersDark) => {
          const service = serviceFor({ stored, systemPrefersDark });
          // Con una preferencia almacenada válida, se devuelve esa sin importar
          // lo que indique `prefers-color-scheme`.
          expect(service.resolveInitial()).toBe(stored);
        },
      ),
      { numRuns: 200 },
    );
  });

  it('sin preferencia almacenada usa prefers-color-scheme (Req 10.5)', () => {
    fc.assert(
      fc.property(fc.boolean(), (systemPrefersDark) => {
        const service = serviceFor({ stored: null, systemPrefersDark });
        expect(service.resolveInitial()).toBe(
          systemPrefersDark ? 'dark' : 'light',
        );
      }),
      { numRuns: 200 },
    );
  });

  it('respeta la precedencia 10.4 → 10.5 para cualquier combinación', () => {
    fc.assert(
      fc.property(storedArb, fc.boolean(), (stored, systemPrefersDark) => {
        const service = serviceFor({ stored, systemPrefersDark });
        const expected: ThemeMode = isValidStored(stored)
          ? stored
          : systemPrefersDark
            ? 'dark'
            : 'light';
        expect(service.resolveInitial()).toBe(expected);
      }),
      { numRuns: 200 },
    );
  });
});
