// CalculatorConfig de liquidación por despido (tarea 13.1).
//
// Especializa la plantilla común `CalculatorPageComponent` para la calculadora
// de liquidación por despido injustificado de la Fase 2 (Req 7.1, 7.5). Declara
// los campos del formulario, el copy de explicación en lenguaje simple (Req 3.4),
// el mapeo `toInput` de los valores crudos del formulario al DTO
// `LiquidacionInput` y la metadata editorial (id, índice, fase).
//
// La función pura de cálculo y el DTO de entrada provienen de
// `core/calculation/liquidacion.calculation.ts`. La metadata (id, index, name,
// description, phase) se mantiene consistente con la entrada de liquidación ya
// registrada en `CALCULATOR_REGISTRY` (tarea 7.1): esta config no duplica el
// registro, lo refleja (liquidacion, índice 2, fase 2).
//
// Diseño de referencia: design.md → "Plantilla común de calculadora" y Req 7.

import {
  calculateLiquidacion,
  type LiquidacionInput,
} from '../../core/calculation/liquidacion.calculation';
import type { CalculatorConfig } from './calculator-config';

/**
 * Configuración de la calculadora de liquidación por despido injustificado.
 *
 * - `fields`: salario diario (moneda, requerido, > 0) y años de servicio
 *   (entero ≥ 0, requerido).
 * - `explanation`: resumen en lenguaje simple de los tres componentes legales
 *   (Req 3.4), alineado con `docs/formulas.md` §8.
 * - `toInput`: traduce los valores crudos del formulario al `LiquidacionInput`.
 * - `id`/`index`/`phase`: consistentes con `CALCULATOR_REGISTRY` (liquidacion,
 *   índice 2, fase 2) (Req 7.5).
 */
export const LIQUIDACION_CONFIG: CalculatorConfig<LiquidacionInput> = {
  id: 'liquidacion',
  index: 2,
  name: 'Liquidación por despido',
  description:
    'Estima tu liquidación por despido injustificado: tres meses de indemnización, 20 días por año y prima de antigüedad.',
  phase: 2,
  resultLabel: 'Liquidación estimada',
  explanation:
    'La liquidación por despido injustificado reúne los tres componentes que marca la ley: ' +
    'la indemnización constitucional de 3 meses de salario (Art. 48), 20 días de salario por cada año ' +
    'de servicio (Art. 50) y la prima de antigüedad de 12 días por año (Art. 162), esta última con un ' +
    'tope de dos veces el salario mínimo. A diferencia del finiquito, estos conceptos proceden solo ' +
    'cuando el despido es injustificado; a esta indemnización se suman por separado las partes ' +
    'proporcionales del finiquito.',
  criteriaNote:
    'Criterio usado: solo se cuentan años de servicio completos. Un año parcial no suma 20 días de salario ni ' +
    'prima de antigüedad, y la ley (Arts. 50 y 162 LFT) no precisa cómo tratar las fracciones. Se usa el salario ' +
    'diario que capturas; si tu sueldo incluye prestaciones, la indemnización se calcula con el salario diario ' +
    'integrado.',
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
      label: 'Años de servicio',
      type: 'integer',
      required: true,
      min: 0,
      initialValue: 0,
      helpText: 'Años completos que trabajaste para el patrón.',
    },
  ],
  toInput: (raw: Record<string, unknown>): LiquidacionInput => ({
    dailySalary: Number(raw['dailySalary']),
    yearsOfService: Number(raw['yearsOfService']),
  }),
  calculate: calculateLiquidacion,
};
