// CalculatorRegistry (tarea 7.1).
//
// Lista ordenada de metadatos de las calculadoras de CalculaFácil. Expone los
// datos que necesitan el índice numerado del inicio (Req 1.1), el listado
// completo con numeración editorial (Req 1.3) y la búsqueda en cliente
// (Req 2.1, 2.2, 2.4). No carga funciones de cálculo: las rutas usan
// `loadComponent` de forma perezosa, y el registry solo describe la metadata.
//
// Diseño de referencia: design.md → "Navegación, registro y búsqueda (Req 1, 2)".
// Alcance por fases: Req 6.3 (finiquito, fase 1), Req 7.5 (laborales, fase 2),
// Req 8.6 (fiscales y extras, fase 3).

/** Fase de entrega a la que pertenece una calculadora (Req 6.3, 7.5, 8.6). */
export type CalculatorPhase = 1 | 2 | 3;

/**
 * Metadatos de una calculadora para navegación, índice editorial y búsqueda.
 *
 * - `id`: slug estable usado en la ruta `calculadoras/:id`.
 * - `index`: numeración editorial (Req 9.5); ascendente desde 1, sin saltos.
 * - `name` / `description`: campos sobre los que filtra la búsqueda (Req 2.2).
 * - `phase`: fase de entrega (Req 6.3, 7.5, 8.6).
 */
export interface CalculatorMeta {
  readonly id: string;
  readonly index: number;
  readonly name: string;
  readonly description: string;
  readonly phase: CalculatorPhase;
}

/**
 * Registro ordenado de las 9 calculadoras de CalculaFácil.
 *
 * El orden editorial define la numeración visible (`index`): comienza en 1 y
 * avanza sin saltos (Req 9.5). Las fases siguen el alcance de los requisitos:
 * finiquito en la fase 1 (Req 6), las laborales en la fase 2 (Req 7) y las
 * fiscales y extras en la fase 3 (Req 8). La lista es `readonly` para preservar
 * la pureza de `searchCalculators` y evitar mutaciones accidentales del origen.
 */
export const CALCULATOR_REGISTRY: readonly CalculatorMeta[] = [
  {
    id: 'finiquito',
    index: 1,
    name: 'Finiquito',
    description:
      'Calcula tu finiquito con las partes proporcionales de aguinaldo, vacaciones, prima vacacional y días pendientes.',
    phase: 1,
  },
  {
    id: 'liquidacion',
    index: 2,
    name: 'Liquidación por despido',
    description:
      'Estima tu liquidación por despido injustificado: tres meses de indemnización, 20 días por año y prima de antigüedad.',
    phase: 2,
  },
  {
    id: 'aguinaldo',
    index: 3,
    name: 'Aguinaldo',
    description: 'Calcula tu aguinaldo anual con el mínimo de 15 días de salario que marca la LFT.',
    phase: 2,
  },
  {
    id: 'vacaciones',
    index: 4,
    name: 'Vacaciones y prima vacacional',
    description: 'Calcula los días de vacaciones y la prima vacacional que te corresponden.',
    phase: 2,
  },
  {
    id: 'dias-vacaciones',
    index: 5,
    name: 'Días de vacaciones',
    description:
      'Consulta los días de vacaciones según tu antigüedad conforme a la reforma de Vacaciones Dignas 2023.',
    phase: 2,
  },
  {
    id: 'isr',
    index: 6,
    name: 'ISR mensual',
    description:
      'Calcula el ISR mensual con la tabla del SAT y el subsidio al empleo cuando corresponda.',
    phase: 3,
  },
  {
    id: 'sueldo',
    index: 7,
    name: 'Sueldo neto y bruto',
    description: 'Convierte tu sueldo de bruto a neto y de neto a bruto.',
    phase: 3,
  },
  {
    id: 'salario-diario',
    index: 8,
    name: 'Salario diario',
    description: 'Convierte un salario de cualquier periodicidad a su equivalente diario.',
    phase: 3,
  },
  {
    id: 'ptu',
    index: 9,
    name: 'PTU (reparto de utilidades)',
    description: 'Calcula el reparto de utilidades según los días y el salario trabajados.',
    phase: 3,
  },
] as const;
