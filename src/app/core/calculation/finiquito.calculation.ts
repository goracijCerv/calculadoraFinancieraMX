/**
 * Finiquito — función pura de cálculo (Fase 1) (Req 5.1, 5.2, 5.5, 5.6, 5.7, 6.1, 6.2).
 *
 * Calcula el finiquito de una terminación laboral: las PARTES PROPORCIONALES
 * devengadas y no pagadas. No incluye indemnización (eso es liquidación).
 *
 * ── Fuentes oficiales (verificadas en Fase 0, ver `docs/formulas.md` §5, §6, §7) ──
 * - Aguinaldo proporcional:  LFT Art. 87 · 2026 · `docs/formulas.md` §6, §7.
 * - Vacaciones proporcionales: LFT Art. 76 (reforma 2023) · 2026 · `docs/formulas.md` §4, §5, §7.
 * - Prima vacacional:        LFT Art. 80 (mínimo 25 %) · 2026 · `docs/formulas.md` §5, §7.
 * - Días pendientes:         LFT Art. 87/salario devengado · 2026 · `docs/formulas.md` §7.
 *
 * ── Bases de proration (fijadas en `docs/formulas.md` §7 para garantizar pureza y
 * determinismo, Req 5.5) ──
 * `docs/formulas.md` §7 fija explícitamente las bases de prorrateo "para que la
 * función pura sea determinista" y aclara que la prueba de ejemplo usa
 * exactamente esta base, sobre un año de 365 días:
 * - Aguinaldo: días trabajados en el **año calendario** de `endDate` (Art. 87).
 * - Vacaciones y prima: días del **año de servicio en curso**, el periodo
 *   `(aniversario anterior a `endDate`, `endDate]`, con los días de vacaciones de
 *   ESE año de servicio (años cumplidos + 1; 12 días con menos de un año).
 *   Terminar exactamente en un aniversario cierra un año de servicio completo
 *   (365/365) con los días del año que se cierra.
 *
 * Fórmulas (todas de `docs/formulas.md` §7):
 *   1. díasPendientes          = salarioDiario × díasPendientesNoPagados
 *   2. aguinaldoProporcional   = salarioDiario × 15 × (díasTrabajadosEnElAñoCalendario / 365)
 *                                (del 1 de enero, o del ingreso si fue ese año, a endDate inclusive; tope 365)
 *   3. vacacionesProporcionales= salarioDiario × díasVacaciones(antigüedad)
 *                                × (díasDelAñoDeServicioEnCurso / 365)
 *   4. primaVacacional         = vacacionesProporcionales × 0.25
 *   total = suma de los cuatro conceptos (Property 3, Property 6).
 *
 * Caso de referencia de §7 (verificación): salarioDiario 500, start 2025-01-01,
 * end 2026-12-31 (1 año cumplido; 2.º año de servicio en curso ⇒ 14 días), días pendientes 0,
 * aguinaldo proporcional incluido ⇒ aguinaldo 7 500.00 (365/365 del año
 * calendario), vacaciones 6 980.82 (14 días × 364/365 del año de servicio), prima
 * 1 745.21, días pendientes 0, **total 16 226.03**.
 *
 * Pureza (Req 5.5): misma entrada ⇒ misma salida; sin DOM, sin `Date`, sin
 * `Math.random`, sin mutar la entrada. Las fechas llegan como cadenas ISO y los
 * días se derivan con una aritmética de calendario determinista (no se usa el
 * reloj del sistema).
 */

import type {
  BreakdownItem,
  CalculationFn,
  CalculationResult,
} from './calculation.types';
import { CalculationError } from './calculation.types';
import { roundMoney } from './rounding';
import type { FiscalConstants, VacationDaysRow } from '../constants/fiscal-constants.types';

/** Días de aguinaldo mínimos de ley (LFT Art. 87 · `docs/formulas.md` §6). */
const AGUINALDO_MIN_DAYS = 15;

/** Porcentaje mínimo de prima vacacional (LFT Art. 80 · `docs/formulas.md` §5). */
const PRIMA_VACACIONAL_RATE = 0.25;

/** Base de prorrateo anual fijada en `docs/formulas.md` §7 (año de 365 días). */
const PRORATION_YEAR_DAYS = 365;

/**
 * DTO de entrada de la calculadora de finiquito (Req 6, ver design.md).
 *
 * Es la referencia de la que heredan las demás calculadoras.
 */
export interface FiniquitoInput {
  /** Salario diario del trabajador, en pesos (positivo, ≥ salario mínimo) (Req 4.1, 5.6). */
  dailySalaryOrMonthly: number;
  /** Fecha de inicio de la relación laboral (ISO 8601 "YYYY-MM-DD") (Req 4.2). */
  startDate: string;
  /** Fecha de fin de la relación laboral (ISO 8601, ≥ `startDate`) (Req 4.2). */
  endDate: string;
  /** Días de vacaciones/salario pendientes de pago (entero ≥ 0). */
  pendingVacationDays: number;
  /** Si se incluye la parte proporcional de aguinaldo en el desglose. */
  aguinaldoProportional: boolean;
}

/** Patrón de fecha ISO calendario "YYYY-MM-DD". */
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Representación numérica de una fecha de calendario válida. */
interface CivilDate {
  readonly year: number;
  readonly month: number; // 1..12
  readonly day: number; // 1..31
}

/**
 * Parsea una cadena ISO "YYYY-MM-DD" a una fecha de calendario, validando que
 * el día exista realmente en ese mes/año (p.ej. rechaza "2026-02-30"). Puro: no
 * usa `Date` ni el reloj del sistema. Lanza `CalculationError('INVALID_INPUT')`
 * para el campo indicado si la cadena no es una fecha válida (Req 5.6).
 */
function parseIsoDate(value: string, field: string): CivilDate {
  const match = typeof value === 'string' ? ISO_DATE_PATTERN.exec(value) : null;
  if (!match) {
    throw new CalculationError(
      'INVALID_INPUT',
      field,
      `La fecha "${value}" debe tener el formato ISO "YYYY-MM-DD".`,
    );
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    throw new CalculationError(
      'INVALID_INPUT',
      field,
      `La fecha "${value}" no es una fecha de calendario válida.`,
    );
  }

  return { year, month, day };
}

/** Indica si `year` es bisiesto según el calendario gregoriano. Puro. */
function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** Número de días del mes `month` (1..12) en `year`. Puro. */
function daysInMonth(year: number, month: number): number {
  const lengths = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return lengths[month - 1];
}

/**
 * Convierte una fecha de calendario a un número de días desde una época fija
 * (algoritmo days-from-civil de Howard Hinnant). Es una función determinista y
 * pura que NO usa `Date`, de modo que la diferencia entre dos fechas es estable
 * e independiente del reloj del sistema (Req 5.5).
 */
function toEpochDay({ year, month, day }: CivilDate): number {
  const y = month <= 2 ? year - 1 : year;
  const era = Math.floor((y >= 0 ? y : y - 399) / 400);
  const yoe = y - era * 400; // [0, 399]
  const doy = Math.floor((153 * (month + (month > 2 ? -3 : 9)) + 2) / 5) + day - 1; // [0, 365]
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy; // [0, 146096]
  return era * 146097 + doe - 719468;
}

/** Diferencia en días naturales entre dos fechas (`to` − `from`). Puro. */
function daysBetween(from: CivilDate, to: CivilDate): number {
  return toEpochDay(to) - toEpochDay(from);
}

/**
 * Años completos de servicio entre `start` y `end` (antigüedad). Cuenta un año
 * cada vez que se alcanza el aniversario de ingreso. Puro.
 */
function completedYearsOfService(start: CivilDate, end: CivilDate): number {
  let years = end.year - start.year;
  // Si aún no se cumple el aniversario dentro del año de `end`, resta uno.
  if (end.month < start.month || (end.month === start.month && end.day < start.day)) {
    years -= 1;
  }
  return years;
}

/**
 * Aniversario de ingreso número `n` (n años después de `start`), ajustando el
 * 29-feb al último día del mes en años no bisiestos para mantener validez. Puro.
 */
function anniversary(start: CivilDate, n: number): CivilDate {
  const year = start.year + n;
  const maxDay = daysInMonth(year, start.month);
  return { year, month: start.month, day: start.day > maxDay ? maxDay : start.day };
}

/**
 * Días del año de servicio en curso: longitud del periodo
 * `(aniversario anterior a `end`, `end`]`, base común de prorrateo de aguinaldo
 * y vacaciones (`docs/formulas.md` §7). Puro.
 *
 * El aniversario de referencia es el inmediatamente anterior a `end`. Cuando
 * `end` cae exactamente en un aniversario, se toma el aniversario del año
 * previo, de modo que un año de servicio recién cumplido cuenta como completo
 * (365 días), tal como exige el caso de referencia de §7.
 */
function daysInCurrentServiceYear(
  start: CivilDate,
  end: CivilDate,
  completedYears: number,
): number {
  // Si `end` es exactamente el aniversario `completedYears`, ancla al previo.
  const referenceYear =
    completedYears >= 1 && daysBetween(anniversary(start, completedYears), end) === 0
      ? completedYears - 1
      : completedYears;
  return daysBetween(anniversary(start, referenceYear), end);
}

/**
 * Días trabajados en el año calendario de `end` (aguinaldo, LFT Art. 87): desde
 * el 1 de enero (o la fecha de ingreso, si ingresó ese mismo año) hasta `end`,
 * ambos inclusive. Se limita a 365 para que un año bisiesto no supere el año
 * completo. Puro.
 */
function daysWorkedInCalendarYear(start: CivilDate, end: CivilDate): number {
  const from: CivilDate =
    start.year === end.year ? start : { year: end.year, month: 1, day: 1 };
  return Math.min(daysBetween(from, end) + 1, PRORATION_YEAR_DAYS);
}

/**
 * Días de vacaciones correspondientes a una antigüedad, según la tabla del
 * Constants_Module (LFT Art. 76, reforma 2023 · `docs/formulas.md` §4). Toma la
 * fila cuya `yearsOfService` es la mayor que no excede la antigüedad. Puro.
 */
function vacationDaysForService(table: readonly VacationDaysRow[], years: number): number {
  let days = 0;
  for (const row of table) {
    if (row.yearsOfService <= years) {
      days = row.days;
    }
  }
  return days;
}

/**
 * Calcula el finiquito (función pura, Req 5.5).
 *
 * @throws CalculationError('INVALID_INPUT', campo, …) si un dato falta o queda
 *   fuera de rango (salario < salario mínimo, fechas inválidas, `endDate` antes
 *   de `startDate`, días negativos) (Req 5.6).
 * @throws CalculationError('MISSING_CONSTANT', nombre, …) si falta una constante
 *   requerida del año fiscal (Req 5.7).
 */
export const calculateFiniquito: CalculationFn<FiniquitoInput, FiscalConstants> = (
  input,
  constants,
): CalculationResult => {
  // ── Constantes requeridas (Req 5.7) ──
  if (constants.minimumDailyWage == null || !Number.isFinite(constants.minimumDailyWage)) {
    throw new CalculationError(
      'MISSING_CONSTANT',
      'minimumDailyWage',
      'Falta el salario mínimo diario del año fiscal vigente.',
    );
  }
  if (!Array.isArray(constants.vacationDaysTable) || constants.vacationDaysTable.length === 0) {
    throw new CalculationError(
      'MISSING_CONSTANT',
      'vacationDaysTable',
      'Falta la tabla de días de vacaciones del año fiscal vigente.',
    );
  }

  // ── Validación de datos de entrada (Req 5.6) ──
  const dailySalary = input.dailySalaryOrMonthly;
  if (typeof dailySalary !== 'number' || !Number.isFinite(dailySalary)) {
    throw new CalculationError(
      'INVALID_INPUT',
      'dailySalaryOrMonthly',
      'El salario diario debe ser un número válido.',
    );
  }
  if (dailySalary < constants.minimumDailyWage) {
    throw new CalculationError(
      'INVALID_INPUT',
      'dailySalaryOrMonthly',
      `El salario diario (${dailySalary}) no puede ser menor al salario mínimo vigente (${constants.minimumDailyWage}).`,
    );
  }

  const pendingDays = input.pendingVacationDays;
  if (typeof pendingDays !== 'number' || !Number.isInteger(pendingDays) || pendingDays < 0) {
    throw new CalculationError(
      'INVALID_INPUT',
      'pendingVacationDays',
      'Los días pendientes deben ser un entero mayor o igual a cero.',
    );
  }

  const start = parseIsoDate(input.startDate, 'startDate');
  const end = parseIsoDate(input.endDate, 'endDate');
  if (daysBetween(start, end) < 0) {
    throw new CalculationError(
      'INVALID_INPUT',
      'endDate',
      'La fecha de fin no puede ser anterior a la fecha de inicio.',
    );
  }

  // ── Antigüedad y bases de prorrateo deterministas ──
  const years = completedYearsOfService(start, end);
  // Año de servicio que se prorratea: el que está en curso (años cumplidos + 1) o, si
  // la terminación cae exactamente en un aniversario, el que se acaba de cerrar.
  // Con menos de un año, el año en curso es el primero (12 días).
  const endsOnAnniversary = years >= 1 && daysBetween(anniversary(start, years), end) === 0;
  const serviceYearNumber = endsOnAnniversary ? years : years + 1;
  const vacationDays = vacationDaysForService(constants.vacationDaysTable, serviceYearNumber);
  // Base de prorrateo de vacaciones y prima (días del año de servicio en curso · §7).
  const serviceYearDays = daysInCurrentServiceYear(start, end, years);

  // ── Conceptos del desglose (Req 6.1, 6.2 · `docs/formulas.md` §7) ──
  const breakdown: BreakdownItem[] = [];

  // 1) Aguinaldo proporcional (LFT Art. 87): salarioDiario × 15 × díasTrabajadosEnElAñoCalendario/365.
  if (input.aguinaldoProportional) {
    const calendarDays = daysWorkedInCalendarYear(start, end);
    const aguinaldo = roundMoney(
      (dailySalary * AGUINALDO_MIN_DAYS * calendarDays) / PRORATION_YEAR_DAYS,
    );
    breakdown.push({ concept: 'Aguinaldo proporcional', amount: aguinaldo });
  }

  // 2) Vacaciones proporcionales (LFT Art. 76): salarioDiario × díasVac × díasAñoServicio/365.
  const vacacionesProporcionales = roundMoney(
    (dailySalary * vacationDays * serviceYearDays) / PRORATION_YEAR_DAYS,
  );
  breakdown.push({ concept: 'Vacaciones proporcionales', amount: vacacionesProporcionales });

  // 3) Prima vacacional (LFT Art. 80): vacacionesProporcionales × 25 %.
  const primaVacacional = roundMoney(vacacionesProporcionales * PRIMA_VACACIONAL_RATE);
  breakdown.push({ concept: 'Prima vacacional', amount: primaVacacional });

  // 4) Días pendientes de salario (`docs/formulas.md` §7): salarioDiario × díasPendientes.
  const diasPendientes = roundMoney(dailySalary * pendingDays);
  breakdown.push({ concept: 'Días pendientes', amount: diasPendientes });

  // Total = suma del desglose (Property 3, Property 6), redondeado a 2 decimales.
  const total = roundMoney(breakdown.reduce((sum, item) => sum + item.amount, 0));

  return { total, breakdown };
};
