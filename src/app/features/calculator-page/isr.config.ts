// CalculatorConfig de ISR mensual (tarea 18.1).
//
// Especializa la plantilla común `CalculatorPageComponent` para la calculadora
// de ISR mensual de la Fase 3 (Req 8.1, 8.6). Declara los campos del formulario,
// el copy de explicación en lenguaje simple (Req 3.4), el mapeo `toInput` de los
// valores crudos del formulario al DTO `IsrInput` y la metadata editorial
// (id, índice, fase).
//
// La función pura de cálculo y el DTO de entrada provienen de
// `core/calculation/isr.calculation.ts` (tarea 18.1). La metadata (id, index,
// name, description, phase) se mantiene consistente con la entrada de ISR ya
// registrada en `CALCULATOR_REGISTRY` (tarea 7.1): esta config no duplica el
// registro, lo refleja (isr, índice 6, fase 3).
//
// Diseño de referencia: design.md → "Plantilla común de calculadora" y Req 8.

import { calculateIsr, type IsrInput } from '../../core/calculation/isr.calculation';
import type { CalculatorConfig } from './calculator-config';

/**
 * Configuración de la calculadora de ISR mensual.
 *
 * - `fields`: ingreso gravable mensual (moneda, requerido, ≥ 0).
 * - `explanation`: resumen en lenguaje simple del ISR y del subsidio al empleo
 *   (Req 3.4), alineado con `docs/formulas.md` §3 (Art. 96 LISR, Anexo 8 RMF).
 * - `toInput`: traduce los valores crudos del formulario al `IsrInput`.
 * - `id`/`index`/`phase`: consistentes con `CALCULATOR_REGISTRY` (isr, índice 6,
 *   fase 3) (Req 8.6).
 */
export const ISR_CONFIG: CalculatorConfig<IsrInput> = {
  id: 'isr',
  index: 6,
  name: 'ISR mensual',
  description:
    'Calcula el ISR mensual con la tabla del SAT y el subsidio al empleo cuando corresponda.',
  phase: 3,
  resultLabel: 'ISR mensual estimado',
  explanation:
    'El ISR mensual se calcula con la tarifa del Artículo 96 de la Ley del ISR (tabla del SAT): se ' +
    'ubica el tramo donde cae tu ingreso gravable y se suma la cuota fija del tramo más el porcentaje ' +
    'aplicable al excedente. Cuando tu ingreso no rebasa el tope de ley, se resta el subsidio al ' +
    'empleo (una cantidad fija mensual), sin que el impuesto a retener llegue a ser negativo.',
  fields: [
    {
      key: 'monthlyIncome',
      label: 'Ingreso gravable mensual',
      type: 'currency',
      required: true,
      min: 0,
      helpText: 'Tu ingreso gravable del mes, en pesos.',
    },
  ],
  toInput: (raw: Record<string, unknown>): IsrInput => ({
    monthlyIncome: Number(raw['monthlyIncome']),
  }),
  calculate: calculateIsr,
};
