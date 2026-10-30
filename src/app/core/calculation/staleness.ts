/**
 * Staleness_Check — función pura de detección de desfase de constantes (Req 17).
 *
 * Compara el año fiscal de las constantes cargadas con el año actual y señala
 * si los valores podrían estar desactualizados. El año actual se INYECTA desde
 * la capa de presentación (no se lee `Date` dentro de la función) para preservar
 * el determinismo y la testabilidad: misma entrada ⇒ misma salida, sin estado
 * ni efectos (Req 5.5, análogo al contrato del Calculation_Service).
 *
 * Fuente del comportamiento: design.md → "Staleness_Check y aviso de vigencia
 * (Req 17)" y requirements.md Req 17.1–17.3. La relación es estricta:
 * `isStale` es `true` si y solo si `currentYear > fiscalYear` (Property 23).
 */

import type { FiscalConstants } from '../constants/fiscal-constants.types';

/**
 * Resultado del `Staleness_Check` (Req 17).
 *
 * Expone el año fiscal de las constantes cargadas (Req 17.1), el año actual
 * observado y si hay desfase (Req 17.2, 17.3).
 */
export interface StalenessStatus {
  /** Año fiscal de las constantes cargadas (Req 17.1). */
  fiscalYear: number;
  /** Año actual observado, inyectado desde la presentación. */
  currentYear: number;
  /** `true` si y solo si `currentYear > fiscalYear` (Req 17.2, 17.3). */
  isStale: boolean;
}

/**
 * Evalúa el desfase de las constantes cargadas frente al año actual (Req 17).
 *
 * Función pura: no lee `Date`, no muta la entrada ni toca estado externo. El
 * `currentYear` lo provee la presentación (p.ej. `new Date().getFullYear()`),
 * de modo que la lógica de desfase sea determinista y probable con property
 * testing (Property 23).
 *
 * @param currentYear Año actual observado (inyectado desde la presentación).
 * @param constants Constantes cargadas; solo se consulta su `fiscalYear`.
 * @returns El estado de vigencia con `isStale = currentYear > fiscalYear`.
 */
export function checkStaleness(
  currentYear: number,
  constants: Pick<FiscalConstants, 'fiscalYear'>,
): StalenessStatus {
  const fiscalYear = constants.fiscalYear;
  return {
    fiscalYear,
    currentYear,
    isStale: currentYear > fiscalYear,
  };
}
