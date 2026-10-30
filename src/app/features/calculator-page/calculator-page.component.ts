// CalculatorPageComponent — plantilla común de calculadora (tarea 11.4).
//
// Orquesta el flujo entrada → resultado → desglose → explicación → aviso legal
// → recibo → editar/recalcular (Req 3). La especialización de cada calculadora
// se inyecta mediante un `CalculatorConfig` (por `input`, de modo que la ruta
// lazy de la tarea 11.5 pueda proveerlo) más su función pura de cálculo.
//
// Responsabilidades (design.md → "Plantilla común de calculadora"):
// 1. Construye un Reactive Form a partir de `config.fields` con validadores por
//    campo (required/min/max/type) y `crossValidators` a nivel de grupo.
// 2. Bloquea el cálculo mientras el formulario es inválido (Req 4.4) y muestra
//    los mensajes por campo (Req 4.1–4.3) vía `FormFieldComponent`.
// 3. Al enviar datos válidos invoca `config.calculate(config.toInput(raw),
//    constants)` y renderiza héroe (Req 3.2), desglose (Req 3.3), explicación
//    (Req 3.4), aviso legal (Req 3.5) y recibo con folio/fecha generados aquí
//    (Req 3.7).
// 4. "Editar datos" vuelve al formulario preservando los valores (Req 3.6).
// 5. Traduce un `CalculationError` a `ErrorStateComponent` con reintento (Req 12.2).

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  type ValidatorFn,
} from '@angular/forms';

import {
  CalculationError,
  type CalculationResult,
} from '../../core/calculation/calculation.types';
import {
  FISCAL_CONSTANTS,
} from '../../core/constants/fiscal-constants.token';
import { ButtonComponent } from '../../shared/design-system/button/button.component';
import { BreakdownListComponent } from '../../shared/design-system/breakdown-list';
import { ErrorStateComponent } from '../../shared/design-system/error-state';
import { FiscalYearBannerComponent } from '../../shared/design-system/fiscal-year-banner';
import { FormFieldComponent } from '../../shared/design-system/form-field/form-field.component';
import { HeroResultComponent } from '../../shared/design-system/hero-result';
import { LegalNoticeComponent } from '../../shared/design-system/legal-notice';
import { ReceiptDetailComponent } from '../../shared/design-system/receipt-detail';
import type {
  CalculatorConfig,
  CalculatorFieldConfig,
} from './calculator-config';
import { generateFolio, type ReceiptMeta } from './receipt-meta';

/** Vista activa de la página: el formulario de entrada o el resultado. */
type PageView = 'form' | 'result';

/** Tipo del input nativo que usa `FormFieldComponent` para un campo. */
type NativeFieldType = 'text' | 'number' | 'date';

@Component({
  selector: 'app-calculator-page',
  imports: [
    ReactiveFormsModule,
    FormFieldComponent,
    ButtonComponent,
    HeroResultComponent,
    BreakdownListComponent,
    LegalNoticeComponent,
    ReceiptDetailComponent,
    ErrorStateComponent,
    FiscalYearBannerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './calculator-page.html',
  styleUrl: './calculator-page.scss',
})
export class CalculatorPageComponent<TInput = unknown> {
  /** Constantes fiscales del año vigente (Constants_Module, Req 5.4). */
  private readonly constants = inject(FISCAL_CONSTANTS);

  /**
   * Año actual observado, leído aquí (presentación) para preservar la pureza
   * del `Staleness_Check`. Se pasa al `FiscalYearBannerComponent` junto al
   * resultado para mostrar el aviso de desfase mientras `isStale` sea `true`
   * (Req 17.3), sin que la lógica de desfase lea `Date`.
   */
  protected readonly currentYear = new Date().getFullYear();

  /**
   * Configuración de la calculadora. Se provee por `input` para que la ruta
   * lazy de la tarea 11.5 pueda pasar el `CalculatorConfig` concreto.
   */
  readonly config = input.required<CalculatorConfig<TInput>>();

  /**
   * Reactive Form derivado de `config.fields` (Req 4.1–4.4). `computed` lo
   * memoiza por identidad de `config`: la misma config devuelve siempre la
   * misma instancia, de modo que los valores del usuario se preservan entre
   * renders y al editar/recalcular (Req 3.6). No escribe signals (apto para
   * leerse desde el template).
   */
  readonly form = computed<FormGroup>(() => this.buildForm(this.config()));

  /**
   * Estado de validez del formulario como signal, alimentado por
   * `statusChanges`, para que `calculationBlocked` reaccione a los cambios de
   * validez (el estado de un `FormGroup` no es, por sí mismo, un signal). La
   * escritura ocurre en un `effect`/suscripción, nunca durante el render.
   */
  private readonly formValid = signal<boolean>(false);

  constructor() {
    // Mantiene `formValid` en sincronía con la validez del form vigente. El
    // `effect` reacciona a cambios de `config` (nueva instancia de form) y la
    // suscripción a `statusChanges`, a cada edición del usuario (Req 4.4).
    effect((onCleanup) => {
      const form = this.form();
      this.formValid.set(form.valid);
      const sub = form.statusChanges.subscribe(() => this.formValid.set(form.valid));
      onCleanup(() => sub.unsubscribe());
    });
  }

  /** Vista activa (formulario o resultado) (Req 3.6). */
  private readonly view = signal<PageView>('form');
  /** Resultado del último cálculo válido (Req 3.2, 3.3). */
  private readonly result = signal<CalculationResult | null>(null);
  /** Metadatos del recibo del resultado mostrado (Req 3.7). */
  private readonly receipt = signal<ReceiptMeta | null>(null);
  /** Mensaje del último error de cálculo (Req 12.2). */
  private readonly errorMessage = signal<string | null>(null);

  /** Se muestra el resultado (hay cálculo y no hay error). */
  readonly showResult = computed(
    () => this.view() === 'result' && this.result() !== null && this.errorMessage() === null,
  );
  /** Se muestra el estado de error (Req 12.2). */
  readonly showError = computed(() => this.errorMessage() !== null);
  /** Se muestra el formulario de entrada. */
  readonly showForm = computed(() => !this.showResult() && !this.showError());

  /** Resultado actual (para el template). */
  readonly currentResult = this.result.asReadonly();
  /** Recibo actual (para el template). */
  readonly currentReceipt = this.receipt.asReadonly();
  /** Mensaje de error actual (para el template). */
  readonly currentError = this.errorMessage.asReadonly();

  /** Etiqueta del monto héroe (config o un valor por defecto, Req 3.2). */
  readonly resultLabel = computed(() => this.config().resultLabel ?? 'Total');

  /** Unidad del resultado: pesos por defecto o días. */
  readonly resultUnit = computed(() => this.config().resultUnit ?? 'currency');

  /**
   * Construye el Reactive Form con validadores por campo y a nivel de grupo.
   * Pura respecto al `config` dado: no depende de estado externo.
   */
  private buildForm(config: CalculatorConfig<TInput>): FormGroup {
    const controls: Record<string, FormControl> = {};
    for (const field of config.fields) {
      controls[field.key] = new FormControl(this.initialValueFor(field), {
        validators: this.validatorsFor(field),
        nonNullable: true,
      });
    }
    const groupValidators = (config.crossValidators ?? []) as ValidatorFn[];
    return new FormGroup(controls, { validators: groupValidators });
  }

  /** Valor inicial del control de un campo. */
  private initialValueFor(field: CalculatorFieldConfig): string | number | boolean {
    if (field.initialValue !== undefined) {
      return field.initialValue;
    }
    return field.type === 'boolean' ? false : '';
  }

  /** Validadores por campo derivados de `required`/`min`/`max`/`type` (Req 4.1–4.3). */
  private validatorsFor(field: CalculatorFieldConfig): ValidatorFn[] {
    const validators: ValidatorFn[] = [];
    if (field.required && field.type !== 'boolean') {
      validators.push(Validators.required);
    }
    if (field.min !== undefined) {
      validators.push(Validators.min(field.min));
    }
    if (field.max !== undefined) {
      validators.push(Validators.max(field.max));
    }
    return validators;
  }

  /** El campo se renderiza como un `<select>` nativo (Req 3.1, 8.4). */
  isSelect(field: CalculatorFieldConfig): boolean {
    return field.type === 'select' || field.type === 'period';
  }

  /** Id estable del `<select>` de un campo (destino del `for` de su etiqueta). */
  selectId(field: CalculatorFieldConfig): string {
    return `calc-select-${field.key}`;
  }

  /** Tipo de input nativo del `FormFieldComponent` para un campo. */
  nativeType(field: CalculatorFieldConfig): NativeFieldType {
    switch (field.type) {
      case 'date':
        return 'date';
      case 'currency':
      case 'number':
      case 'integer':
        return 'number';
      default:
        return 'text';
    }
  }

  /**
   * Mensaje de error visible de un campo, cuando está tocado o se intentó
   * enviar (Req 4.1–4.3). Devuelve cadena vacía si no hay error que mostrar.
   */
  fieldError(field: CalculatorFieldConfig): string {
    const control = this.form().get(field.key);
    if (!control || control.valid || !(control.touched || control.dirty)) {
      return '';
    }
    const errors = control.errors ?? {};
    if (errors['required']) {
      return `${field.label} es obligatorio.`;
    }
    if (errors['min']) {
      return `${field.label} debe ser mayor o igual a ${field.min}.`;
    }
    if (errors['max']) {
      return `${field.label} debe ser menor o igual a ${field.max}.`;
    }
    return `${field.label} no es válido.`;
  }

  /** El cálculo está bloqueado mientras el formulario es inválido (Req 4.4). */
  readonly calculationBlocked = computed(() => !this.formValid());

  /**
   * Procesa el envío del formulario (Req 3.2–3.7, 4.4, 12.2).
   *
   * Si el formulario es inválido, marca los controles como tocados para mostrar
   * los errores y no calcula (Req 4.4). Si es válido, invoca la función pura y
   * genera el recibo; traduce un `CalculationError` a estado de error (Req 12.2).
   */
  onSubmit(): void {
    const form = this.form();
    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }

    const config = this.config();
    const raw = form.getRawValue() as Record<string, unknown>;
    try {
      const result = config.calculate(config.toInput(raw), this.constants);
      this.result.set(result);
      this.receipt.set(this.buildReceipt(config.id));
      this.errorMessage.set(null);
      this.view.set('result');
    } catch (error) {
      this.result.set(null);
      this.receipt.set(null);
      this.errorMessage.set(this.messageFor(error));
    }
  }

  /** Vuelve al formulario preservando los valores para recalcular (Req 3.6). */
  onEdit(): void {
    this.errorMessage.set(null);
    this.view.set('form');
  }

  /** Reintenta tras un error: vuelve al formulario sin perder los datos (Req 12.2). */
  onRetry(): void {
    this.errorMessage.set(null);
    this.view.set('form');
  }

  /**
   * Genera los metadatos del recibo (folio + fecha) en la presentación
   * (Req 3.7). La fecha es el instante actual y el folio deriva de ella y de
   * una semilla aleatoria; ninguno afecta el importe calculado (Req 5.5).
   */
  private buildReceipt(id: string): ReceiptMeta {
    const date = new Date();
    const folio = generateFolio(id.toUpperCase(), date, Math.random());
    return { folio, date };
  }

  /** Traduce un error de cálculo a un mensaje para el usuario (Req 12.2). */
  private messageFor(error: unknown): string {
    if (error instanceof CalculationError) {
      return error.message;
    }
    return 'Ocurrió un error inesperado al calcular el resultado.';
  }
}
