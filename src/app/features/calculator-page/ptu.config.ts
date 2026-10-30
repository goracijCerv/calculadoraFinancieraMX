// CalculatorConfig de PTU (reparto de utilidades) (tarea 21.1).
//
// Especializa la plantilla común `CalculatorPageComponent` para la calculadora
// de PTU de la Fase 3 (Req 8.5, 8.6). Declara los campos del formulario, el copy
// de explicación en lenguaje simple (Req 3.4), el mapeo `toInput` de los valores
// crudos del formulario al DTO `PtuInput` y la metadata editorial (id, índice,
// fase).
//
// La función pura de cálculo y el DTO de entrada provienen de
// `core/calculation/ptu.calculation.ts`. La metadata (id, index, name,
// description, phase) se mantiene consistente con la entrada de PTU ya registrada
// en `CALCULATOR_REGISTRY` (tarea 7.1): esta config no duplica el registro, lo
// refleja (ptu, índice 9, fase 3).
//
// Diseño de referencia: design.md → "Plantilla común de calculadora" y Req 8.

import { calculatePtu, type PtuInput } from '../../core/calculation/ptu.calculation';
import type { CalculatorConfig } from './calculator-config';

/**
 * Configuración de la calculadora de PTU (reparto de utilidades).
 *
 * - `fields`: monto a repartir, días trabajados (persona y total), salarios
 *   devengados (persona y total), salario mensual (base del tope) y, opcional,
 *   el promedio trienal de PTU.
 * - `explanation`: resumen en lenguaje simple del reparto en dos mitades y del
 *   tope individual (Req 3.4), alineado con `docs/formulas.md` §9.
 * - `toInput`: traduce los valores crudos del formulario al `PtuInput`.
 * - `id`/`index`/`phase`: consistentes con `CALCULATOR_REGISTRY` (ptu, índice 9,
 *   fase 3) (Req 8.6).
 */
export const PTU_CONFIG: CalculatorConfig<PtuInput> = {
  id: 'ptu',
  index: 9,
  name: 'PTU (reparto de utilidades)',
  description: 'Calcula el reparto de utilidades según los días y el salario trabajados.',
  phase: 3,
  resultLabel: 'PTU estimada',
  explanation:
    'La PTU (Participación de los Trabajadores en las Utilidades) reparte el 10 % de la renta ' +
    'gravable de la empresa entre su personal. El monto a repartir se divide en dos mitades iguales: ' +
    'la primera se reparte según los días que trabajaste en el año y la segunda según los salarios que ' +
    'devengaste (LFT Art. 117–131). Desde la reforma de 2021, lo que recibe cada persona tiene un tope: ' +
    'el mayor entre tres meses de su salario o el promedio de la PTU que recibió en los últimos tres años.',
  fields: [
    {
      key: 'amountToDistribute',
      label: 'Monto a repartir',
      type: 'currency',
      required: true,
      min: 0,
      helpText: 'Total que la empresa reparte (10 % de la renta gravable declarada ante el SAT).',
    },
    {
      key: 'daysWorked',
      label: 'Tus días trabajados',
      type: 'integer',
      required: true,
      min: 0,
      helpText: 'Días que trabajaste en el año.',
    },
    {
      key: 'totalDaysWorked',
      label: 'Días trabajados por todo el personal',
      type: 'integer',
      required: true,
      min: 1,
      helpText: 'Suma de los días trabajados por todas las personas de la empresa.',
    },
    {
      key: 'salaryEarned',
      label: 'Tu salario devengado',
      type: 'currency',
      required: true,
      min: 0,
      helpText: 'Salario que devengaste en el año.',
    },
    {
      key: 'totalSalaries',
      label: 'Salarios devengados por todo el personal',
      type: 'currency',
      required: true,
      min: 0.01,
      helpText: 'Suma de los salarios devengados por todas las personas de la empresa.',
    },
    {
      key: 'monthlySalary',
      label: 'Tu salario mensual',
      type: 'currency',
      required: true,
      min: 0.01,
      helpText: 'Base del tope individual: tu PTU no excede 3 meses de este salario.',
    },
    {
      key: 'triennialAverage',
      label: 'Promedio trienal de PTU (opcional)',
      type: 'currency',
      required: false,
      min: 0,
      initialValue: 0,
      helpText: 'Promedio de la PTU que recibiste en los últimos 3 años. Déjalo en 0 si no aplica.',
    },
  ],
  toInput: (raw: Record<string, unknown>): PtuInput => ({
    amountToDistribute: Number(raw['amountToDistribute']),
    daysWorked: Number(raw['daysWorked']),
    totalDaysWorked: Number(raw['totalDaysWorked']),
    salaryEarned: Number(raw['salaryEarned']),
    totalSalaries: Number(raw['totalSalaries']),
    monthlySalary: Number(raw['monthlySalary']),
    triennialAverage: Number(raw['triennialAverage']),
  }),
  calculate: calculatePtu,
};
