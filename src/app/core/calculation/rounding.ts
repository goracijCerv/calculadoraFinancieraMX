/**
 * Utilidad común de redondeo monetario (Req 5.1).
 *
 * Todas las funciones puras de cálculo (`CalculationFn`) deben redondear cada
 * importe monetario —el `total` y cada `amount` del desglose— a dos decimales
 * con esta misma utilidad, de modo que el redondeo sea consistente en toda la
 * aplicación.
 *
 * Es pura: misma entrada ⇒ misma salida, sin efectos secundarios (Req 5.5).
 */

/** Número de decimales de todo importe monetario. */
export const MONEY_DECIMALS = 2;

/**
 * Redondea un importe monetario a dos decimales.
 *
 * Se usa "redondeo medio arriba" sobre el valor desplazado, corrigiendo el
 * error de representación en coma flotante (p.ej. `1.005`) mediante
 * `Number.EPSILON` antes de redondear. Devuelve `0` normalizado (evita `-0`).
 *
 * @param amount importe a redondear.
 * @returns el importe redondeado a {@link MONEY_DECIMALS} decimales.
 */
export function roundMoney(amount: number): number {
  if (!Number.isFinite(amount)) {
    return amount;
  }

  const factor = 10 ** MONEY_DECIMALS;
  const rounded = Math.round((amount + Number.EPSILON) * factor) / factor;

  // Normaliza -0 a 0 para que las comparaciones y la presentación sean estables.
  return rounded === 0 ? 0 : rounded;
}
