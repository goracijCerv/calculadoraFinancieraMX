/**
 * Pruebas del Constants_Update_Workflow (tarea 27.3).
 *
 * Deterministas y SIN RED: la única frontera con la red del script
 * (`SourceFetcher`) se mockea con implementaciones en memoria, de modo que toda
 * la lógica probada aquí es pura y reproducible. Cubren:
 *
 *   - **Property 22** (fast-check, ≥100 iteraciones): `runSanityChecks` RECHAZA
 *     constantes inválidas e identifica la regla violada, y ACEPTA un conjunto
 *     válido derivado de `PREVIOUS_CONSTANTS` (Req 16.5, 16.6).
 *   - Concordancia de fuentes (Req 16.3): dos fuentes idénticas ⇒
 *     `reconcileSources` concuerda y `buildPullRequestProposal` propone valores
 *     sin revisión manual.
 *   - Conflicto de fuentes (Req 16.4): fuentes divergentes ⇒ no concuerdan, la
 *     clave aparece en `conflictingKeys` y se exige revisión manual.
 *   - Reglas transversales del flujo: <2 fuentes lanza; `buildDiff` lista solo
 *     las claves cambiadas con sus enlaces; el archivo generado refleja el año
 *     fiscal y refresca `effectiveFrom`/`lastVerified`; `blocked` cuando la
 *     sanidad falla.
 *
 * _Requirements: 16.3, 16.4, 16.5, 16.6, 16.7_
 */

import fc from 'fast-check';

import type {
  FiscalConstants,
  IsrBracket,
  VacationDaysRow,
} from '../src/app/core/constants/fiscal-constants.types';
import {
  AGREEMENT_EQUALS,
  buildDiff,
  buildPullRequestProposal,
  collectSnapshots,
  compareSourceReadings,
  generateFiscalConstantsFile,
  ISR_RATE_MAX,
  ISR_RATE_MIN,
  PREVIOUS_CONSTANTS,
  reconcileSources,
  runSanityChecks,
  runUpdate,
  type FiscalValueKey,
  type SanityInput,
  type SanityViolation,
  type SourceDescriptor,
  type SourceFetcher,
  type SourceReading,
  type SourceSnapshot,
} from './update-fiscal-constants';

// ---------------------------------------------------------------------------
// Ayudantes: snapshot válido base y clonado profundo determinista
// ---------------------------------------------------------------------------

/** Clona de forma estructural para no mutar `PREVIOUS_CONSTANTS` entre casos. */
const cloneIsr = (table: readonly IsrBracket[]): IsrBracket[] =>
  table.map((b) => ({ ...b }));
const cloneVac = (table: readonly VacationDaysRow[]): VacationDaysRow[] =>
  table.map((r) => ({ ...r }));

/** Snapshot válido derivado de las constantes vigentes (año anterior). */
const validSnapshot = (): SourceSnapshot => ({
  minimumDailyWage: PREVIOUS_CONSTANTS.minimumDailyWage,
  uma: PREVIOUS_CONSTANTS.uma,
  isrMonthlyTable: cloneIsr(PREVIOUS_CONSTANTS.isrMonthlyTable),
  vacationDaysTable: cloneVac(PREVIOUS_CONSTANTS.vacationDaysTable),
});

/** Entrada de sanidad válida base (no viola ninguna regla). */
const validSanityInput = (): SanityInput => ({
  minimumDailyWage: PREVIOUS_CONSTANTS.minimumDailyWage,
  uma: PREVIOUS_CONSTANTS.uma,
  isrMonthlyTable: cloneIsr(PREVIOUS_CONSTANTS.isrMonthlyTable),
  vacationDaysTable: cloneVac(PREVIOUS_CONSTANTS.vacationDaysTable),
  previousMinimumDailyWage: PREVIOUS_CONSTANTS.minimumDailyWage,
});

/** Crea un `SourceFetcher` mock determinista (sin red). */
const mockFetcher = (
  id: string,
  snapshot: SourceSnapshot,
): SourceFetcher => ({
  descriptor: {
    id,
    name: `Fuente ${id}`,
    url: `https://example.test/${id.toLowerCase()}`,
  },
  fetch: () => Promise.resolve(snapshot),
});

/** Lectura (reading) a partir de un descriptor y un snapshot, para reconciliar. */
const reading = (
  id: string,
  snapshot: SourceSnapshot,
): SourceReading<SourceSnapshot> => ({
  source: { id, name: `Fuente ${id}`, url: `https://example.test/${id.toLowerCase()}` },
  value: snapshot,
});

const hasRule = (
  violations: readonly SanityViolation[],
  rule: SanityViolation['rule'],
): boolean => violations.some((v) => v.rule === rule);

// ---------------------------------------------------------------------------
// Property 22: las validaciones de sanidad rechazan constantes inválidas
// ---------------------------------------------------------------------------

describe('runSanityChecks — Property 22: rechaza constantes inválidas (Req 16.5, 16.6)', () => {
  it('Feature: calcula-facil, Property 22: acepta un conjunto válido derivado de PREVIOUS_CONSTANTS', () => {
    const result = runSanityChecks(validSanityInput());
    expect(result.valid).toBe(true);
    expect(result.violations).toEqual([]);
  });

  it('Feature: calcula-facil, Property 22: rechaza salario/UMA no finitos o negativos (numeric-format)', () => {
    const badScalarArb = fc.oneof(
      fc.constant(Number.NaN),
      fc.constant(Number.POSITIVE_INFINITY),
      fc.constant(Number.NEGATIVE_INFINITY),
      fc.double({ min: -1_000_000, max: -0.01, noNaN: true, noDefaultInfinity: true }),
    );
    fc.assert(
      fc.property(badScalarArb, fc.boolean(), (badValue, affectWage) => {
        const input = validSanityInput();
        const candidate: SanityInput = affectWage
          ? { ...input, minimumDailyWage: badValue, previousMinimumDailyWage: Number.NEGATIVE_INFINITY }
          : { ...input, uma: badValue };
        const result = runSanityChecks(candidate);
        expect(result.valid).toBe(false);
        expect(hasRule(result.violations, 'numeric-format')).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('Feature: calcula-facil, Property 22: rechaza salario mínimo menor que el del año anterior (wage-not-below-previous)', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1, max: 100_000, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0.01, max: 50_000, noNaN: true, noDefaultInfinity: true }),
        (previous, drop) => {
          const proposed = Math.max(0, previous - Math.min(drop, previous));
          fc.pre(proposed < previous);
          const result = runSanityChecks({
            ...validSanityInput(),
            minimumDailyWage: proposed,
            previousMinimumDailyWage: previous,
          });
          expect(result.valid).toBe(false);
          expect(hasRule(result.violations, 'wage-not-below-previous')).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('Feature: calcula-facil, Property 22: rechaza tasas ISR fuera de 0%–35% (isr-rate-range)', () => {
    const outOfRangeRate = fc.oneof(
      fc.double({ min: ISR_RATE_MAX + 0.01, max: 500, noNaN: true, noDefaultInfinity: true }),
      fc.double({ min: -500, max: ISR_RATE_MIN - 0.01, noNaN: true, noDefaultInfinity: true }),
    );
    fc.assert(
      fc.property(
        outOfRangeRate,
        fc.nat({ max: PREVIOUS_CONSTANTS.isrMonthlyTable.length - 1 }),
        (rate, index) => {
          const table = cloneIsr(PREVIOUS_CONSTANTS.isrMonthlyTable);
          table[index] = { ...table[index], rateOnExcess: rate };
          const result = runSanityChecks({ ...validSanityInput(), isrMonthlyTable: table });
          expect(result.valid).toBe(false);
          // Tasa negativa viola también numeric-format; en todo caso debe
          // señalarse fuera de rango cuando excede el máximo.
          if (rate > ISR_RATE_MAX) {
            expect(hasRule(result.violations, 'isr-rate-range')).toBe(true);
          } else {
            expect(
              hasRule(result.violations, 'isr-rate-range') ||
                hasRule(result.violations, 'numeric-format'),
            ).toBe(true);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('Feature: calcula-facil, Property 22: rechaza tabla ISR desordenada (isr-order)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: PREVIOUS_CONSTANTS.isrMonthlyTable.length - 1 }),
        (swapIndex) => {
          const table = cloneIsr(PREVIOUS_CONSTANTS.isrMonthlyTable);
          // Romper el orden: el límite inferior del tramo `swapIndex` cae por
          // debajo (o iguala) al del tramo previo.
          table[swapIndex] = {
            ...table[swapIndex],
            lowerLimit: table[swapIndex - 1].lowerLimit - 1,
          };
          const result = runSanityChecks({ ...validSanityInput(), isrMonthlyTable: table });
          expect(result.valid).toBe(false);
          expect(hasRule(result.violations, 'isr-order')).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('Feature: calcula-facil, Property 22: rechaza estructura ISR incompleta/vacía (isr-structure)', () => {
    const brokenTableArb = fc.oneof(
      fc.constant<IsrBracket[]>([]),
      fc
        .nat({ max: PREVIOUS_CONSTANTS.isrMonthlyTable.length - 1 })
        .map((index): IsrBracket[] => {
          const table = cloneIsr(PREVIOUS_CONSTANTS.isrMonthlyTable);
          // Campo faltante/NaN en un tramo: estructura rota.
          table[index] = {
            ...table[index],
            fixedFee: Number.NaN,
          } as IsrBracket;
          return table;
        }),
    );
    fc.assert(
      fc.property(brokenTableArb, (table) => {
        const result = runSanityChecks({ ...validSanityInput(), isrMonthlyTable: table });
        expect(result.valid).toBe(false);
        expect(hasRule(result.violations, 'isr-structure')).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('Feature: calcula-facil, Property 22: rechaza tabla de vacaciones rota/vacía (vacation-structure)', () => {
    const brokenVacArb = fc.oneof(
      fc.constant<VacationDaysRow[]>([]),
      fc
        .nat({ max: PREVIOUS_CONSTANTS.vacationDaysTable.length - 1 })
        .map((index): VacationDaysRow[] => {
          const table = cloneVac(PREVIOUS_CONSTANTS.vacationDaysTable);
          table[index] = { ...table[index], days: Number.NaN } as VacationDaysRow;
          return table;
        }),
    );
    fc.assert(
      fc.property(brokenVacArb, (table) => {
        const result = runSanityChecks({ ...validSanityInput(), vacationDaysTable: table });
        expect(result.valid).toBe(false);
        expect(hasRule(result.violations, 'vacation-structure')).toBe(true);
      }),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Concordancia y conflicto de fuentes (Req 16.3, 16.4)
// ---------------------------------------------------------------------------

describe('compareSourceReadings — concordancia/conflicto por valor', () => {
  it('lanza con menos de dos fuentes (Req 16.2)', () => {
    expect(() =>
      compareSourceReadings(
        'uma',
        [{ source: { id: 'A', name: 'A', url: 'x' }, value: 1 }],
        AGREEMENT_EQUALS.uma,
      ),
    ).toThrow();
  });

  it('propone el valor cuando dos fuentes coinciden (Req 16.3)', () => {
    const result = compareSourceReadings(
      'uma',
      [
        { source: { id: 'DOF', name: 'DOF', url: 'x' }, value: 117.31 },
        { source: { id: 'SAT', name: 'SAT', url: 'y' }, value: 117.31 },
      ],
      AGREEMENT_EQUALS.uma,
    );
    expect(result.agreed).toBe(true);
    if (result.agreed) {
      expect(result.value).toBe(117.31);
      expect(result.sources).toHaveLength(2);
    }
  });

  it('marca conflicto cuando las fuentes difieren (Req 16.4)', () => {
    const result = compareSourceReadings(
      'uma',
      [
        { source: { id: 'DOF', name: 'DOF', url: 'x' }, value: 117.31 },
        { source: { id: 'SAT', name: 'SAT', url: 'y' }, value: 120.0 },
      ],
      AGREEMENT_EQUALS.uma,
    );
    expect(result.agreed).toBe(false);
    if (!result.agreed) {
      expect(result.readings).toHaveLength(2);
    }
  });
});

describe('reconcileSources — reconciliación entre snapshots', () => {
  it('lanza con menos de dos snapshots (Req 16.2)', () => {
    expect(() => reconcileSources([reading('DOF', validSnapshot())])).toThrow();
  });

  it('concuerda cuando dos fuentes son idénticas (Req 16.3)', () => {
    const snapshot = validSnapshot();
    const result = reconcileSources([reading('DOF', snapshot), reading('SAT', validSnapshot())]);
    expect(result.requiresManualReview).toBe(false);
    expect(result.conflictingKeys).toEqual([]);
    expect(result.minimumDailyWage.agreed).toBe(true);
    expect(result.isrMonthlyTable.agreed).toBe(true);
    expect(result.vacationDaysTable.agreed).toBe(true);
  });

  it('identifica la clave en conflicto cuando una fuente difiere (Req 16.4)', () => {
    const diverging = validSnapshot();
    const conflicting: SourceSnapshot = { ...diverging, uma: diverging.uma + 5 };
    const result = reconcileSources([
      reading('DOF', diverging),
      reading('SAT', conflicting),
    ]);
    expect(result.requiresManualReview).toBe(true);
    expect(result.conflictingKeys).toContain<FiscalValueKey>('uma');
    expect(result.uma.agreed).toBe(false);
    // Las demás claves siguen concordando.
    expect(result.minimumDailyWage.agreed).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// buildDiff — solo claves cambiadas, con enlaces de fuente (Req 16.7)
// ---------------------------------------------------------------------------

describe('buildDiff — lista solo los valores cambiados con enlace a la fuente (Req 16.7)', () => {
  const sourceUrls: Record<FiscalValueKey, readonly string[]> = {
    minimumDailyWage: ['https://dof.test/salario'],
    uma: ['https://inegi.test/uma'],
    isrMonthlyTable: ['https://sat.test/isr'],
    vacationDaysTable: ['https://lft.test/vacaciones'],
  };

  it('no reporta cambios cuando los valores propuestos igualan a los previos', () => {
    const diff = buildDiff(
      PREVIOUS_CONSTANTS,
      {
        minimumDailyWage: PREVIOUS_CONSTANTS.minimumDailyWage,
        uma: PREVIOUS_CONSTANTS.uma,
        isrMonthlyTable: cloneIsr(PREVIOUS_CONSTANTS.isrMonthlyTable),
        vacationDaysTable: cloneVac(PREVIOUS_CONSTANTS.vacationDaysTable),
      },
      sourceUrls,
    );
    expect(diff).toEqual([]);
  });

  it('reporta únicamente la clave cambiada con sus enlaces de fuente', () => {
    const diff = buildDiff(
      PREVIOUS_CONSTANTS,
      {
        minimumDailyWage: PREVIOUS_CONSTANTS.minimumDailyWage + 10,
        uma: PREVIOUS_CONSTANTS.uma,
        isrMonthlyTable: cloneIsr(PREVIOUS_CONSTANTS.isrMonthlyTable),
        vacationDaysTable: cloneVac(PREVIOUS_CONSTANTS.vacationDaysTable),
      },
      sourceUrls,
    );
    expect(diff).toHaveLength(1);
    expect(diff[0].key).toBe('minimumDailyWage');
    expect(diff[0].previous).toBe(String(PREVIOUS_CONSTANTS.minimumDailyWage));
    expect(diff[0].proposed).toBe(String(PREVIOUS_CONSTANTS.minimumDailyWage + 10));
    expect(diff[0].sourceUrls).toEqual(sourceUrls.minimumDailyWage);
  });
});

// ---------------------------------------------------------------------------
// generateFiscalConstantsFile — año y metadatos refrescados (Req 16.7)
// ---------------------------------------------------------------------------

describe('generateFiscalConstantsFile — refleja el año fiscal y refresca metadatos (Req 16.7)', () => {
  it('incluye el nuevo año fiscal y las fechas effectiveFrom/lastVerified', () => {
    const contents = generateFiscalConstantsFile({
      fiscalYear: 2027,
      effectiveFrom: '2027-01-01',
      lastVerified: '2026-12-15',
      values: {
        minimumDailyWage: PREVIOUS_CONSTANTS.minimumDailyWage,
        uma: PREVIOUS_CONSTANTS.uma,
        isrMonthlyTable: cloneIsr(PREVIOUS_CONSTANTS.isrMonthlyTable),
        vacationDaysTable: cloneVac(PREVIOUS_CONSTANTS.vacationDaysTable),
      },
      sourceRefs: PREVIOUS_CONSTANTS.sourceRefs,
    });
    expect(contents).toContain('FISCAL_CONSTANTS_2027');
    expect(contents).toContain('fiscalYear: 2027');
    expect(contents).toContain('"2027-01-01"');
    expect(contents).toContain('"2026-12-15"');
    // No cambia el provider del año vigente automáticamente (Req 16.10).
    expect(contents).toContain('app.config.ts');
  });
});

// ---------------------------------------------------------------------------
// buildPullRequestProposal / collectSnapshots / runUpdate (integración pura)
// ---------------------------------------------------------------------------

describe('buildPullRequestProposal — propuesta de PR a partir de snapshots', () => {
  const base = {
    fiscalYear: 2027,
    previous: PREVIOUS_CONSTANTS,
    effectiveFrom: '2027-01-01',
    lastVerified: '2026-12-15',
    sourceRefs: PREVIOUS_CONSTANTS.sourceRefs,
    sourceUrlsByKey: {
      minimumDailyWage: ['https://dof.test/salario'],
      uma: ['https://inegi.test/uma'],
      isrMonthlyTable: ['https://sat.test/isr'],
      vacationDaysTable: ['https://lft.test/vacaciones'],
    } as Record<FiscalValueKey, readonly string[]>,
  };

  it('fuentes concordantes ⇒ propone valores sin revisión manual ni bloqueo (Req 16.3)', () => {
    const proposal = buildPullRequestProposal({
      ...base,
      snapshots: [reading('DOF', validSnapshot()), reading('SAT', validSnapshot())],
    });
    expect(proposal.requiresManualReview).toBe(false);
    expect(proposal.conflictingKeys).toEqual([]);
    expect(proposal.blocked).toBe(false);
    expect(proposal.sanity.valid).toBe(true);
    expect(proposal.fileName).toBe('fiscal-constants.2027.ts');
    expect(proposal.fileContents).toContain('FISCAL_CONSTANTS_2027');
  });

  it('fuentes en conflicto ⇒ requiere revisión manual y lista la clave (Req 16.4)', () => {
    const conflicting: SourceSnapshot = {
      ...validSnapshot(),
      minimumDailyWage: PREVIOUS_CONSTANTS.minimumDailyWage + 50,
    };
    const proposal = buildPullRequestProposal({
      ...base,
      snapshots: [reading('DOF', validSnapshot()), reading('SAT', conflicting)],
    });
    expect(proposal.requiresManualReview).toBe(true);
    expect(proposal.conflictingKeys).toContain<FiscalValueKey>('minimumDailyWage');
    expect(proposal.body).toContain('revisión manual');
  });

  it('sanidad fallida ⇒ bloquea el PR (Req 16.6)', () => {
    // Ambas fuentes coinciden en un salario mínimo menor al previo: concuerdan
    // (sin conflicto) pero violan la sanidad ⇒ el PR queda bloqueado.
    const lowered: SourceSnapshot = {
      ...validSnapshot(),
      minimumDailyWage: PREVIOUS_CONSTANTS.minimumDailyWage - 10,
    };
    const proposal = buildPullRequestProposal({
      ...base,
      snapshots: [reading('DOF', lowered), reading('SAT', { ...lowered })],
    });
    expect(proposal.sanity.valid).toBe(false);
    expect(proposal.blocked).toBe(true);
    expect(proposal.body).toContain('Bloqueado');
  });
});

describe('collectSnapshots / runUpdate — frontera de red mockeada (Req 16.2)', () => {
  const descriptorOk = (f: SourceFetcher): SourceDescriptor => f.descriptor;

  it('collectSnapshots lanza con menos de dos fuentes', async () => {
    await expect(
      collectSnapshots([mockFetcher('DOF', validSnapshot())], 2027),
    ).rejects.toThrow();
  });

  it('collectSnapshots devuelve una lectura por fuente mockeada', async () => {
    const fetchers = [
      mockFetcher('DOF', validSnapshot()),
      mockFetcher('SAT', validSnapshot()),
    ];
    const snapshots = await collectSnapshots(fetchers, 2027);
    expect(snapshots).toHaveLength(2);
    expect(snapshots.map((s) => s.source.id)).toEqual(['DOF', 'SAT']);
    expect(descriptorOk(fetchers[0]).id).toBe('DOF');
  });

  it('runUpdate orquesta fetchers mock y produce una propuesta sin red', async () => {
    const proposal = await runUpdate({
      fetchers: [
        mockFetcher('DOF', validSnapshot()),
        mockFetcher('SAT', validSnapshot()),
      ],
      fiscalYear: 2027,
      previous: PREVIOUS_CONSTANTS,
      effectiveFrom: '2027-01-01',
      lastVerified: '2026-12-15',
      sourceRefs: PREVIOUS_CONSTANTS.sourceRefs,
      sourceUrlsByKey: {
        minimumDailyWage: ['https://dof.test/salario'],
        uma: ['https://inegi.test/uma'],
        isrMonthlyTable: ['https://sat.test/isr'],
        vacationDaysTable: ['https://lft.test/vacaciones'],
      },
    });
    expect(proposal.fiscalYear).toBe(2027);
    expect(proposal.blocked).toBe(false);
    expect(proposal.requiresManualReview).toBe(false);
  });
});
