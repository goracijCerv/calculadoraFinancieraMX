// Constants_Update_Workflow — script de verificación de constantes fiscales (Req 16).
//
// Este archivo es el núcleo del flujo descrito en design.md §"Constants Update
// Workflow (CI)". Vive fuera de `src/` (y fuera de `tsconfig.app.json`/
// `tsconfig.spec.json`), por lo que NO forma parte del build de la app Angular
// ni se ejecuta en runtime: solo corre en CI (GitHub Action, tarea 27.2) y en
// las pruebas deterministas sin red (tarea 27.3).
//
// Diseño (Req 16):
// - La red se aísla tras la interfaz `SourceFetcher` para poder mockearla en
//   pruebas (toda la lógica de abajo es pura y determinista).
// - Consulta al menos dos fuentes por valor (Req 16.2); si concuerdan se
//   propone el valor (Req 16.3), si difieren se marca "requiere revisión
//   manual" identificando el valor en conflicto (Req 16.4).
// - Validaciones de sanidad deterministas (Req 16.5) y, si fallan, el PR se
//   deja en estado bloqueado con la alerta visible (Req 16.6).
// - Genera el `fiscal-constants.<año>.ts` propuesto refrescando
//   `lastVerified`/`effectiveFrom`, el diff anterior→nuevo y el enlace a la
//   fuente oficial por cada valor cambiado (Req 16.7). NO cambia el provider
//   del año vigente en `app.config.ts` (lo hace un humano al aprobar, Req 16.10).
//
// Todas las piezas puras se exportan con nombre para que la tarea 27.3 pueda
// probarlas sin red.

import type {
  FiscalConstants,
  IsrBracket,
  VacationDaysRow,
} from '../src/app/core/constants/fiscal-constants.types';
import { FISCAL_CONSTANTS_2026 } from '../src/app/core/constants/fiscal-constants.2026';

// ---------------------------------------------------------------------------
// Fuentes y fetcher (red aislada tras una interfaz, Req 16.2)
// ---------------------------------------------------------------------------

/** Identificadores de los valores verificables del Constants_Module. */
export type FiscalValueKey =
  | 'minimumDailyWage'
  | 'uma'
  | 'isrMonthlyTable'
  | 'vacationDaysTable';

/** Payload crudo que una fuente devuelve para un año fiscal dado. */
export interface SourceSnapshot {
  readonly minimumDailyWage: number;
  readonly uma: number;
  readonly isrMonthlyTable: readonly IsrBracket[];
  readonly vacationDaysTable: readonly VacationDaysRow[];
}

/**
 * Metadatos de una fuente oficial o pública (DOF, SAT, …). `url` es el enlace
 * que se cita en el PR por cada valor cambiado (Req 16.7).
 */
export interface SourceDescriptor {
  /** Identificador corto y estable (p.ej. "DOF", "SAT"). */
  readonly id: string;
  /** Nombre legible de la fuente. */
  readonly name: string;
  /** Enlace oficial a la publicación consultada. */
  readonly url: string;
}

/**
 * Interfaz que aísla el acceso a la red. En CI se implementa consultando las
 * publicaciones oficiales; en pruebas se mockea para ser determinista y sin
 * red (design.md §Testing Strategy).
 */
export interface SourceFetcher {
  /** La fuente descrita por esta implementación. */
  readonly descriptor: SourceDescriptor;
  /** Obtiene los valores publicados por esta fuente para el año fiscal dado. */
  fetch(fiscalYear: number): Promise<SourceSnapshot>;
}

// ---------------------------------------------------------------------------
// Concordancia / conflicto entre fuentes (Req 16.3, 16.4)
// ---------------------------------------------------------------------------

/** Lectura de una fuente concreta para un valor, con su descriptor. */
export interface SourceReading<T> {
  readonly source: SourceDescriptor;
  readonly value: T;
}

/** Resultado de comparar la concordancia de un valor entre varias fuentes. */
export type AgreementResult<T> =
  | {
      readonly key: FiscalValueKey;
      readonly agreed: true;
      /** Valor propuesto (todas las fuentes coinciden). */
      readonly value: T;
      /** Fuentes consultadas (al menos dos). */
      readonly sources: readonly SourceDescriptor[];
    }
  | {
      readonly key: FiscalValueKey;
      readonly agreed: false;
      /** Lecturas divergentes por fuente, para anotarlas en el PR. */
      readonly readings: readonly SourceReading<T>[];
    };

/** Tolerancia por defecto al comparar importes (céntimos). */
export const MONEY_EPSILON = 0.005;

function numbersAgree(a: number, b: number, epsilon: number): boolean {
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    return false;
  }
  return Math.abs(a - b) <= epsilon;
}

function isrBracketsAgree(
  a: readonly IsrBracket[],
  b: readonly IsrBracket[],
  epsilon: number,
): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((bracket, i) => {
    const other = b[i];
    return (
      numbersAgree(bracket.lowerLimit, other.lowerLimit, epsilon) &&
      numbersAgree(bracket.fixedFee, other.fixedFee, epsilon) &&
      numbersAgree(bracket.rateOnExcess, other.rateOnExcess, epsilon)
    );
  });
}

function vacationRowsAgree(
  a: readonly VacationDaysRow[],
  b: readonly VacationDaysRow[],
): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((row, i) => {
    const other = b[i];
    return row.yearsOfService === other.yearsOfService && row.days === other.days;
  });
}

/**
 * Compara un valor entre dos o más lecturas de fuentes. Si todas coinciden
 * (dentro de la tolerancia, para importes), devuelve `agreed: true` con el
 * valor propuesto (Req 16.3). Si alguna difiere, devuelve `agreed: false` con
 * las lecturas divergentes para identificar el conflicto (Req 16.4).
 *
 * `equals` compara dos valores del tipo; por defecto se usan comparadores
 * numéricos/estructurales acordes a cada `key`.
 */
export function compareSourceReadings<T>(
  key: FiscalValueKey,
  readings: readonly SourceReading<T>[],
  equals: (a: T, b: T) => boolean,
): AgreementResult<T> {
  if (readings.length < 2) {
    throw new Error(
      `compareSourceReadings requiere al menos dos fuentes para "${key}" (Req 16.2); se recibieron ${readings.length}.`,
    );
  }
  const [first, ...rest] = readings;
  const allAgree = rest.every((reading) => equals(first.value, reading.value));
  if (allAgree) {
    return {
      key,
      agreed: true,
      value: first.value,
      sources: readings.map((r) => r.source),
    };
  }
  return { key, agreed: false, readings };
}

/** Comparadores de concordancia por `key`, usados al reconciliar fuentes. */
export const AGREEMENT_EQUALS = {
  minimumDailyWage: (a: number, b: number) => numbersAgree(a, b, MONEY_EPSILON),
  uma: (a: number, b: number) => numbersAgree(a, b, MONEY_EPSILON),
  isrMonthlyTable: (a: readonly IsrBracket[], b: readonly IsrBracket[]) =>
    isrBracketsAgree(a, b, MONEY_EPSILON),
  vacationDaysTable: (a: readonly VacationDaysRow[], b: readonly VacationDaysRow[]) =>
    vacationRowsAgree(a, b),
} as const;

/** Valores reconciliados a partir de varias fuentes (uno por `FiscalValueKey`). */
export interface ReconciliationResult {
  readonly minimumDailyWage: AgreementResult<number>;
  readonly uma: AgreementResult<number>;
  readonly isrMonthlyTable: AgreementResult<readonly IsrBracket[]>;
  readonly vacationDaysTable: AgreementResult<readonly VacationDaysRow[]>;
  /** Claves cuyas fuentes difieren: el PR requiere revisión manual (Req 16.4). */
  readonly conflictingKeys: readonly FiscalValueKey[];
  /** `true` si hay al menos un valor en conflicto. */
  readonly requiresManualReview: boolean;
}

/**
 * Reconcilia los snapshots de varias fuentes en un único conjunto de valores
 * propuestos, identificando qué valores están en conflicto (Req 16.3, 16.4).
 * Pura: recibe las lecturas ya obtenidas (la red vive en `SourceFetcher`).
 */
export function reconcileSources(
  snapshots: readonly SourceReading<SourceSnapshot>[],
): ReconciliationResult {
  if (snapshots.length < 2) {
    throw new Error(
      `reconcileSources requiere al menos dos fuentes (Req 16.2); se recibieron ${snapshots.length}.`,
    );
  }
  const read = <T>(pick: (s: SourceSnapshot) => T): SourceReading<T>[] =>
    snapshots.map((s) => ({ source: s.source, value: pick(s.value) }));

  const minimumDailyWage = compareSourceReadings(
    'minimumDailyWage',
    read((s) => s.minimumDailyWage),
    AGREEMENT_EQUALS.minimumDailyWage,
  );
  const uma = compareSourceReadings('uma', read((s) => s.uma), AGREEMENT_EQUALS.uma);
  const isrMonthlyTable = compareSourceReadings(
    'isrMonthlyTable',
    read((s) => s.isrMonthlyTable),
    AGREEMENT_EQUALS.isrMonthlyTable,
  );
  const vacationDaysTable = compareSourceReadings(
    'vacationDaysTable',
    read((s) => s.vacationDaysTable),
    AGREEMENT_EQUALS.vacationDaysTable,
  );

  const results = { minimumDailyWage, uma, isrMonthlyTable, vacationDaysTable };
  const conflictingKeys = (Object.keys(results) as FiscalValueKey[]).filter(
    (k) => !results[k].agreed,
  );

  return {
    ...results,
    conflictingKeys,
    requiresManualReview: conflictingKeys.length > 0,
  };
}

// ---------------------------------------------------------------------------
// Validaciones de sanidad (Req 16.5)
// ---------------------------------------------------------------------------

/** Límites de porcentaje admisibles para cada tramo de la tabla ISR (Req 16.5). */
export const ISR_RATE_MIN = 0;
export const ISR_RATE_MAX = 35;

/** Un fallo concreto de una validación de sanidad. */
export interface SanityViolation {
  /** Regla violada (identificador estable, usado en el PR/alertas). */
  readonly rule:
    | 'numeric-format'
    | 'wage-not-below-previous'
    | 'isr-rate-range'
    | 'isr-structure'
    | 'isr-order'
    | 'vacation-structure';
  /** Clave del valor afectado. */
  readonly key: FiscalValueKey;
  /** Mensaje legible para la descripción del PR (Req 16.6). */
  readonly message: string;
}

/** Resultado agregado de las validaciones de sanidad. */
export interface SanityResult {
  readonly valid: boolean;
  readonly violations: readonly SanityViolation[];
}

function isValidNumber(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n);
}

/**
 * Valores candidatos ya reconciliados (los que no están en conflicto). Las
 * validaciones de sanidad se aplican sobre estos (Req 16.5). El salario mínimo
 * del año previo se usa para la regla "no menor que el año anterior".
 */
export interface SanityInput {
  readonly minimumDailyWage: number;
  readonly uma: number;
  readonly isrMonthlyTable: readonly IsrBracket[];
  readonly vacationDaysTable: readonly VacationDaysRow[];
  readonly previousMinimumDailyWage: number;
}

/**
 * Ejecuta las validaciones de sanidad deterministas (Req 16.5):
 * - formato numérico válido (sin `NaN`, finito, no negativo donde aplique);
 * - el salario mínimo propuesto no es menor que el del año anterior;
 * - cada porcentaje de la tabla ISR está entre 0% y 35%;
 * - la tabla ISR conserva su estructura (campos completos por tramo) con
 *   tramos ordenados ascendentemente por límite inferior.
 *
 * Pura y determinista. Devuelve todas las violaciones encontradas, cada una
 * identificando la regla violada (Property 22).
 */
export function runSanityChecks(input: SanityInput): SanityResult {
  const violations: SanityViolation[] = [];

  // Formato numérico de los escalares (finito, no negativo).
  if (!isValidNumber(input.minimumDailyWage) || input.minimumDailyWage < 0) {
    violations.push({
      rule: 'numeric-format',
      key: 'minimumDailyWage',
      message: `El salario mínimo propuesto (${String(input.minimumDailyWage)}) no es un número finito no negativo.`,
    });
  }
  if (!isValidNumber(input.uma) || input.uma < 0) {
    violations.push({
      rule: 'numeric-format',
      key: 'uma',
      message: `La UMA propuesta (${String(input.uma)}) no es un número finito no negativo.`,
    });
  }

  // Salario mínimo no menor que el del año anterior.
  if (
    isValidNumber(input.minimumDailyWage) &&
    isValidNumber(input.previousMinimumDailyWage) &&
    input.minimumDailyWage < input.previousMinimumDailyWage
  ) {
    violations.push({
      rule: 'wage-not-below-previous',
      key: 'minimumDailyWage',
      message: `El salario mínimo propuesto (${input.minimumDailyWage}) es menor que el del año anterior (${input.previousMinimumDailyWage}).`,
    });
  }

  validateIsrTable(input.isrMonthlyTable, violations);
  validateVacationTable(input.vacationDaysTable, violations);

  return { valid: violations.length === 0, violations };
}

function validateIsrTable(
  table: readonly IsrBracket[],
  violations: SanityViolation[],
): void {
  if (!Array.isArray(table) || table.length === 0) {
    violations.push({
      rule: 'isr-structure',
      key: 'isrMonthlyTable',
      message: 'La tabla ISR propuesta está vacía o no es un arreglo.',
    });
    return;
  }

  let previousLowerLimit = Number.NEGATIVE_INFINITY;
  table.forEach((bracket, index) => {
    const fields: (keyof IsrBracket)[] = ['lowerLimit', 'fixedFee', 'rateOnExcess'];
    const missing = fields.filter((f) => !isValidNumber(bracket?.[f]));
    if (missing.length > 0) {
      violations.push({
        rule: 'isr-structure',
        key: 'isrMonthlyTable',
        message: `El tramo ISR #${index + 1} tiene campos inválidos o faltantes: ${missing.join(', ')}.`,
      });
      return;
    }

    if (bracket.lowerLimit < 0 || bracket.fixedFee < 0) {
      violations.push({
        rule: 'numeric-format',
        key: 'isrMonthlyTable',
        message: `El tramo ISR #${index + 1} tiene un valor negativo (lowerLimit=${bracket.lowerLimit}, fixedFee=${bracket.fixedFee}).`,
      });
    }

    if (bracket.rateOnExcess < ISR_RATE_MIN || bracket.rateOnExcess > ISR_RATE_MAX) {
      violations.push({
        rule: 'isr-rate-range',
        key: 'isrMonthlyTable',
        message: `El porcentaje del tramo ISR #${index + 1} (${bracket.rateOnExcess}%) está fuera del rango ${ISR_RATE_MIN}%–${ISR_RATE_MAX}%.`,
      });
    }

    if (bracket.lowerLimit <= previousLowerLimit) {
      violations.push({
        rule: 'isr-order',
        key: 'isrMonthlyTable',
        message: `La tabla ISR no está ordenada ascendentemente: el tramo #${index + 1} (lowerLimit=${bracket.lowerLimit}) no es mayor que el anterior (${previousLowerLimit}).`,
      });
    }
    previousLowerLimit = bracket.lowerLimit;
  });
}

function validateVacationTable(
  table: readonly VacationDaysRow[],
  violations: SanityViolation[],
): void {
  if (!Array.isArray(table) || table.length === 0) {
    violations.push({
      rule: 'vacation-structure',
      key: 'vacationDaysTable',
      message: 'La tabla de días de vacaciones propuesta está vacía o no es un arreglo.',
    });
    return;
  }

  table.forEach((row, index) => {
    if (!isValidNumber(row?.yearsOfService) || !isValidNumber(row?.days)) {
      violations.push({
        rule: 'vacation-structure',
        key: 'vacationDaysTable',
        message: `El renglón de vacaciones #${index + 1} tiene campos inválidos o faltantes.`,
      });
      return;
    }
    if (row.yearsOfService < 0 || row.days < 0) {
      violations.push({
        rule: 'numeric-format',
        key: 'vacationDaysTable',
        message: `El renglón de vacaciones #${index + 1} tiene un valor negativo.`,
      });
    }
  });
}

// ---------------------------------------------------------------------------
// Diff del valor anterior → valor nuevo (Req 16.7)
// ---------------------------------------------------------------------------

/** Una entrada del diff: valor anterior → valor nuevo + enlace a la fuente. */
export interface DiffEntry {
  readonly key: FiscalValueKey;
  /** Representación legible del valor anterior. */
  readonly previous: string;
  /** Representación legible del valor nuevo. */
  readonly proposed: string;
  /** Enlace a la fuente oficial (DOF/SAT) que respalda el cambio (Req 16.7). */
  readonly sourceUrls: readonly string[];
}

function formatValue(key: FiscalValueKey, value: unknown): string {
  if (key === 'isrMonthlyTable' || key === 'vacationDaysTable') {
    return JSON.stringify(value);
  }
  return String(value);
}

function valuesEqual(key: FiscalValueKey, a: unknown, b: unknown): boolean {
  switch (key) {
    case 'minimumDailyWage':
    case 'uma':
      return AGREEMENT_EQUALS[key](a as number, b as number);
    case 'isrMonthlyTable':
      return AGREEMENT_EQUALS.isrMonthlyTable(
        a as IsrBracket[],
        b as IsrBracket[],
      );
    case 'vacationDaysTable':
      return AGREEMENT_EQUALS.vacationDaysTable(
        a as VacationDaysRow[],
        b as VacationDaysRow[],
      );
    default:
      return false;
  }
}

/**
 * Valores propuestos para el nuevo año fiscal, ya reconciliados y validados.
 */
export interface ProposedValues {
  readonly minimumDailyWage: number;
  readonly uma: number;
  readonly isrMonthlyTable: readonly IsrBracket[];
  readonly vacationDaysTable: readonly VacationDaysRow[];
}

/**
 * Calcula el diff de los valores que cambian respecto a las constantes previas,
 * incluyendo el enlace a la fuente oficial por cada cambio (Req 16.7). Solo
 * aparecen las claves cuyo valor difiere del año anterior.
 */
export function buildDiff(
  previous: FiscalConstants,
  proposed: ProposedValues,
  sourceUrlsByKey: Readonly<Record<FiscalValueKey, readonly string[]>>,
): readonly DiffEntry[] {
  const keys: FiscalValueKey[] = [
    'minimumDailyWage',
    'uma',
    'isrMonthlyTable',
    'vacationDaysTable',
  ];
  const diff: DiffEntry[] = [];
  for (const key of keys) {
    const prevValue = previous[key];
    const newValue = proposed[key];
    if (!valuesEqual(key, prevValue, newValue)) {
      diff.push({
        key,
        previous: formatValue(key, prevValue),
        proposed: formatValue(key, newValue),
        sourceUrls: sourceUrlsByKey[key] ?? [],
      });
    }
  }
  return diff;
}

// ---------------------------------------------------------------------------
// Generación del archivo fiscal-constants.<año>.ts propuesto (Req 16.7)
// ---------------------------------------------------------------------------

function isrTableToSource(table: readonly IsrBracket[]): string {
  const rows = table
    .map(
      (b) =>
        `  { lowerLimit: ${b.lowerLimit}, fixedFee: ${b.fixedFee}, rateOnExcess: ${b.rateOnExcess} },`,
    )
    .join('\n');
  return `[\n${rows}\n]`;
}

function vacationTableToSource(table: readonly VacationDaysRow[]): string {
  const rows = table
    .map((r) => `  { yearsOfService: ${r.yearsOfService}, days: ${r.days} },`)
    .join('\n');
  return `[\n${rows}\n]`;
}

function sourceRefsToSource(refs: Readonly<Record<string, string>>): string {
  const entries = Object.entries(refs)
    .map(([k, v]) => `    ${k}: ${JSON.stringify(v)},`)
    .join('\n');
  return `{\n${entries}\n  }`;
}

/** Entrada para generar el contenido del archivo propuesto. */
export interface FiscalFileInput {
  readonly fiscalYear: number;
  /** ISO 8601 (p.ej. "2027-01-01"). */
  readonly effectiveFrom: string;
  /** ISO 8601 de la verificación (fecha en que corre el workflow). */
  readonly lastVerified: string;
  readonly values: ProposedValues;
  readonly sourceRefs: Readonly<Record<string, string>>;
}

/**
 * Genera el contenido TypeScript del archivo `fiscal-constants.<año>.ts`
 * propuesto, refrescando `effectiveFrom`/`lastVerified` (Req 16.7). El provider
 * del año vigente NO se modifica (eso lo hace un humano al aprobar, Req 16.10).
 * Pura: devuelve una cadena, no escribe en disco.
 */
export function generateFiscalConstantsFile(input: FiscalFileInput): string {
  const { fiscalYear, effectiveFrom, lastVerified, values, sourceRefs } = input;
  const constName = `FISCAL_CONSTANTS_${fiscalYear}`;
  const isrConst = `ISR_MONTHLY_TABLE_${fiscalYear}`;
  const vacConst = `VACATION_DAYS_TABLE_${fiscalYear}`;

  return `// Constants_Module — valores oficiales del año fiscal ${fiscalYear} (Req 5.3, 5.4).
//
// ARCHIVO GENERADO por scripts/update-fiscal-constants.ts (Constants_Update_Workflow,
// Req 16). Revisar cada valor contra la fuente oficial citada antes de aprobar.
// El provider del año vigente (app.config.ts) NO se cambia automáticamente: un
// humano lo actualiza al aprobar el PR (Req 16.10).

import type { FiscalConstants } from './fiscal-constants.types';

const ${isrConst}: FiscalConstants['isrMonthlyTable'] = ${isrTableToSource(values.isrMonthlyTable)};

const ${vacConst}: FiscalConstants['vacationDaysTable'] = ${vacationTableToSource(values.vacationDaysTable)};

export const ${constName}: FiscalConstants = {
  fiscalYear: ${fiscalYear},
  effectiveFrom: ${JSON.stringify(effectiveFrom)},
  lastVerified: ${JSON.stringify(lastVerified)},
  minimumDailyWage: ${values.minimumDailyWage},
  uma: ${values.uma},
  isrMonthlyTable: ${isrConst},
  vacationDaysTable: ${vacConst},
  sourceRefs: ${sourceRefsToSource(sourceRefs)},
};
`;
}

// ---------------------------------------------------------------------------
// Orquestación del PR (contenido estructurado para la GitHub Action, 27.2)
// ---------------------------------------------------------------------------

/** Contenido estructurado que la GitHub Action (27.2) convierte en un PR. */
export interface PullRequestProposal {
  readonly fiscalYear: number;
  /** Nombre del archivo propuesto, p.ej. "fiscal-constants.2027.ts". */
  readonly fileName: string;
  /** Contenido del archivo propuesto (Req 16.7). */
  readonly fileContents: string;
  /** Diff por valor cambiado + enlaces a la fuente (Req 16.7). */
  readonly diff: readonly DiffEntry[];
  /** Resultado de las validaciones de sanidad (Req 16.5). */
  readonly sanity: SanityResult;
  /** Valores en conflicto entre fuentes (Req 16.4). */
  readonly conflictingKeys: readonly FiscalValueKey[];
  /** `true` si el PR debe crearse bloqueado (sanidad fallida, Req 16.6). */
  readonly blocked: boolean;
  /** `true` si requiere revisión manual (fuentes en conflicto, Req 16.4). */
  readonly requiresManualReview: boolean;
  /** Cuerpo de la descripción del PR en Markdown. */
  readonly body: string;
}

/** Opciones para construir la propuesta de PR. */
export interface BuildProposalOptions {
  readonly fiscalYear: number;
  /** Lecturas de todas las fuentes (≥2). La red ya se ejecutó. */
  readonly snapshots: readonly SourceReading<SourceSnapshot>[];
  /** Constantes del año anterior (para el diff y la regla de salario). */
  readonly previous: FiscalConstants;
  /** `effectiveFrom` del nuevo año (ISO 8601). */
  readonly effectiveFrom: string;
  /** `lastVerified` (ISO 8601, momento en que corre el workflow). */
  readonly lastVerified: string;
  /** Citas oficiales por valor/tabla para el nuevo archivo. */
  readonly sourceRefs: Readonly<Record<string, string>>;
  /** Enlaces a la fuente oficial por valor, para el diff (Req 16.7). */
  readonly sourceUrlsByKey: Readonly<Record<FiscalValueKey, readonly string[]>>;
}

/**
 * Orquesta las piezas puras en una propuesta de PR completa (Req 16.3–16.7).
 * No realiza E/S de red ni de disco: recibe los snapshots ya obtenidos y
 * devuelve el contenido que la GitHub Action (27.2) materializa en un PR.
 *
 * Para los valores en conflicto entre fuentes se conserva el valor del año
 * anterior en el archivo propuesto y se marca el PR como "requiere revisión
 * manual" (Req 16.4); así el archivo sigue siendo compilable para las pruebas.
 */
export function buildPullRequestProposal(
  options: BuildProposalOptions,
): PullRequestProposal {
  const {
    fiscalYear,
    snapshots,
    previous,
    effectiveFrom,
    lastVerified,
    sourceRefs,
    sourceUrlsByKey,
  } = options;

  const reconciliation = reconcileSources(snapshots);

  // Valor propuesto por clave: el acordado si hay concordancia; si hay
  // conflicto, se conserva el valor previo (y se marca revisión manual).
  const proposed: ProposedValues = {
    minimumDailyWage: reconciliation.minimumDailyWage.agreed
      ? reconciliation.minimumDailyWage.value
      : previous.minimumDailyWage,
    uma: reconciliation.uma.agreed ? reconciliation.uma.value : previous.uma,
    isrMonthlyTable: reconciliation.isrMonthlyTable.agreed
      ? reconciliation.isrMonthlyTable.value
      : previous.isrMonthlyTable,
    vacationDaysTable: reconciliation.vacationDaysTable.agreed
      ? reconciliation.vacationDaysTable.value
      : previous.vacationDaysTable,
  };

  const sanity = runSanityChecks({
    minimumDailyWage: proposed.minimumDailyWage,
    uma: proposed.uma,
    isrMonthlyTable: proposed.isrMonthlyTable,
    vacationDaysTable: proposed.vacationDaysTable,
    previousMinimumDailyWage: previous.minimumDailyWage,
  });

  const diff = buildDiff(previous, proposed, sourceUrlsByKey);

  const fileContents = generateFiscalConstantsFile({
    fiscalYear,
    effectiveFrom,
    lastVerified,
    values: proposed,
    sourceRefs,
  });

  const fileName = `fiscal-constants.${fiscalYear}.ts`;
  const body = renderPullRequestBody({
    fiscalYear,
    diff,
    sanity,
    reconciliation,
  });

  return {
    fiscalYear,
    fileName,
    fileContents,
    diff,
    sanity,
    conflictingKeys: reconciliation.conflictingKeys,
    blocked: !sanity.valid,
    requiresManualReview: reconciliation.requiresManualReview,
    body,
  };
}

/**
 * Renderiza el cuerpo Markdown de la descripción del PR: estado, conflictos
 * (Req 16.4), alertas de sanidad (Req 16.6) y diff con fuentes (Req 16.7).
 * Pura: solo formatea texto.
 */
export function renderPullRequestBody(params: {
  readonly fiscalYear: number;
  readonly diff: readonly DiffEntry[];
  readonly sanity: SanityResult;
  readonly reconciliation: ReconciliationResult;
}): string {
  const { fiscalYear, diff, sanity, reconciliation } = params;
  const lines: string[] = [];

  lines.push(`## Actualización asistida de constantes fiscales ${fiscalYear}`);
  lines.push('');
  lines.push(
    'Propuesta automática del `Constants_Update_Workflow` (Req 16). **No** cambia el provider del año vigente: un humano debe aprobar y actualizar `app.config.ts` (Req 16.10).',
  );
  lines.push('');

  if (!sanity.valid) {
    lines.push('### ⛔ Bloqueado por validaciones de sanidad (Req 16.6)');
    for (const v of sanity.violations) {
      lines.push(`- **[${v.rule}]** (\`${v.key}\`): ${v.message}`);
    }
    lines.push('');
  } else {
    lines.push('### ✅ Validaciones de sanidad superadas (Req 16.5)');
    lines.push('');
  }

  if (reconciliation.requiresManualReview) {
    lines.push('### ⚠️ Requiere revisión manual: fuentes en conflicto (Req 16.4)');
    for (const key of reconciliation.conflictingKeys) {
      const result = reconciliation[key];
      if (!result.agreed) {
        lines.push(`- \`${key}\`: las fuentes consultadas difieren:`);
        for (const reading of result.readings) {
          lines.push(
            `  - ${reading.source.name} (${reading.source.id}): \`${formatValue(key, reading.value)}\``,
          );
        }
      }
    }
    lines.push('');
  }

  lines.push('### Diff de valores cambiados (Req 16.7)');
  if (diff.length === 0) {
    lines.push('- Sin cambios respecto al año anterior.');
  } else {
    for (const entry of diff) {
      lines.push(`- \`${entry.key}\``);
      lines.push(`  - Anterior: \`${entry.previous}\``);
      lines.push(`  - Propuesto: \`${entry.proposed}\``);
      if (entry.sourceUrls.length > 0) {
        lines.push(`  - Fuente(s): ${entry.sourceUrls.map((u) => `<${u}>`).join(', ')}`);
      }
    }
  }
  lines.push('');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Entry point de CLI (solo E/S; toda la lógica anterior es pura y testeable)
// ---------------------------------------------------------------------------

/**
 * Obtiene los snapshots de todas las fuentes (única parte con red, Req 16.2).
 * Separada de la lógica pura para poder mockear `fetchers` en pruebas.
 */
export async function collectSnapshots(
  fetchers: readonly SourceFetcher[],
  fiscalYear: number,
): Promise<SourceReading<SourceSnapshot>[]> {
  if (fetchers.length < 2) {
    throw new Error(
      `Se requieren al menos dos fuentes (Req 16.2); se configuraron ${fetchers.length}.`,
    );
  }
  const snapshots = await Promise.all(
    fetchers.map(async (f) => ({
      source: f.descriptor,
      value: await f.fetch(fiscalYear),
    })),
  );
  return snapshots;
}

/**
 * Ejecuta el flujo completo: recolecta de las fuentes (red) y construye la
 * propuesta de PR (lógica pura). Devuelve el resultado estructurado para que
 * la GitHub Action (27.2) lo materialice.
 */
export async function runUpdate(options: {
  readonly fetchers: readonly SourceFetcher[];
  readonly fiscalYear: number;
  readonly previous: FiscalConstants;
  readonly effectiveFrom: string;
  readonly lastVerified: string;
  readonly sourceRefs: Readonly<Record<string, string>>;
  readonly sourceUrlsByKey: Readonly<Record<FiscalValueKey, readonly string[]>>;
}): Promise<PullRequestProposal> {
  const snapshots = await collectSnapshots(options.fetchers, options.fiscalYear);
  return buildPullRequestProposal({
    fiscalYear: options.fiscalYear,
    snapshots,
    previous: options.previous,
    effectiveFrom: options.effectiveFrom,
    lastVerified: options.lastVerified,
    sourceRefs: options.sourceRefs,
    sourceUrlsByKey: options.sourceUrlsByKey,
  });
}

/** Año fiscal de las constantes vigentes (base del diff y del "año anterior"). */
export const PREVIOUS_CONSTANTS: FiscalConstants = FISCAL_CONSTANTS_2026;
