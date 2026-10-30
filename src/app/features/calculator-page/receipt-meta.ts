// Metadatos de recibo generados en la capa de presentación (Req 3.7).
//
// El folio y la fecha del recibo se generan AQUÍ (en la presentación), nunca en
// la función pura de cálculo: la fórmula debe permanecer determinista y sin
// leer `Date` (Req 5.5). Para que la generación de folio sea testeable, se
// aísla en una función pura que recibe explícitamente la fecha y una semilla de
// aleatoriedad, en vez de leer el reloj o `Math.random` internamente.

/** Alfabeto del sufijo aleatorio del folio (sin caracteres ambiguos). */
const FOLIO_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Longitud del sufijo aleatorio del folio. */
const FOLIO_SUFFIX_LENGTH = 4;

/** Metadatos de recibo que la presentación añade al resultado (Req 3.7). */
export interface ReceiptMeta {
  /** Folio del recibo. */
  readonly folio: string;
  /** Fecha de cálculo. */
  readonly date: Date;
}

/**
 * Formatea el prefijo de fecha del folio como `PREFIX-YYYYMMDD`. Puro.
 *
 * Usa los componentes de fecha locales para que el folio refleje la fecha
 * mostrada por `ReceiptDetailComponent`.
 */
function formatDatePrefix(prefix: string, date: Date): string {
  const year = date.getFullYear().toString().padStart(4, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${prefix}-${year}${month}${day}`;
}

/**
 * Genera un folio determinista a partir de un prefijo, una fecha y una semilla
 * de aleatoriedad en `[0, 1)`. Puro: misma entrada ⇒ mismo folio.
 *
 * El sufijo aleatorio se deriva de `seed` de forma estable, de modo que la
 * función pueda probarse sin depender de `Math.random`.
 *
 * @param prefix prefijo editorial (p.ej. el id de la calculadora en mayúsculas).
 * @param date fecha de cálculo mostrada en el recibo.
 * @param seed número en `[0, 1)` que determina el sufijo aleatorio.
 */
export function generateFolio(prefix: string, date: Date, seed: number): string {
  const safeSeed = Number.isFinite(seed) ? Math.abs(seed) % 1 : 0;
  // Expande la semilla a un entero grande y deriva cada carácter del sufijo.
  let n = Math.floor(safeSeed * FOLIO_ALPHABET.length ** FOLIO_SUFFIX_LENGTH);
  let suffix = '';
  for (let i = 0; i < FOLIO_SUFFIX_LENGTH; i++) {
    suffix += FOLIO_ALPHABET[n % FOLIO_ALPHABET.length];
    n = Math.floor(n / FOLIO_ALPHABET.length);
  }
  return `${formatDatePrefix(prefix, date)}-${suffix}`;
}
