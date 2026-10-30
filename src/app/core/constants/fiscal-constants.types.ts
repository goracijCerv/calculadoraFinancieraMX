// Constants_Module — tipos del conjunto de constantes fiscales por año (Req 5.3, 5.4).
//
// Estos tipos describen la forma del Constants_Module: un único conjunto de
// valores oficiales por año fiscal (salario mínimo, UMA, tabla ISR y tabla de
// días de vacaciones) que las funciones puras de cálculo consumen. Actualizar
// un año solo implica añadir un nuevo archivo `fiscal-constants.<año>.ts` y
// cambiar el provider del token; ninguna calculadora define valores oficiales
// (Req 5.3), y la lógica de cálculo no cambia al actualizar un año (Req 5.4).
//
// Los valores numéricos concretos provienen de la verificación oficial de la
// Fase 0 documentada en `docs/formulas.md`; este archivo no define cifras.

/**
 * Renglón (tramo) de la tarifa mensual del ISR (Art. 96 LISR, Anexo 8 RMF).
 *
 * El impuesto de un ingreso gravable se calcula ubicando el tramo cuyo rango
 * contiene al ingreso y aplicando: `cuotaFija + excedente × (% / 100)`, donde
 * `excedente = ingreso − límite inferior del tramo`.
 */
export interface IsrBracket {
  /** Límite inferior del tramo, en pesos. */
  lowerLimit: number;
  /** Cuota fija del tramo, en pesos. */
  fixedFee: number;
  /** Porcentaje aplicable sobre el excedente del límite inferior (p.ej. 6.40). */
  rateOnExcess: number;
}

/**
 * Renglón de la tabla de días de vacaciones (Art. 76 LFT, reforma 2023).
 *
 * Asocia la antigüedad en años completos de servicio con los días de
 * vacaciones correspondientes. La tabla debe ser monótona no decreciente.
 */
export interface VacationDaysRow {
  /** Antigüedad en años completos de servicio. */
  yearsOfService: number;
  /** Días de vacaciones correspondientes a esa antigüedad. */
  days: number;
}

/**
 * Cita oficial (ordenamiento, artículo/tabla y enlace) por valor o tabla del
 * conjunto de constantes. Hace auditable el origen de cada cifra (Req 5.2):
 * la clave identifica el valor o la tabla y el valor es la referencia oficial.
 */
export type SourceRefs = Record<string, string>;

/**
 * Conjunto completo de constantes oficiales de un año fiscal (Req 5.3).
 *
 * Es la fuente única de valores para todas las calculadoras. Se expone mediante
 * un `InjectionToken` (ver `fiscal-constants.token.ts`) para que el año vigente
 * sea reemplazable sin tocar lógica (Req 5.4).
 */
export interface FiscalConstants {
  /** Año fiscal que cubren estas constantes (p.ej. 2026). */
  fiscalYear: number;
  /** Fecha de entrada en vigor (ISO 8601, p.ej. "2026-01-01"). */
  effectiveFrom: string;
  /** Fecha de la última verificación contra fuentes oficiales (ISO 8601). */
  lastVerified: string;
  /** Salario mínimo general diario vigente, en pesos. */
  minimumDailyWage: number;
  /** Valor diario de la UMA vigente, en pesos. */
  uma: number;
  /** Tarifa mensual del ISR (SAT), ordenada ascendentemente por límite inferior. */
  isrMonthlyTable: IsrBracket[];
  /** Tabla de días de vacaciones según la reforma 2023 (Art. 76 LFT). */
  vacationDaysTable: VacationDaysRow[];
  /** Citas oficiales por valor/tabla para trazabilidad (Req 5.2). */
  sourceRefs: SourceRefs;
}
