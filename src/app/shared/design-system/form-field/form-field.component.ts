import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * `FormFieldComponent` — campo de formulario accesible del Design System.
 *
 * Responsabilidades (Req 3.1, 4.1–4.3, 13.1):
 * - Etiqueta visible asociada al input mediante `for`/`id`.
 * - Input de texto/número/fecha controlado.
 * - Texto de ayuda opcional.
 * - Mensaje de error opcional.
 * - El input queda descrito por la ayuda y el error vía `aria-describedby`,
 *   y marca `aria-invalid` cuando hay error.
 *
 * Implementa `ControlValueAccessor` para integrarse con Angular Reactive Forms
 * (lo usará `CalculatorPageComponent` en la tarea 11.4).
 *
 * SCSS puro + CSS custom properties; sin Material/PrimeNG (Req 9.2).
 */
let nextUniqueId = 0;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      multi: true,
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormFieldComponent),
    },
  ],
  selector: 'app-form-field',
  styleUrl: './form-field.component.scss',
  templateUrl: './form-field.component.html',
})
export class FormFieldComponent implements ControlValueAccessor {
  /** Etiqueta visible del campo (Req 3.1, 13.1). */
  readonly label = input.required<string>();

  /** Tipo de input nativo. */
  readonly type = input<'text' | 'number' | 'date'>('text');

  /** Texto de ayuda opcional, asociado por `aria-describedby`. */
  readonly helpText = input<string>('');

  /**
   * Mensaje de error opcional. Cuando está presente, se asocia por
   * `aria-describedby` y se marca `aria-invalid` (Req 4.1–4.3, 13.1).
   */
  readonly errorMessage = input<string>('');

  /** Marca el campo como obligatorio (Req 4.3). */
  readonly required = input<boolean>(false);

  /** Placeholder opcional del input. */
  readonly placeholder = input<string>('');

  /** Id base único para enlazar label, ayuda y error. */
  private readonly uid = `app-form-field-${nextUniqueId++}`;

  /** Id del input (destino del `for` de la etiqueta). */
  readonly inputId = `${this.uid}-input`;
  /** Id del texto de ayuda. */
  readonly helpId = `${this.uid}-help`;
  /** Id del mensaje de error. */
  readonly errorId = `${this.uid}-error`;

  /** Valor interno del input, gestionado por el ControlValueAccessor. */
  readonly value = signal<string>('');
  /** Estado deshabilitado propagado por el formulario. */
  readonly disabled = signal<boolean>(false);

  /** Hay ayuda visible. */
  readonly hasHelp = computed(() => this.helpText().trim().length > 0);
  /** Hay error visible. */
  readonly hasError = computed(() => this.errorMessage().trim().length > 0);

  /**
   * Valor de `aria-describedby`: referencia al error (cuando existe) y a la
   * ayuda (cuando existe). Devuelve `null` si no hay ninguno, para no emitir
   * un atributo vacío.
   */
  readonly describedBy = computed<string | null>(() => {
    const ids: string[] = [];
    if (this.hasError()) {
      ids.push(this.errorId);
    }
    if (this.hasHelp()) {
      ids.push(this.helpId);
    }
    return ids.length > 0 ? ids.join(' ') : null;
  });

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  /** Maneja la entrada del usuario y propaga el valor al formulario. */
  handleInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value.set(target.value);
    this.onChange(target.value);
  }

  /**
   * En campos de fecha abre el selector al hacer clic en cualquier parte del
   * input (por defecto el navegador solo lo abre desde el icono del calendario).
   * El teclado sigue funcionando: se puede teclear la fecha por segmentos.
   */
  handleClick(event: Event): void {
    if (this.type() !== 'date') {
      return;
    }
    const target = event.target as HTMLInputElement;
    try {
      target.showPicker?.();
    } catch {
      // showPicker puede lanzar si el navegador no lo permite en este momento;
      // el input nativo sigue siendo utilizable.
    }
  }

  /** Propaga el evento de "tocado" al formulario al perder el foco. */
  handleBlur(): void {
    this.onTouched();
  }
}
