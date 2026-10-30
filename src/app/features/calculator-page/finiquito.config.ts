// CalculatorConfig de finiquito (tarea 11.5).
//
// Especializa la plantilla común `CalculatorPageComponent` para la calculadora
// de finiquito de la Fase 1 (Req 6.1, 6.3). Declara los campos del formulario,
// el copy de explicación en lenguaje simple (Req 3.4), el mapeo `toInput` de los
// valores crudos del formulario al DTO `FiniquitoInput`, los validadores
// cruzados (fin ≥ inicio, Req 4.2) y la metadata editorial (id, índice, fase).
//
// La función pura de cálculo y el DTO de entrada provienen de
// `core/calculation/finiquito.calculation.ts` (tarea 11.1). La metadata (id,
// index, name, description, phase) se mantiene consistente con la entrada de
// finiquito ya registrada en `CALCULATOR_REGISTRY` (tarea 7.1): esta config no
// duplica el registro, lo refleja.
//
// Diseño de referencia: design.md → "Plantilla común de calculadora" y Req 6.

import type { AbstractControl, ValidatorFn } from '@angular/forms';

import {
  calculateFiniquito,
  type FiniquitoInput,
} from '../../core/calculation/finiquito.calculation';
import type { CalculatorConfig } from './calculator-config';

/**
 * Validador cruzado: la fecha de fin no puede ser anterior a la de inicio
 * (Req 4.2). Opera a nivel de grupo para comparar `startDate` y `endDate`.
 *
 * Compara las cadenas ISO "YYYY-MM-DD" directamente: por ser de longitud fija y
 * de mayor a menor significancia, su orden lexicográfico coincide con el
 * cronológico, de modo que no se necesita `Date` (se preserva el determinismo).
 * Si falta alguna de las dos fechas, no emite error de orden: los validadores
 * `required` por campo son los responsables de exigir su presencia.
 */
export const endDateNotBeforeStartDate: ValidatorFn = (
  group: AbstractControl,
): Record<string, true> | null => {
  const start = group.get('startDate')?.value;
  const end = group.get('endDate')?.value;
  if (!start || !end) {
    return null;
  }
  return end < start ? { endBeforeStart: true } : null;
};

/**
 * Configuración de la calculadora de finiquito.
 *
 * - `fields`: salario diario (moneda, requerido, > 0), fecha de inicio y de fin
 *   (fecha, requeridas, Req 4.2), días pendientes (entero ≥ 0, requerido) y
 *   aguinaldo proporcional (casilla para incluir/excluir el concepto).
 * - `explanation`: resumen en lenguaje simple de los conceptos del desglose
 *   (Req 3.4), alineado con `docs/formulas.md` §7.
 * - `toInput`: traduce los valores crudos del formulario al `FiniquitoInput`.
 * - `crossValidators`: `endDateNotBeforeStartDate` (fin ≥ inicio, Req 4.2).
 * - `id`/`index`/`phase`: consistentes con `CALCULATOR_REGISTRY` (finiquito,
 *   índice 1, fase 1) (Req 6.3).
 */
export const FINIQUITO_CONFIG: CalculatorConfig<FiniquitoInput> = {
  id: 'finiquito',
  index: 1,
  name: 'Finiquito',
  description:
    'Calcula tu finiquito con las partes proporcionales de aguinaldo, vacaciones, prima vacacional y días pendientes.',
  phase: 1,
  resultLabel: 'Finiquito estimado',
  explanation:
    'El finiquito reúne las partes que ya devengaste y aún no te pagan al terminar la relación laboral: ' +
    'la parte proporcional del aguinaldo, las vacaciones proporcionales con su prima vacacional del 25 % ' +
    'y los días de salario que quedaron pendientes. No incluye indemnización por despido; eso corresponde ' +
    'a la liquidación. El aguinaldo se calcula sobre los días trabajados en el año calendario; las vacaciones y su prima, sobre el año de servicio en curso.',
  criteriaNote:
    'Criterio usado: las vacaciones y su prima se calculan con los días del año de servicio que llevas en curso ' +
    '(si aún no cumples un año, los 12 del primero), proporcionales a los días trabajados desde tu último ' +
    'aniversario. La ley (Art. 79 LFT) ordena pagar la parte proporcional, pero no precisa qué año de la tabla ' +
    'aplicar; este es el criterio de la práctica. El aguinaldo se prorratea por los días trabajados del año ' +
    'calendario (Art. 87 LFT).',
  fields: [
    {
      key: 'dailySalaryOrMonthly',
      label: 'Salario diario',
      type: 'currency',
      required: true,
      min: 0.01,
      helpText: 'Tu salario por día. No puede ser menor al salario mínimo vigente.',
    },
    {
      key: 'startDate',
      label: 'Fecha de inicio',
      type: 'date',
      required: true,
      helpText: 'Día en que comenzó la relación laboral.',
    },
    {
      key: 'endDate',
      label: 'Fecha de fin',
      type: 'date',
      required: true,
      helpText: 'Día en que terminó la relación laboral (no puede ser anterior al inicio).',
    },
    {
      key: 'pendingVacationDays',
      label: 'Días pendientes de pago',
      type: 'integer',
      required: true,
      min: 0,
      initialValue: 0,
      helpText: 'Días de salario o vacaciones que aún no te han pagado.',
    },
    {
      key: 'aguinaldoProportional',
      label: 'Incluir aguinaldo proporcional',
      type: 'boolean',
      required: false,
      initialValue: true,
    },
  ],
  toInput: (raw: Record<string, unknown>): FiniquitoInput => ({
    dailySalaryOrMonthly: Number(raw['dailySalaryOrMonthly']),
    startDate: String(raw['startDate'] ?? ''),
    endDate: String(raw['endDate'] ?? ''),
    pendingVacationDays: Number(raw['pendingVacationDays']),
    aguinaldoProportional: Boolean(raw['aguinaldoProportional']),
  }),
  calculate: calculateFiniquito,
  crossValidators: [endDateNotBeforeStartDate],
};
