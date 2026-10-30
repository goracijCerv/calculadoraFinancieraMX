// Búsqueda de calculadoras en el cliente (tarea 7.1).
//
// `searchCalculators` es una función PURA de filtrado en el navegador (Req 2.1):
// no realiza peticiones a un servidor, no lee ni muta estado externo y no altera
// la lista recibida. Devuelve siempre el mismo resultado para las mismas
// entradas, lo que permite validarla con property tests (tareas 7.2 y 7.3).
//
// Reglas (design.md → searchCalculators):
// - Req 2.2: devuelve únicamente las calculadoras cuyo `name` o `description`
//   coincide con el término (coincidencia por subcadena, sin distinguir
//   mayúsculas/minúsculas).
// - Req 2.4: un término vacío o solo con espacios devuelve el registry completo,
//   conservando los mismos elementos y el mismo orden.

import type { CalculatorMeta } from './calculator-registry';

/**
 * Filtra el registry de calculadoras en el cliente por nombre o descripción.
 *
 * Función pura: no muta `all` ni ningún estado externo; para las mismas
 * entradas produce siempre la misma salida.
 *
 * @param all Registry completo de calculadoras (no se modifica).
 * @param term Término de búsqueda escrito por el usuario.
 * @returns Subconjunto del registry cuyos elementos coinciden con el término,
 *   en el mismo orden relativo. Si el término está vacío o es solo espacios,
 *   devuelve el registry completo (mismos elementos, mismo orden).
 */
export function searchCalculators(
  all: readonly CalculatorMeta[],
  term: string,
): readonly CalculatorMeta[] {
  const normalized = term.trim().toLowerCase();

  // Req 2.4: término vacío (o solo espacios) ⇒ registry completo sin cambios.
  if (normalized.length === 0) {
    return all;
  }

  // Req 2.2: conserva el orden original y filtra por name/description.
  return all.filter(
    (calculator) =>
      calculator.name.toLowerCase().includes(normalized) ||
      calculator.description.toLowerCase().includes(normalized),
  );
}
