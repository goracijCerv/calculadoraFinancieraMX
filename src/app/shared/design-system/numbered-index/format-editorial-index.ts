// Helper puro del índice editorial (Req 1.3, 9.5).
//
// Formatea un número de posición como índice editorial de dos dígitos con
// relleno de cero: 1 → "01", 2 → "02", … La secuencia editorial del registry
// es ascendente desde 01 y sin saltos; este helper sólo se encarga del formato
// de un valor individual, lo que permite al property test (tarea 5.4) validar
// tanto el formato como la integridad de la secuencia.
//
// Es una función pura: mismo valor de entrada → misma salida, sin estado
// externo ni mutación (Req 5.5 aplicado al Design_System).

/**
 * Formatea un número de posición (1-based) como índice editorial de dos
 * dígitos con relleno de cero.
 *
 * - `1` → `"01"`, `9` → `"09"`, `10` → `"10"`, `100` → `"100"`.
 * - Para valores con tres o más dígitos conserva todos los dígitos (nunca
 *   trunca), de modo que la secuencia permanece sin saltos aunque el registry
 *   crezca más allá de 99.
 *
 * @param n Posición editorial 1-based. Debe ser un entero mayor o igual a 1.
 * @returns El índice formateado con al menos dos dígitos y relleno de cero.
 * @throws {RangeError} Si `n` no es un entero finito mayor o igual a 1.
 */
export function formatEditorialIndex(n: number): string {
  if (!Number.isInteger(n) || n < 1) {
    throw new RangeError(
      `formatEditorialIndex espera un entero >= 1; recibió: ${n}`,
    );
  }

  return String(n).padStart(2, '0');
}
