// Property test de persistencia del tema (tarea 4.2).
//
// Feature: calcula-facil, Property 20: Round trip de persistencia del tema.
//
// Para todo modo de tema en {light, dark}, aplicarlo mediante `setMode` y luego
// leer la preferencia almacenada en localStorage devuelve el mismo modo.
//
// Validates: Requirements 10.3

import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import fc from 'fast-check';

import {
  THEME_STORAGE_KEY,
  ThemeManagerService,
  type ThemeMode,
} from './theme-manager.service';

/**
 * Doble de `localStorage` en memoria: determinista y sin dependencias del
 * entorno del navegador, de modo que la propiedad pueda ejercitarse de forma
 * reproducible.
 */
function createStorageDouble(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key: string) => (map.has(key) ? (map.get(key) as string) : null),
    key: (index: number) => Array.from(map.keys())[index] ?? null,
    removeItem: (key: string) => void map.delete(key),
    setItem: (key: string, value: string) => void map.set(key, String(value)),
  } satisfies Storage;
}

/**
 * Doble de `Document` mínimo que expone únicamente lo que usa el servicio: el
 * `documentElement` (para aplicar `data-theme`) y `defaultView.localStorage`.
 * Se mantiene un registro del `data-theme` aplicado para inspección.
 */
function createDocumentDouble(storage: Storage): Document {
  const rootAttributes = new Map<string, string>();
  const documentElement = {
    setAttribute: (name: string, value: string) => rootAttributes.set(name, value),
    getAttribute: (name: string) => rootAttributes.get(name) ?? null,
  };
  return {
    documentElement,
    defaultView: { localStorage: storage },
  } as unknown as Document;
}

describe('ThemeManagerService — persistencia del tema (Property 20)', () => {
  it('setMode seguido de leer la preferencia almacenada devuelve el mismo modo', () => {
    fc.assert(
      fc.property(fc.constantFrom<ThemeMode>('light', 'dark'), (mode) => {
        const storage = createStorageDouble();
        const doc = createDocumentDouble(storage);

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [{ provide: DOCUMENT, useValue: doc }],
        });

        const service = TestBed.inject(ThemeManagerService);

        service.setMode(mode);

        // Round trip: el valor persistido en localStorage coincide con el modo
        // aplicado (Req 10.3).
        expect(storage.getItem(THEME_STORAGE_KEY)).toBe(mode);
        // Y el servicio resuelve ese mismo modo a partir del almacenamiento.
        expect(service.resolveInitial()).toBe(mode);
      }),
      { numRuns: 100 },
    );
  });
});
