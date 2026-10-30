// CalculatorConfig de días de vacaciones (tarea 16.1).
//
// Especializa la plantilla común `CalculatorPageComponent` para la calculadora
// de días de vacaciones de la Fase 2 (Req 7.4, 7.5). Declara el campo del
// formulario, el copy de explicación en lenguaje simple (Req 3.4), el mapeo
// `toInput` de los valores crudos del formulario al DTO `DiasVacacionesInput` y
// la metadata editorial (id, índice, fase).
//
// La función pura de cálculo y el DTO de entrada provienen de
// `core/calculation/dias-vacaciones.calculation.ts` (tarea 16.1). La metadata
// (id, index, name, description, phase) se mantiene consistente con la entrada
// de días de vacaciones ya registrada en `CALCULATOR_REGISTRY` (tarea 7.1):
// esta config no duplica el registro, lo refleja (dias-vacaciones, índice 5,
// fase 2).
//
// Diseño de referencia: design.md → "Plantilla común de calculadora" y Req 7.

import {
  calculateDiasVacaciones,
  type DiasVacacionesInput,
} from '../../core/calculation/dias-vacaciones.calculation';
import type { CalculatorConfig } from './calculator-config';

/**
 * Configuración de la calculadora de días de vacaciones.
 *
 * - `fields`: antigüedad en años completos (entero ≥ 0, requerido).
 * - `explanation`: resumen en lenguaje simple del resultado (Req 3.4),
 *   alineado con `docs/formulas.md` §4.
 * - `toInput`: traduce los valores crudos del formulario al `DiasVacacionesInput`.
 * - `id`/`index`/`phase`: consistentes con `CALCULATOR_REGISTRY`
 *   (dias-vacaciones, índice 5, fase 2) (Req 7.5).
 */
export const DIAS_VACACIONES_CONFIG: CalculatorConfig<DiasVacacionesInput> = {
  id: 'dias-vacaciones',
  index: 5,
  name: 'Días de vacaciones',
  description:
    'Consulta los días de vacaciones según tu antigüedad conforme a la reforma de Vacaciones Dignas 2023.',
  phase: 2,
  resultLabel: 'Días de vacaciones',
  resultUnit: 'days',
  explanation:
    'Según la reforma de Vacaciones Dignas (Art. 76 LFT), los días de vacaciones aumentan con tu ' +
    'antigüedad: del primer al quinto año crecen 2 días por año, y a partir del sexto suman 2 días ' +
    'por cada 5 años de servicio. Este resultado son los días que te corresponden por ley; tu patrón ' +
    'puede otorgar más, pero nunca menos.',
  fields: [
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
  toInput: (raw: Record<string, unknown>): DiasVacacionesInput => ({
    yearsOfService: Number(raw['yearsOfService']),
  }),
  calculate: calculateDiasVacaciones,
};
