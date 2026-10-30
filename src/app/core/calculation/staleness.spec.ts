// Pruebas de ejemplo del Staleness_Check (Req 17.1, 17.2, 17.3).
//
// La property test de la relación de desfase (Property 23) vive en la tarea
// 11.8; aquí sólo se cubren ejemplos representativos y la pureza de la función.

import { checkStaleness, type StalenessStatus } from './staleness';

describe('checkStaleness', () => {
  it('no marca desfase cuando el año actual coincide con el año fiscal', () => {
    const status = checkStaleness(2026, { fiscalYear: 2026 });
    expect(status.isStale).toBe(false);
  });

  it('no marca desfase cuando el año actual es anterior al año fiscal', () => {
    const status = checkStaleness(2025, { fiscalYear: 2026 });
    expect(status.isStale).toBe(false);
  });

  it('marca desfase cuando el año actual es posterior al año fiscal (Req 17.2)', () => {
    const status = checkStaleness(2027, { fiscalYear: 2026 });
    expect(status.isStale).toBe(true);
  });

  it('expone el año fiscal de las constantes y el año actual observado (Req 17.1)', () => {
    const status: StalenessStatus = checkStaleness(2028, { fiscalYear: 2026 });
    expect(status.fiscalYear).toBe(2026);
    expect(status.currentYear).toBe(2028);
    expect(status.isStale).toBe(true);
  });

  it('es pura: no muta las constantes recibidas', () => {
    const constants = { fiscalYear: 2026 };
    const snapshot = { ...constants };
    checkStaleness(2030, constants);
    expect(constants).toEqual(snapshot);
  });

  it('es determinista: misma entrada ⇒ misma salida', () => {
    const first = checkStaleness(2027, { fiscalYear: 2026 });
    const second = checkStaleness(2027, { fiscalYear: 2026 });
    expect(first).toEqual(second);
  });
});
