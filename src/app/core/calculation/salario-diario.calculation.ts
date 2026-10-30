/**
 * Salario diario — función pura de cálculo (Fase 3) (Req 5.1, 5.5, 5.6, 8.4, 8.6).
 *
 * Convierte un salario expresado en una periodicidad distinta a la diaria
 * (semanal, quincenal o mensual) a su equivalente de salario diario. No
 * depende de constantes fiscales: es una conversión aritmética por divisores
 * de días estándar.
 *
 * ── Convención de días por periodo (documentada) ──
 * Se usan los divisores convencionales del salario diario en México, derivados
 * del mes comercial de 30 días que la LFT emplea para integrar el salario:
 *
 *   semanal   (weekly)   → 7  días
 *   quincenal (biweekly) → 15 días
 *   mensual   (monthly)  → 30 días
 *
 * El divisor mensual de 30 (y por tanto 15 para la quincena) es la convención
 * común del "salario diario" en el ámbito laboral mexicano: la LFT calcula el
 * salario diario de un sueldo mensual dividiendo entre 30 (Art. 89 LFT, que fija
 * el factor de integración sobre la base de un mes de 30 días; práctica estándar
 * de IMSS/SAT para el salario diario). La semana de 7 días naturales es la
 * convención directa para un salario semanal.
 *
 * Fuente/convención: LFT Art. 89 (salario diario = mensual / 30) y práctica
 * estándar del salario diario en México (mes comercial de 30 días; quincena de
 * 15). No se toman valores de fuentes fiscales anuales: la conversión es una
 * razón fija y, por tanto, independiente del `Constants_Module`.
 *
 * ── Fórmula ──
 *   salarioDiario = monto / díasDelPeriodo
 *
 * Property 13 (consistencia de la conversión): salarioDiario × díasDelPeriodo
 * reconstruye el monto original (salvo el redondeo monetario a 2 decimales).
 *
 * Pureza (Req 5.5): misma entrada ⇒ misma salida; sin DOM, sin `Date`, sin
 * `Math.random`, sin mutar la entrada; no consume `FiscalConstants`.
 */

import type {
  BreakdownItem,
  CalculationFn,
  CalculationResult,
} from './calculation.types';
import { CalculationError } from './calculation.types';
import { roundMoney } from './rounding';
import type { FiscalConstants } from '../constants/fiscal-constants.types';

/**
 * Periodicidad del salario de origen (distinta a la diaria) (Req 8.4).
 *
 * Se excluye deliberadamente la periodicidad diaria: convertir un salario
 * diario a diario no tendría sentido para esta calculadora.
 */
export type SalarioPeriod = 'weekly' | 'biweekly' | 'monthly';

/**
 * Divisor de días por periodicidad (convención documentada arriba).
 *
 * Mapa inmutable: cada periodicidad válida se asocia al número de días del
 * periodo usado como divisor para obtener el salario diario.
 */
export const PERIOD_DIVISORS: Readonly<Record<SalarioPeriod, number>> = {
  weekly: 7,
  biweekly: 15,
  monthly: 30,
} as const;

/** Etiquetas legibles por periodicidad (para el desglose del resultado). */
const PERIOD_LABELS: Readonly<Record<SalarioPeriod, string>> = {
  weekly: 'semanal',
  biweekly: 'quincenal',
  monthly: 'mensual',
} as const;

/** DTO de entrada de la calculadora de salario diario (Req 8.4, ver design.md). */
export interface SalarioDiarioInput {
  /** Monto del salario en la periodicidad de origen, en pesos (> 0) (Req 4.1, 5.6). */
  amount: number;
  /** Periodicidad del salario de origen (distinta a la diaria) (Req 8.4). */
  period: SalarioPeriod;
}

/**
 * Convierte un salario de periodicidad no diaria a su equivalente diario
 * (función pura, Req 5.5). No usa `FiscalConstants` (conversión aritmética).
 *
 * @throws CalculationError('INVALID_INPUT', 'amount', …) si el monto no es un
 *   número finito o es ≤ 0 (Req 5.6, 4.1).
 * @throws CalculationError('INVALID_INPUT', 'period', …) si la periodicidad es
 *   desconocida (no está en {@link PERIOD_DIVISORS}) (Req 5.6).
 */
export const calculateSalarioDiario: CalculationFn<SalarioDiarioInput, FiscalConstants> = (
  input,
): CalculationResult => {
  // ── Validación de la periodicidad (Req 5.6) ──
  const period = input.period;
  const divisor = PERIOD_DIVISORS[period as SalarioPeriod];
  if (divisor == null) {
    throw new CalculationError(
      'INVALID_INPUT',
      'period',
      `La periodicidad "${String(period)}" no es válida. Usa semanal, quincenal o mensual.`,
    );
  }

  // ── Validación del monto (Req 5.6, 4.1) ──
  const amount = input.amount;
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    throw new CalculationError(
      'INVALID_INPUT',
      'amount',
      'El salario debe ser un número válido.',
    );
  }
  if (amount <= 0) {
    throw new CalculationError(
      'INVALID_INPUT',
      'amount',
      `El salario (${amount}) debe ser mayor que cero.`,
    );
  }

  // ── Conversión (Req 8.4) ──
  // salarioDiario = monto / díasDelPeriodo (convención de días documentada).
  const dailySalary = roundMoney(amount / divisor);

  const breakdown: BreakdownItem[] = [
    {
      concept: `Salario diario (equivalente de un salario ${PERIOD_LABELS[period]})`,
      amount: dailySalary,
    },
  ];

  // Total = suma del desglose (Property 3), redondeado a 2 decimales.
  const total = roundMoney(breakdown.reduce((sum, item) => sum + item.amount, 0));

  return { total, breakdown };
};
