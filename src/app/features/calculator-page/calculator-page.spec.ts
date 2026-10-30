// Pruebas de ejemplo de CalculatorPageComponent (tarea 11.4).
// Cubren: construcción del form desde config, bloqueo del cálculo mientras es
// inválido (Req 4.4), render del resultado (héroe, desglose, explicación, aviso
// legal, recibo) al enviar datos válidos (Req 3.2–3.7), editar/recalcular
// preservando valores (Req 3.6) y traducción de CalculationError a estado de
// error con reintento (Req 12.2).

import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
  CalculationError,
  type CalculationResult,
} from '../../core/calculation/calculation.types';
import { FISCAL_CONSTANTS } from '../../core/constants/fiscal-constants.token';
import type { FiscalConstants } from '../../core/constants/fiscal-constants.types';
import { LEGAL_NOTICE_TEXT } from '../../shared/design-system/legal-notice';
import { CalculatorPageComponent } from './calculator-page.component';
import type { CalculatorConfig } from './calculator-config';

interface DemoInput {
  salario: number;
  dias: number;
}

/** Constantes fiscales mínimas para las pruebas (no se usan en el cálculo demo). */
const TEST_CONSTANTS: FiscalConstants = {
  fiscalYear: 2026,
  effectiveFrom: '2026-01-01',
  lastVerified: '2026-01-01',
  minimumDailyWage: 100,
  uma: 108,
  isrMonthlyTable: [],
  vacationDaysTable: [{ yearsOfService: 1, days: 12 }],
  sourceRefs: {},
};

/** Config de prueba: suma salario × días y expone un desglose de un concepto. */
function makeConfig(
  overrides: Partial<CalculatorConfig<DemoInput>> = {},
): CalculatorConfig<DemoInput> {
  return {
    id: 'demo',
    index: 1,
    name: 'Calculadora demo',
    description: 'Multiplica salario por días.',
    phase: 1,
    resultLabel: 'Total demo',
    explanation: 'Se multiplica el salario diario por los días trabajados.',
    fields: [
      { key: 'salario', label: 'Salario diario', type: 'currency', required: true, min: 1 },
      { key: 'dias', label: 'Días', type: 'integer', required: true, min: 0 },
    ],
    toInput: (raw) => ({ salario: Number(raw['salario']), dias: Number(raw['dias']) }),
    calculate: (input): CalculationResult => ({
      total: input.salario * input.dias,
      breakdown: [{ concept: 'Salario por días', amount: input.salario * input.dias }],
    }),
    ...overrides,
  };
}

describe('CalculatorPageComponent', () => {
  let fixture: ComponentFixture<CalculatorPageComponent<DemoInput>>;
  let component: CalculatorPageComponent<DemoInput>;

  async function setup(config: CalculatorConfig<DemoInput>): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [CalculatorPageComponent],
      providers: [{ provide: FISCAL_CONSTANTS, useValue: TEST_CONSTANTS }],
    }).compileComponents();

    fixture = TestBed.createComponent(
      CalculatorPageComponent<DemoInput>,
    ) as ComponentFixture<CalculatorPageComponent<DemoInput>>;
    component = fixture.componentInstance;
    fixture.componentRef.setInput('config', config);
    fixture.detectChanges();
    await fixture.whenStable();
  }

  const q = (selector: string): HTMLElement | null =>
    fixture.nativeElement.querySelector(selector);

  it('construye el formulario con un control por campo de la config', async () => {
    await setup(makeConfig());
    const form = component.form();
    expect(Object.keys(form.controls)).toEqual(['salario', 'dias']);
  });

  it('bloquea el cálculo mientras el formulario es inválido (Req 4.4)', async () => {
    await setup(makeConfig());
    expect(component.calculationBlocked()).toBe(true);
    const submit = q('button[type="submit"]') as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
  });

  it('habilita el cálculo cuando los datos son válidos (Req 4.4)', async () => {
    await setup(makeConfig());
    component.form().setValue({ salario: 500, dias: 10 });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.calculationBlocked()).toBe(false);
  });

  it('no calcula al enviar un formulario inválido y marca los campos como tocados (Req 4.4)', async () => {
    await setup(makeConfig());
    component.onSubmit();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.showResult()).toBe(false);
    expect(component.form().get('salario')?.touched).toBe(true);
  });

  it('renderiza héroe, desglose, explicación, aviso legal y recibo con datos válidos (Req 3.2-3.7)', async () => {
    await setup(makeConfig());
    component.form().setValue({ salario: 500, dias: 10 });
    component.onSubmit();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.showResult()).toBe(true);
    // Héroe (Req 3.2).
    expect(q('app-hero-result')).toBeTruthy();
    expect(q('.hero-result__amount')?.textContent).toContain('5,000');
    // Desglose (Req 3.3).
    expect(q('app-breakdown-list')).toBeTruthy();
    expect(q('.breakdown-list__concept')?.textContent).toContain('Salario por días');
    // Explicación (Req 3.4).
    expect(q('.calculator-page__explanation')?.textContent).toContain('salario diario');
    // Aviso legal exacto (Req 3.5).
    expect(fixture.nativeElement.textContent).toContain(LEGAL_NOTICE_TEXT);
    // Recibo con folio y fecha (Req 3.7).
    expect(q('app-receipt-detail')).toBeTruthy();
    const receipt = component.currentReceipt();
    expect(receipt?.folio.startsWith('DEMO-')).toBe(true);
    expect(receipt?.date).toBeInstanceOf(Date);
  });

  it('"Editar datos" vuelve al formulario preservando los valores (Req 3.6)', async () => {
    await setup(makeConfig());
    component.form().setValue({ salario: 500, dias: 10 });
    component.onSubmit();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.showResult()).toBe(true);

    component.onEdit();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.showForm()).toBe(true);
    expect(component.form().getRawValue()).toEqual({ salario: 500, dias: 10 });
  });

  it('traduce un CalculationError a ErrorStateComponent con reintento (Req 12.2)', async () => {
    const failing = makeConfig({
      calculate: () => {
        throw new CalculationError('INVALID_INPUT', 'salario', 'Salario fuera de rango.');
      },
    });
    await setup(failing);
    component.form().setValue({ salario: 500, dias: 10 });
    component.onSubmit();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.showError()).toBe(true);
    expect(q('app-error-state')).toBeTruthy();
    expect(q('.error-state__message')?.textContent).toContain('Salario fuera de rango.');

    // El reintento vuelve al formulario con los datos preservados (Req 12.2).
    component.onRetry();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.showForm()).toBe(true);
    expect(component.form().getRawValue()).toEqual({ salario: 500, dias: 10 });
  });

  it('muestra un mensaje de error por campo cuando el control es inválido y tocado (Req 4.1-4.3)', async () => {
    await setup(makeConfig());
    const control = component.form().get('salario');
    control?.markAsTouched();
    const field = component.config().fields[0];
    expect(component.fieldError(field)).toContain('obligatorio');
  });
});
