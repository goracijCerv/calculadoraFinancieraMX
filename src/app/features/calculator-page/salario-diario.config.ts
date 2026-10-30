// CalculatorConfig de salario diario (tarea 20.1).
//
// Especializa la plantilla común `CalculatorPageComponent` para el conversor de
// salario diario de la Fase 3 (Req 8.4, 8.6). Declara los campos del formulario
// (monto + periodicidad), el copy de explicación en lenguaje simple (Req 3.4),
// el mapeo `toInput` de los valores crudos del formulario al DTO
// `SalarioDiarioInput` y la metadata editorial (id, índice, fase).
//
// La función pura de cálculo y el DTO de entrada provienen de
// `core/calculation/salario-diario.calculation.ts` (tarea 20.1). La metadata
// (id, index, name, description, phase) se mantiene consistente con la entrada
// de salario diario ya registrada en `CALCULATOR_REGISTRY` (tarea 7.1): esta
// config no duplica el registro, lo refleja (salario-diario, índice 8, fase 3).
//
// Diseño de referencia: design.md → "Plantilla común de calculadora" y Req 8.

import {
  calculateSalarioDiario,
  type SalarioDiarioInput,
  type SalarioPeriod,
} from '../../core/calculation/salario-diario.calculation';
import type { CalculatorConfig } from './calculator-config';

/**
 * Configuración de la calculadora de salario diario.
 *
 * - `fields`: monto del salario (moneda, requerido, > 0) y periodicidad de
 *   origen (selección entre semanal / quincenal / mensual; por defecto mensual).
 * - `explanation`: resumen en lenguaje simple de la conversión (Req 3.4),
 *   alineado con la convención de días documentada en la función pura (semanal
 *   /7, quincenal /15, mensual /30).
 * - `toInput`: traduce los valores crudos del formulario al `SalarioDiarioInput`.
 * - `id`/`index`/`phase`: consistentes con `CALCULATOR_REGISTRY` (salario-diario,
 *   índice 8, fase 3) (Req 8.6).
 */
export const SALARIO_DIARIO_CONFIG: CalculatorConfig<SalarioDiarioInput> = {
  id: 'salario-diario',
  index: 8,
  name: 'Salario diario',
  description: 'Convierte un salario de cualquier periodicidad a su equivalente diario.',
  phase: 3,
  resultLabel: 'Salario diario equivalente',
  explanation:
    'El salario diario es el sueldo expresado por día de trabajo. Para obtenerlo se divide tu salario ' +
    'entre los días del periodo: la semana entre 7, la quincena entre 15 y el mes entre 30. El divisor ' +
    'mensual de 30 (y por tanto 15 para la quincena) es la convención común del salario diario en México, ' +
    'derivada del mes comercial de 30 días que marca la Ley Federal del Trabajo (Art. 89).',
  fields: [
    {
      key: 'amount',
      label: 'Salario',
      type: 'currency',
      required: true,
      min: 0.01,
      helpText: 'El monto de tu salario en la periodicidad que elijas abajo.',
    },
    {
      key: 'period',
      label: 'Periodicidad',
      type: 'period',
      required: true,
      initialValue: 'monthly',
      helpText: 'Con qué frecuencia recibes ese salario.',
      options: [
        { value: 'weekly', label: 'Semanal (÷ 7 días)' },
        { value: 'biweekly', label: 'Quincenal (÷ 15 días)' },
        { value: 'monthly', label: 'Mensual (÷ 30 días)' },
      ],
    },
  ],
  toInput: (raw: Record<string, unknown>): SalarioDiarioInput => ({
    amount: Number(raw['amount']),
    period: String(raw['period']) as SalarioPeriod,
  }),
  calculate: calculateSalarioDiario,
};
