// CalculatorConfig de sueldo neto ↔ bruto (tarea 19.1).
//
// Especializa la plantilla común `CalculatorPageComponent` para la calculadora
// de conversión de sueldo de la Fase 3 (Req 8.2, 8.3, 8.6). Declara los campos
// del formulario (importe y dirección de la conversión), el copy de explicación
// en lenguaje simple (Req 3.4), el mapeo `toInput` de los valores crudos del
// formulario al DTO `SueldoInput` y la metadata editorial (id, índice, fase).
//
// La función pura de cálculo y el DTO de entrada provienen de
// `core/calculation/sueldo.calculation.ts` (tarea 19.1). La metadata (id, index,
// name, description, phase) se mantiene consistente con la entrada de sueldo ya
// registrada en `CALCULATOR_REGISTRY` (tarea 7.1): esta config no duplica el
// registro, lo refleja (sueldo, índice 7, fase 3).
//
// Diseño de referencia: design.md → "Plantilla común de calculadora" y Req 8.

import {
  calculateSueldo,
  type SueldoDirection,
  type SueldoInput,
} from '../../core/calculation/sueldo.calculation';
import type { CalculatorConfig } from './calculator-config';

/**
 * Configuración de la calculadora de sueldo neto ↔ bruto.
 *
 * - `fields`: importe mensual (moneda, requerido, > 0) y dirección de la
 *   conversión (select entre bruto → neto y neto → bruto).
 * - `explanation`: resumen en lenguaje simple de la conversión (Req 3.4),
 *   alineado con `docs/formulas.md` §3 (tarifa de ISR, simplificación a ISR).
 * - `toInput`: traduce los valores crudos del formulario al `SueldoInput`.
 * - `id`/`index`/`phase`: consistentes con `CALCULATOR_REGISTRY` (sueldo,
 *   índice 7, fase 3) (Req 8.6).
 */
export const SUELDO_CONFIG: CalculatorConfig<SueldoInput> = {
  id: 'sueldo',
  index: 7,
  name: 'Sueldo neto y bruto',
  description: 'Convierte tu sueldo de bruto a neto y de neto a bruto.',
  phase: 3,
  resultLabel: 'Sueldo convertido',
  explanation:
    'Convierte tu sueldo mensual entre bruto y neto. El sueldo neto es el bruto menos la retención ' +
    'de ISR del mes, calculada con la tarifa del SAT (Art. 96 LISR). Para simplificar, esta estimación ' +
    'considera únicamente la retención de ISR: no incluye las cuotas del IMSS ni el subsidio al empleo. ' +
    'La conversión de neto a bruto resuelve el sueldo bruto cuyo neto coincide con el que capturaste.',
  fields: [
    {
      key: 'amount',
      label: 'Importe mensual',
      type: 'currency',
      required: true,
      min: 0.01,
      helpText: 'Sueldo mensual a convertir. Es bruto o neto según la dirección elegida.',
    },
    {
      key: 'direction',
      label: 'Dirección de la conversión',
      type: 'select',
      required: true,
      initialValue: 'gross-to-net' satisfies SueldoDirection,
      helpText: 'Elige si el importe capturado es bruto (para obtener el neto) o neto (para obtener el bruto).',
      options: [
        { value: 'gross-to-net', label: 'De bruto a neto' },
        { value: 'net-to-gross', label: 'De neto a bruto' },
      ],
    },
  ],
  toInput: (raw: Record<string, unknown>): SueldoInput => ({
    amount: Number(raw['amount']),
    direction: raw['direction'] as SueldoDirection,
  }),
  calculate: calculateSueldo,
};
