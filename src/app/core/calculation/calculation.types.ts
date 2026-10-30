/**
 * Contrato del Calculation_Service (Req 3.2, 3.3, 5.1, 5.5, 5.6, 5.7).
 *
 * Define las formas uniformes que producen y consumen todas las calculadoras:
 * el resultado (`CalculationResult` con su desglose `BreakdownItem[]`), los
 * errores de cálculo (`CalculationError` / `CalculationErrorCode`) y la firma
 * de toda función pura de cálculo (`CalculationFn`).
 *
 * Las funciones puras de cálculo reciben las constantes fiscales del año
 * vigente (`FiscalConstants` del Constants_Module, tarea 9.1). Para no acoplar
 * este contrato a un año fiscal concreto, `CalculationFn` deja las constantes
 * como parámetro de tipo: cada calculadora lo instancia con `FiscalConstants`.
 */

/** Un concepto del desglose del resultado (Req 3.3). */
export interface BreakdownItem {
  /** Nombre del concepto mostrado en el desglose (Req 3.3). */
  concept: string;
  /** Importe del concepto, redondeado a 2 decimales (Req 5.1). */
  amount: number;
}

/** Resultado uniforme de cualquier calculadora (Req 3.2, 3.3). */
export interface CalculationResult {
  /** Monto héroe; redondeado a 2 decimales (Req 3.2, 5.1). */
  total: number;
  /** Desglose de conceptos que conforman el total (Req 3.3). */
  breakdown: BreakdownItem[];
  // Los metadatos de recibo (folio y fecha) los genera la presentación en
  // CalculatorPageComponent (Req 3.7), nunca la función pura de cálculo.
}

/**
 * Código de error de cálculo (Req 5.6, 5.7).
 *
 * - `INVALID_INPUT`: un dato falta o queda fuera del rango oficial (Req 5.6, 4.x).
 * - `MISSING_CONSTANT`: falta una constante requerida del año fiscal (Req 5.7).
 */
export type CalculationErrorCode = 'INVALID_INPUT' | 'MISSING_CONSTANT';

/**
 * Error lanzado por una función pura de cálculo cuando no puede producir un
 * resultado numérico válido (Req 5.6, 5.7).
 *
 * No se devuelve un resultado aproximado: la función señala el problema con un
 * código y el `field` responsable (nombre del dato de entrada o de la constante
 * faltante). La presentación lo traduce a `ErrorStateComponent` (Req 12.2).
 */
export class CalculationError extends Error {
  constructor(
    /** Categoría del error (Req 5.6, 5.7). */
    readonly code: CalculationErrorCode,
    /** Dato de entrada o constante responsable del error. */
    readonly field: string,
    message: string,
  ) {
    super(message);
    this.name = 'CalculationError';
    // Mantiene el `instanceof CalculationError` correcto tras compilar a ES5+.
    Object.setPrototypeOf(this, CalculationError.prototype);
  }
}

/**
 * Firma de toda función pura de cálculo (Req 5.5).
 *
 * Debe ser pura: misma entrada ⇒ misma salida, sin mutar `input`, sin leer ni
 * escribir estado externo y sin efectos (sin DOM, sin `Date`, sin
 * `Math.random`). Redondea cada importe a 2 decimales con la utilidad común
 * (Req 5.1) y lanza `CalculationError` ante datos inválidos (Req 5.6) o
 * constantes faltantes (Req 5.7).
 *
 * `TConstants` se instancia con `FiscalConstants` del Constants_Module
 * (tarea 9.1); se deja como parámetro de tipo para no acoplar el contrato a un
 * año fiscal concreto.
 */
export type CalculationFn<TInput, TConstants> = (
  input: TInput,
  constants: TConstants,
) => CalculationResult;
