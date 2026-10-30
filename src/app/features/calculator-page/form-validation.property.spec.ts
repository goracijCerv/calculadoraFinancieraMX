// Property tests de validación del formulario de la calculadora (tarea 11.6).
//
// Cubren dos propiedades del diseño:
//
// - Property 17: El cálculo se bloquea mientras el formulario es inválido
//   (Req 4.4). Para todo estado del formulario del `CalculatorPageComponent`,
//   `calculationBlocked()` es verdadero si y solo si el Reactive Form es
//   inválido; nunca se habilita el cálculo con un error de validación presente.
//
// - Property 18: Validación de orden de fechas (Req 4.2). Para todo par de
//   fechas ISO (inicio, fin), el validador cruzado `endDateNotBeforeStartDate`
//   emite `{ endBeforeStart: true }` si y solo si `fin < inicio`, y `null`
//   cuando falta cualquiera de las dos fechas.
//
// Se usa fast-check con ≥100 iteraciones, según el estándar de pruebas de
// propiedad del proyecto. Las pruebas no modifican código de producción:
// consumen `endDateNotBeforeStartDate` y `FINIQUITO_CONFIG` tal como se exportan
// y construyen el componente con `provideFiscalConstants`.

import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import fc from 'fast-check';

import { provideFiscalConstants } from '../../core/constants/fiscal-constants.token';
import { CalculatorPageComponent } from './calculator-page.component';
import {
  endDateNotBeforeStartDate,
  FINIQUITO_CONFIG,
} from './finiquito.config';
import type { FiniquitoInput } from '../../core/calculation/finiquito.calculation';

// ── Generadores ─────────────────────────────────────────────────────────────

/**
 * Fecha ISO "YYYY-MM-DD" arbitraria dentro de un rango acotado pero amplio.
 * El orden lexicográfico de estas cadenas de longitud fija coincide con el
 * cronológico, que es la invariante sobre la que opera el validador cruzado.
 */
const isoDateArb: fc.Arbitrary<string> = fc
  .date({
    min: new Date('1970-01-01T00:00:00.000Z'),
    max: new Date('2100-12-31T00:00:00.000Z'),
    noInvalidDate: true,
  })
  .map((d) => d.toISOString().slice(0, 10));

/** Par de fechas ISO (inicio, fin) independientes. */
const datePairArb: fc.Arbitrary<readonly [string, string]> = fc.tuple(
  isoDateArb,
  isoDateArb,
);

/**
 * Construye el `FormGroup` con `startDate`/`endDate` que espera el validador
 * cruzado. `start`/`end` pueden ser cadenas vacías para cubrir el caso de
 * fecha faltante.
 */
function dateGroup(start: string, end: string): FormGroup {
  return new FormGroup({
    startDate: new FormControl(start),
    endDate: new FormControl(end),
  });
}

// ── Property 18: Validación de orden de fechas (Req 4.2) ──────────────────────

describe('Feature: calcula-facil, Property 18: Validación de orden de fechas', () => {
  it('(a) marca { endBeforeStart: true } si y solo si fin < inicio (pares arbitrarios)', () => {
    fc.assert(
      fc.property(datePairArb, ([start, end]) => {
        const result = endDateNotBeforeStartDate(dateGroup(start, end));
        // El orden lexicográfico de las cadenas ISO coincide con el cronológico.
        if (end < start) {
          expect(result).toEqual({ endBeforeStart: true });
        } else {
          expect(result).toBeNull();
        }
      }),
      { numRuns: 100 },
    );
  });

  it('(b) fin estrictamente anterior a inicio siempre marca error', () => {
    const orderedPairArb = datePairArb
      .map(([a, b]) => (a <= b ? ([a, b] as const) : ([b, a] as const)))
      .filter(([a, b]) => a < b);
    fc.assert(
      fc.property(orderedPairArb, ([earlier, later]) => {
        // Invertidas: inicio = later, fin = earlier ⇒ fin < inicio.
        const result = endDateNotBeforeStartDate(dateGroup(later, earlier));
        expect(result).toEqual({ endBeforeStart: true });
      }),
      { numRuns: 100 },
    );
  });

  it('(c) fin igual o posterior a inicio nunca marca error de orden', () => {
    const orderedPairArb = datePairArb.map(([a, b]) =>
      a <= b ? ([a, b] as const) : ([b, a] as const),
    );
    fc.assert(
      fc.property(orderedPairArb, ([start, end]) => {
        // start <= end ⇒ no hay error de orden.
        expect(endDateNotBeforeStartDate(dateGroup(start, end))).toBeNull();
      }),
      { numRuns: 100 },
    );
  });

  it('(d) no marca error de orden si falta alguna fecha (lo exige `required`)', () => {
    fc.assert(
      fc.property(isoDateArb, fc.boolean(), (date, missingStart) => {
        const group = missingStart ? dateGroup('', date) : dateGroup(date, '');
        expect(endDateNotBeforeStartDate(group)).toBeNull();
      }),
      { numRuns: 100 },
    );
  });
});

// ── Property 17: El cálculo se bloquea mientras el formulario es inválido ─────

describe('Feature: calcula-facil, Property 17: El cálculo se bloquea mientras el formulario es inválido', () => {
  /**
   * Crea una instancia de `CalculatorPageComponent` configurada con
   * `FINIQUITO_CONFIG` y con las constantes fiscales del año vigente provistas
   * (Req 5.4). Se recrea por cada caso generado para aislar el estado del form.
   */
  function createComponent(): CalculatorPageComponent<FiniquitoInput> {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [CalculatorPageComponent],
      providers: [provideFiscalConstants()],
    });
    const fixture = TestBed.createComponent(
      CalculatorPageComponent<FiniquitoInput>,
    );
    fixture.componentRef.setInput('config', FINIQUITO_CONFIG);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  /**
   * Generador de valores de formulario que mezcla campos válidos e inválidos.
   * Produce estados tanto válidos como inválidos para ejercitar ambos lados de
   * la invariante `calculationBlocked() === form.invalid`.
   */
  const formValueArb = fc.record({
    // Salario: válido (> 0) o inválido (≤ 0 o vacío).
    dailySalaryOrMonthly: fc.oneof(
      fc.double({ min: 0.01, max: 100_000, noNaN: true, noDefaultInfinity: true }),
      fc.constantFrom(0, -1, -500, ''),
    ),
    // Fechas: ISO válidas o vacías (campo obligatorio faltante).
    startDate: fc.oneof(isoDateArb, fc.constant('')),
    endDate: fc.oneof(isoDateArb, fc.constant('')),
    // Días pendientes: entero ≥ 0 válido o inválido (negativo/vacío).
    pendingVacationDays: fc.oneof(
      fc.integer({ min: 0, max: 365 }),
      fc.constantFrom(-1, -10, ''),
    ),
    // Booleano: siempre válido.
    aguinaldoProportional: fc.boolean(),
  });

  it('(a) calculationBlocked() es verdadero si y solo si el formulario es inválido (estados arbitrarios)', () => {
    fc.assert(
      fc.property(formValueArb, (values) => {
        const component = createComponent();
        const form = component.form();
        form.setValue(values);
        form.updateValueAndValidity();

        // Invariante de bloqueo (Req 4.4): el cálculo se bloquea exactamente
        // cuando el formulario es inválido.
        expect(component.calculationBlocked()).toBe(form.invalid);
      }),
      { numRuns: 100 },
    );
  }, 20_000);

  it('(b) mientras existe un error de validación nunca se produce un resultado (Req 4.4)', () => {
    // Genera estados garantizados inválidos: al menos un campo obligatorio vacío
    // o un valor fuera de rango.
    const invalidValueArb = fc
      .record({
        dailySalaryOrMonthly: fc.oneof(
          fc.double({ min: 0.01, max: 100_000, noNaN: true, noDefaultInfinity: true }),
          fc.constantFrom(0, -1, ''),
        ),
        startDate: fc.oneof(isoDateArb, fc.constant('')),
        endDate: fc.oneof(isoDateArb, fc.constant('')),
        pendingVacationDays: fc.oneof(
          fc.integer({ min: 0, max: 365 }),
          fc.constantFrom(-1, ''),
        ),
        aguinaldoProportional: fc.boolean(),
      })
      .filter((v) => {
        const salaryInvalid = v.dailySalaryOrMonthly === '' || Number(v.dailySalaryOrMonthly) <= 0;
        const datesMissing = v.startDate === '' || v.endDate === '';
        const daysInvalid = v.pendingVacationDays === '' || Number(v.pendingVacationDays) < 0;
        const endBeforeStart =
          v.startDate !== '' && v.endDate !== '' && v.endDate < v.startDate;
        return salaryInvalid || datesMissing || daysInvalid || endBeforeStart;
      });

    fc.assert(
      fc.property(invalidValueArb, (values) => {
        const component = createComponent();
        component.form().setValue(values);
        component.form().updateValueAndValidity();

        // Intentar calcular con un formulario inválido no produce resultado.
        component.onSubmit();

        expect(component.calculationBlocked()).toBe(true);
        expect(component.showResult()).toBe(false);
        expect(component.currentResult()).toBeNull();
      }),
      { numRuns: 100 },
    );
  }, 20_000);

  it('(c) con todos los campos válidos el cálculo no se bloquea (Req 4.4)', () => {
    const validValueArb = fc
      .record({
        dailySalaryOrMonthly: fc.double({
          min: 0.01,
          max: 100_000,
          noNaN: true,
          noDefaultInfinity: true,
        }),
        startDate: isoDateArb,
        endDate: isoDateArb,
        pendingVacationDays: fc.integer({ min: 0, max: 365 }),
        aguinaldoProportional: fc.boolean(),
      })
      // Asegura fin ≥ inicio para no violar el validador cruzado (Req 4.2).
      .map((v) =>
        v.endDate < v.startDate
          ? { ...v, startDate: v.endDate, endDate: v.startDate }
          : v,
      );

    fc.assert(
      fc.property(validValueArb, (values) => {
        const component = createComponent();
        component.form().setValue(values);
        component.form().updateValueAndValidity();

        expect(component.form().valid).toBe(true);
        expect(component.calculationBlocked()).toBe(false);
      }),
      { numRuns: 100 },
    );
  }, 20_000);
});
