// CalculatorConfig de aguinaldo (tarea 14.1).
//
// Especializa la plantilla común `CalculatorPageComponent` para la calculadora
// de aguinaldo de la Fase 2 (Req 7.2, 7.5). Declara los campos del formulario,
// el copy de explicación en lenguaje simple (Req 3.4), el mapeo `toInput` de los
// valores crudos del formulario al DTO `AguinaldoInput` y la metadata editorial
// (id, índice, fase).
//
// La función pura de cálculo y el DTO de entrada provienen de
// `core/calculation/aguinaldo.calculation.ts` (tarea 14.1). La metadata (id,
// index, name, description, phase) se mantiene consistente con la entrada de
// aguinaldo ya registrada en `CALCULATOR_REGISTRY` (tarea 7.1): esta config no
// duplica el registro, lo refleja (aguinaldo, índice 3, fase 2).
//
// Diseño de referencia: design.md → "Plantilla común de calculadora" y Req 7.

import {
  calculateAguinaldo,
  type AguinaldoInput,
} from '../../core/calculation/aguinaldo.calculation';
import type { CalculatorConfig } from './calculator-config';

/**
 * Configuración de la calculadora de aguinaldo.
 *
 * - `fields`: salario diario (moneda, requerido, > 0) y días trabajados en el
 *   año (entero 0..365, requerido; 365 = año completo).
 * - `explanation`: resumen en lenguaje simple del aguinaldo (Req 3.4), alineado
 *   con `docs/formulas.md` §6 (LFT Art. 87, mínimo 15 días).
 * - `toInput`: traduce los valores crudos del formulario al `AguinaldoInput`.
 * - `id`/`index`/`phase`: consistentes con `CALCULATOR_REGISTRY` (aguinaldo,
 *   índice 3, fase 2) (Req 7.5).
 */
export const AGUINALDO_CONFIG: CalculatorConfig<AguinaldoInput> = {
  id: 'aguinaldo',
  index: 3,
  name: 'Aguinaldo',
  description: 'Calcula tu aguinaldo anual con el mínimo de 15 días de salario que marca la LFT.',
  phase: 2,
  resultLabel: 'Aguinaldo estimado',
  explanation:
    'El aguinaldo es la gratificación anual que marca la Ley Federal del Trabajo: al menos 15 días ' +
    'de salario, pagaderos antes del 20 de diciembre. Si no cumpliste el año completo, recibes la ' +
    'parte proporcional a los días que trabajaste en el año. Un año completo equivale a los 15 días ' +
    'mínimos de ley; tu patrón puede otorgar más por contrato.',
  fields: [
    {
      key: 'dailySalary',
      label: 'Salario diario',
      type: 'currency',
      required: true,
      min: 0.01,
      helpText: 'Tu salario por día. No puede ser menor al salario mínimo vigente.',
    },
    {
      key: 'daysWorked',
      label: 'Días trabajados en el año',
      type: 'integer',
      required: true,
      min: 0,
      max: 365,
      initialValue: 365,
      helpText: 'Días que trabajaste en el año (365 si trabajaste el año completo).',
    },
  ],
  toInput: (raw: Record<string, unknown>): AguinaldoInput => ({
    dailySalary: Number(raw['dailySalary']),
    daysWorked: Number(raw['daysWorked']),
  }),
  calculate: calculateAguinaldo,
};
