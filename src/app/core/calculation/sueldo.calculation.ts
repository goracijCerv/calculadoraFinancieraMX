/**
 * Sueldo neto ↔ bruto — función pura de cálculo (Fase 3) (Req 5.5, 5.6, 8.2, 8.3, 8.6).
 *
 * Convierte un sueldo mensual entre su valor BRUTO y su valor NETO en ambas
 * direcciones:
 * - `gross-to-net` (bruto → neto): resta al bruto la retención de ISR del mes.
 * - `net-to-gross` (neto → bruto): resuelve el bruto cuyo neto coincide con el
 *   neto capturado (inversión exacta por tramo, no iterativa).
 *
 * ── Fuente oficial (verificada en Fase 0, ver `docs/formulas.md` §3) ──
 * - ISR mensual: tarifa del Art. 96 LISR, Anexo 8 RMF / DOF 28-dic-2025 · 2026
 *   · `docs/formulas.md` §3. Regla por tramo:
 *     1. ubicar el tramo cuyo rango contiene al ingreso gravable mensual,
 *     2. excedente = ingreso − límite inferior del tramo,
 *     3. ISR = cuota fija del tramo + excedente × (% sobre excedente / 100).
 *
 * ── Simplificación documentada (Req 8.6) ──
 * El neto se calcula como `neto = bruto − ISR`, considerando ÚNICAMENTE la
 * retención de ISR de `docs/formulas.md` §3. Otras retenciones (p.ej. cuotas
 * obrero-patronales del IMSS) NO se incluyen porque sus tablas no forman parte
 * del `Constants_Module` (ver `fiscal-constants.types.ts`): §3 solo documenta la
 * tarifa del ISR. El subsidio al empleo (§3) tampoco se aplica aquí: esta
 * conversión se centra en la tarifa de ISR y el subsidio es responsabilidad de
 * la calculadora de ISR (tarea 18.1). Si en el futuro se agregan esas tablas al
 * Constants_Module, la fórmula del neto se amplía sin cambiar este contrato.
 *
 * ── Dependencia con la calculadora de ISR (tarea 18.1, concurrente) ──
 * La lógica de tramos de ISR se REPLICA aquí (`computeIsrFromBrackets`) citando
 * §3, porque `isr.calculation.ts` (tarea 18.1) se implementa en paralelo. Cuando
 * esa tarea exponga su helper de tramos, este archivo puede reemplazar
 * `computeIsrFromBrackets` por el importado sin cambiar el comportamiento: ambos
 * aplican exactamente la fórmula de §3.
 *
 * Property 12 (round trip, Req 8.2, 8.3): convertir un bruto a neto y de vuelta
 * a bruto reproduce el bruto original dentro de la tolerancia de redondeo a dos
 * decimales. La inversión neto → bruto es exacta por tramo (cerrada), no una
 * búsqueda numérica, por lo que es determinista (Req 5.5).
 *
 * Pureza (Req 5.5): misma entrada ⇒ misma salida; sin DOM, sin `Date`, sin
 * `Math.random`, sin mutar la entrada.
 */

import type {
  BreakdownItem,
  CalculationFn,
  CalculationResult,
} from './calculation.types';
import { CalculationError } from './calculation.types';
import { roundMoney } from './rounding';
import type { FiscalConstants, IsrBracket } from '../constants/fiscal-constants.types';

/** Dirección de la conversión del sueldo (Req 8.2, 8.3). */
export type SueldoDirection = 'gross-to-net' | 'net-to-gross';

/**
 * DTO de entrada de la calculadora de sueldo neto ↔ bruto (Req 8.2, 8.3).
 */
export interface SueldoInput {
  /**
   * Importe mensual a convertir, en pesos (> 0). Se interpreta como BRUTO si
   * `direction` es `gross-to-net`, o como NETO si es `net-to-gross`.
   */
  amount: number;
  /** Dirección de la conversión (Req 8.2, 8.3). */
  direction: SueldoDirection;
}

/**
 * Calcula el ISR mensual de un ingreso gravable aplicando la tarifa por tramos
 * de `docs/formulas.md` §3 (Art. 96 LISR, Anexo 8 RMF).
 *
 * Replica la fórmula de §3 (ver nota de dependencia con la tarea 18.1):
 *   ISR = cuotaFija + (ingreso − límiteInferior) × (% / 100).
 *
 * El ISR nunca es negativo y es monótono no decreciente respecto al ingreso
 * (coherente con Property 11). Se asume que `table` está ordenada
 * ascendentemente por `lowerLimit` (invariante del Constants_Module).
 *
 * @param income ingreso gravable mensual (≥ 0).
 * @param table tarifa mensual del ISR del año fiscal vigente.
 * @returns el ISR de tarifa (antes de subsidio), sin redondear.
 */
export function computeIsrFromBrackets(income: number, table: readonly IsrBracket[]): number {
  if (income <= 0) {
    return 0;
  }

  // Tramo aplicable: el de mayor `lowerLimit` que no exceda al ingreso.
  let bracket: IsrBracket = table[0];
  for (const row of table) {
    if (income >= row.lowerLimit) {
      bracket = row;
    } else {
      break;
    }
  }

  const excess = income - bracket.lowerLimit;
  const marginal = excess * (bracket.rateOnExcess / 100);
  const isr = bracket.fixedFee + marginal;
  return isr > 0 ? isr : 0;
}

/**
 * Resuelve el sueldo BRUTO cuyo NETO (= bruto − ISR) coincide con `net`.
 *
 * Como el ISR es lineal a trozos, el neto también lo es, y la inversión es
 * cerrada por tramo. Para un tramo con límite inferior `L`, cuota fija `F` y
 * tasa `r = rateOnExcess / 100`:
 *   isr  = F + (bruto − L) × r
 *   neto = bruto − isr = bruto × (1 − r) − F + L × r
 *   ⇒ bruto = (neto + F − L × r) / (1 − r)
 *
 * Se recorre la tabla y se acepta el primer tramo cuyo `bruto` calculado cae en
 * el rango del propio tramo (es decir, cuyo neto en el límite inferior no supera
 * a `net`), lo que da una solución única y determinista (Req 5.5).
 *
 * @param net neto mensual objetivo (≥ 0).
 * @param table tarifa mensual del ISR del año fiscal vigente.
 * @returns el bruto correspondiente, sin redondear.
 */
export function solveGrossFromNet(net: number, table: readonly IsrBracket[]): number {
  if (net <= 0) {
    return 0;
  }

  for (let i = 0; i < table.length; i++) {
    const bracket = table[i];
    const rate = bracket.rateOnExcess / 100;
    // bruto = (neto + F − L × r) / (1 − r).
    const gross = (net + bracket.fixedFee - bracket.lowerLimit * rate) / (1 - rate);

    // El tramo es el correcto si el bruto cae dentro de su rango: no es menor
    // que su límite inferior y no alcanza el límite inferior del siguiente.
    const atOrAboveLower = gross >= bracket.lowerLimit;
    const next = table[i + 1];
    const belowNext = next == null || gross < next.lowerLimit;
    if (atOrAboveLower && belowNext) {
      return gross;
    }
  }

  // Si ningún tramo encaja (p.ej. neto por debajo del primer límite), el bruto
  // es el propio neto (el primer tramo arranca prácticamente en 0 con tasa baja).
  return net;
}

/**
 * Calcula la conversión de sueldo neto ↔ bruto (función pura, Req 5.5).
 *
 * @throws CalculationError('INVALID_INPUT', campo, …) si el importe falta, no es
 *   finito, es ≤ 0, o la dirección no es válida (Req 5.6).
 * @throws CalculationError('MISSING_CONSTANT', nombre, …) si falta la tabla del
 *   ISR del año fiscal vigente (Req 5.7).
 */
export const calculateSueldo: CalculationFn<SueldoInput, FiscalConstants> = (
  input,
  constants,
): CalculationResult => {
  // ── Constantes requeridas (Req 5.7) ──
  // Sin la tarifa del ISR no se puede estimar la retención (`docs/formulas.md` §3).
  if (
    constants.isrMonthlyTable == null ||
    !Array.isArray(constants.isrMonthlyTable) ||
    constants.isrMonthlyTable.length === 0
  ) {
    throw new CalculationError(
      'MISSING_CONSTANT',
      'isrMonthlyTable',
      'Falta la tarifa mensual del ISR del año fiscal vigente.',
    );
  }

  // ── Validación de datos de entrada (Req 5.6) ──
  const amount = input.amount;
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    throw new CalculationError(
      'INVALID_INPUT',
      'amount',
      'El importe debe ser un número válido.',
    );
  }
  if (amount <= 0) {
    throw new CalculationError(
      'INVALID_INPUT',
      'amount',
      `El importe (${amount}) debe ser mayor que cero.`,
    );
  }

  const direction = input.direction;
  if (direction !== 'gross-to-net' && direction !== 'net-to-gross') {
    throw new CalculationError(
      'INVALID_INPUT',
      'direction',
      "La dirección debe ser 'gross-to-net' o 'net-to-gross'.",
    );
  }

  const table = constants.isrMonthlyTable;

  // ── Conversión y desglose (Req 8.2, 8.3 · `docs/formulas.md` §3) ──
  // En ambos sentidos se determina el bruto; el ISR y el neto se derivan de él.
  const gross =
    direction === 'gross-to-net' ? amount : solveGrossFromNet(amount, table);
  const isr = computeIsrFromBrackets(gross, table);

  const grossRounded = roundMoney(gross);
  const isrRounded = roundMoney(isr);
  const netRounded = roundMoney(gross - isr);

  // El neto es el monto resultante en ambos sentidos; el desglose muestra el
  // bruto, el ISR retenido (negativo) y el neto (Property 3: total = suma).
  const breakdown: BreakdownItem[] = [
    { concept: 'Sueldo bruto', amount: grossRounded },
    { concept: 'ISR retenido', amount: roundMoney(-isrRounded) },
    { concept: 'Sueldo neto', amount: netRounded },
  ];

  // El monto héroe (`total`) es el valor que el usuario buscó obtener:
  // el neto cuando convierte de bruto, o el bruto cuando convierte de neto.
  const total = direction === 'gross-to-net' ? netRounded : grossRounded;

  return { total, breakdown };
};
