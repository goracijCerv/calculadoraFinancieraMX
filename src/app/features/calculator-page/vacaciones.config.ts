// CalculatorConfig de vacaciones y prima vacacional (tarea 15.1).
//
// Especializa la plantilla común `CalculatorPageComponent` para la calculadora
// de vacaciones y prima vacacional de la Fase 2 (Req 7.3, 7.5). Declara los
// campos del formulario, el copy de explicación en lenguaje simple (Req 3.4),
// el mapeo `toInput` de los valores crudos del formulario al DTO
// `VacacionesInput` y la metadata editorial (id, índice, fase).
//
// La función pura de cálculo y el DTO de entrada provienen de
// `core/calculation/vacaciones.calculation.ts` (tarea 15.1). La metadata (id,
// index, name, description, phase) se mantiene consistente con la entrada de
// vacaciones ya registrada en `CALCULATOR_REGISTRY` (tarea 7.1): esta config no
// duplica el registro, lo refleja (vacaciones, índice 4, fase 2).
//
// Diseño de referencia: design.md → "Plantilla común de calculadora" y Req 7.

import {
  calculateVacaciones,
  type VacacionesInput,
} from '../../core/calculation/vacaciones.calculation';
import type { CalculatorConfig } from './calculator-config';

/**
 * Configuración de la calculadora de vacaciones y prima vacacional.
 *
 * - `fields`: salario diario (moneda, requerido, > 0) y antigüedad en años
 *   completos (entero ≥ 0, requerido).
 * - `explanation`: resumen en lenguaje simple de los conceptos del desglose
 *   (Req 3.4), alineado con `docs/formulas.md` §5.
 * - `toInput`: traduce los valores crudos del formulario al `VacacionesInput`.
 * - `id`/`index`/`phase`: consistentes con `CALCULATOR_REGISTRY` (vacaciones,
 *   índice 4, fase 2) (Req 7.5).
 */
export const VACACIONES_CONFIG: CalculatorConfig<VacacionesInput> = {
  id: 'vacaciones',
  index: 4,
  name: 'Vacaciones y prima vacacional',
  description: 'Calcula los días de vacaciones y la prima vacacional que te corresponden.',
  phase: 2,
  resultLabel: 'Vacaciones y prima estimadas',
  explanation:
    'Según la reforma de Vacaciones Dignas (Art. 76 LFT), los días de vacaciones aumentan con tu ' +
    'antigüedad. El pago de vacaciones es tu salario diario por esos días, y la prima vacacional es, ' +
    'por ley, al menos el 25 % de ese pago (Art. 80 LFT). Tu patrón puede ofrecer más, pero nunca menos.',
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
      key: 'yearsOfService',
      label: 'Antigüedad (años completos)',
      type: 'integer',
      required: true,
      min: 0,
      initialValue: 1,
      helpText: 'Años completos que llevas en la empresa. Determina los días de vacaciones.',
    },
  ],
  toInput: (raw: Record<string, unknown>): VacacionesInput => ({
    dailySalary: Number(raw['dailySalary']),
    yearsOfService: Number(raw['yearsOfService']),
  }),
  calculate: calculateVacaciones,
};
