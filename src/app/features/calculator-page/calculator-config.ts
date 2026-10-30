// CalculatorConfig — configuración declarativa de una calculadora (tarea 11.4).
//
// Distingue a cada calculadora sin reimplementar la estructura de página: el
// `CalculatorPageComponent` construye su Reactive Form, orquesta el cálculo y
// renderiza el resultado a partir de esta configuración más la función pura de
// cálculo (`calculate`). Las calculadoras posteriores (finiquito en 11.5, y las
// de Fases 2 y 3) solo definen su `CalculatorConfig`, su función pura y su copy.
//
// Diseño de referencia: design.md → "Plantilla común de calculadora".

import type { ValidatorFn } from '@angular/forms';

import type { CalculationFn } from '../../core/calculation/calculation.types';
import type { FiscalConstants } from '../../core/constants/fiscal-constants.types';
import type { CalculatorPhase } from '../../core/registry/calculator-registry';

/**
 * Tipo de un campo del formulario de una calculadora.
 *
 * Determina el tipo de input nativo del `FormFieldComponent` y los validadores
 * por defecto que aplica el `CalculatorPageComponent`:
 * - `currency` / `number`: input numérico (decimales permitidos).
 * - `integer`: input numérico restringido a enteros.
 * - `date`: input de fecha ISO (Req 4.2).
 * - `select` / `period`: selección entre `options`.
 * - `boolean`: casilla (incluir/excluir un concepto).
 */
export type CalculatorFieldType =
  | 'currency'
  | 'date'
  | 'number'
  | 'integer'
  | 'select'
  | 'period'
  | 'boolean';

/** Opción de un campo `select`/`period`. */
export interface CalculatorFieldOption {
  /** Valor almacenado en el control del formulario. */
  readonly value: string;
  /** Etiqueta visible de la opción. */
  readonly label: string;
}

/**
 * Configuración declarativa de un campo del formulario de una calculadora
 * (Req 3.1, 4.1–4.3, 13.1).
 */
export interface CalculatorFieldConfig {
  /** Nombre del control dentro del Reactive Form. */
  readonly key: string;
  /** Etiqueta visible del campo (Req 3.1, 13.1). */
  readonly label: string;
  /** Tipo del campo; determina input y validadores por defecto. */
  readonly type: CalculatorFieldType;
  /** El campo es obligatorio (Req 4.3). */
  readonly required: boolean;
  /** Valor mínimo permitido para campos numéricos (Req 4.1, p.ej. > 0). */
  readonly min?: number;
  /** Valor máximo permitido para campos numéricos. */
  readonly max?: number;
  /** Texto de ayuda opcional, asociado por `aria-describedby`. */
  readonly helpText?: string;
  /** Valor inicial del control (p.ej. `false` para un booleano). */
  readonly initialValue?: string | number | boolean;
  /** Opciones para campos `select`/`period`. */
  readonly options?: readonly CalculatorFieldOption[];
}

/**
 * Configuración completa de una calculadora que especializa la plantilla común
 * (design.md → "Plantilla común de calculadora").
 *
 * @typeParam TInput DTO de entrada de la función pura de cálculo.
 */
export interface CalculatorConfig<TInput> {
  /** Slug de ruta (`calculadoras/:id`, p.ej. 'finiquito'). */
  readonly id: string;
  /** Numeración editorial (Req 9.5). */
  readonly index: number;
  /** Nombre para búsqueda y títulos (Req 2.2). */
  readonly name: string;
  /** Descripción usada por Search (Req 2.2) y como subtítulo de la página. */
  readonly description: string;
  /** Fase de entrega (Req 6.3, 7.5, 8.6). */
  readonly phase: CalculatorPhase;
  /** Campos del formulario (orden de render). */
  readonly fields: readonly CalculatorFieldConfig[];
  /** Explicación en lenguaje simple del resultado (Req 3.4). */
  readonly explanation: string;
  /** Etiqueta editorial del monto héroe (p.ej. "Finiquito estimado"). */
  readonly resultLabel?: string;
  /** Unidad del resultado: pesos (por defecto) o días (p. ej. días de vacaciones). */
  readonly resultUnit?: 'currency' | 'days';
  /** Nota breve sobre el criterio usado cuando la ley no lo precisa (se muestra con el resultado). */
  readonly criteriaNote?: string;
  /**
   * Mapea los valores crudos del formulario al DTO de entrada del cálculo.
   * Recibe el `Record` del `form.getRawValue()` y devuelve el `TInput`.
   */
  readonly toInput: (raw: Record<string, unknown>) => TInput;
  /** Función pura de cálculo (ver `calculation.types.ts`, Req 5.5). */
  readonly calculate: CalculationFn<TInput, FiscalConstants>;
  /** Validadores cruzados a nivel de grupo (p.ej. fin ≥ inicio) (Req 4.2). */
  readonly crossValidators?: readonly ValidatorFn[];
}
