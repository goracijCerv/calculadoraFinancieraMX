// Constants_Module — valores oficiales del año fiscal 2026 (Req 5.3, 5.4).
//
// Todas las cifras provienen de la verificación oficial de la Fase 0
// documentada en `docs/formulas.md` (con cita de fuente y fecha del DOF).
// NINGÚN valor se inventa aquí. Para actualizar a otro año fiscal se crea un
// nuevo archivo `fiscal-constants.<año>.ts` con los valores verificados y se
// cambia el provider del token, sin tocar la lógica de las calculadoras.
//
// Fuentes (ver docs/formulas.md para el detalle y los enlaces):
// - Salario mínimo general: CONASAMI / DOF 09-dic-2025, vigente desde 2026-01-01.
// - UMA diaria: INEGI / DOF, vigente del 2026-02-01 al 2027-01-31.
// - Tarifa mensual ISR: Art. 96 LISR, Anexo 8 RMF / DOF 28-dic-2025.
// - Tabla de días de vacaciones: Art. 76 LFT (reforma 2023 "Vacaciones Dignas").

import type { FiscalConstants } from './fiscal-constants.types';

/**
 * Tarifa mensual del ISR 2026 (11 tramos), Art. 96 LISR / Anexo 8 RMF.
 * Fuente: docs/formulas.md §3. Ordenada ascendentemente por límite inferior.
 */
const ISR_MONTHLY_TABLE_2026: FiscalConstants['isrMonthlyTable'] = [
  { lowerLimit: 0.01, fixedFee: 0.0, rateOnExcess: 1.92 },
  { lowerLimit: 844.6, fixedFee: 16.22, rateOnExcess: 6.4 },
  { lowerLimit: 7168.52, fixedFee: 420.95, rateOnExcess: 10.88 },
  { lowerLimit: 12598.03, fixedFee: 1011.68, rateOnExcess: 16.0 },
  { lowerLimit: 14644.65, fixedFee: 1339.14, rateOnExcess: 17.92 },
  { lowerLimit: 17533.65, fixedFee: 1856.84, rateOnExcess: 21.36 },
  { lowerLimit: 35362.84, fixedFee: 5665.16, rateOnExcess: 23.52 },
  { lowerLimit: 55736.69, fixedFee: 10457.09, rateOnExcess: 30.0 },
  { lowerLimit: 106410.51, fixedFee: 25659.23, rateOnExcess: 32.0 },
  { lowerLimit: 141880.67, fixedFee: 37009.69, rateOnExcess: 34.0 },
  { lowerLimit: 425642.0, fixedFee: 133488.54, rateOnExcess: 35.0 },
];

/**
 * Tabla de días de vacaciones 2026, Art. 76 LFT (reforma 2023).
 * Fuente: docs/formulas.md §4. Monótona no decreciente.
 * Del 6.º año en adelante se suman 2 días por cada quinquenio de servicio.
 */
const VACATION_DAYS_TABLE_2026: FiscalConstants['vacationDaysTable'] = [
  { yearsOfService: 1, days: 12 },
  { yearsOfService: 2, days: 14 },
  { yearsOfService: 3, days: 16 },
  { yearsOfService: 4, days: 18 },
  { yearsOfService: 5, days: 20 },
  { yearsOfService: 6, days: 22 },
  { yearsOfService: 11, days: 24 },
  { yearsOfService: 16, days: 26 },
  { yearsOfService: 21, days: 28 },
  { yearsOfService: 26, days: 30 },
  { yearsOfService: 31, days: 32 },
];

/**
 * Constantes oficiales del año fiscal 2026 (Req 5.3).
 * Fuente única de valores para las calculadoras.
 */
export const FISCAL_CONSTANTS_2026: FiscalConstants = {
  fiscalYear: 2026,
  effectiveFrom: '2026-01-01',
  lastVerified: '2026-01-01',
  // Salario mínimo general diario (zona general), DOF 09-dic-2025.
  minimumDailyWage: 315.04,
  // UMA diaria, vigente del 2026-02-01 al 2027-01-31.
  uma: 117.31,
  isrMonthlyTable: ISR_MONTHLY_TABLE_2026,
  vacationDaysTable: VACATION_DAYS_TABLE_2026,
  sourceRefs: {
    minimumDailyWage:
      'CONASAMI · DOF 09-dic-2025 · Salario mínimo general 2026 ($315.04/día) · docs/formulas.md §1',
    uma: 'INEGI · DOF · UMA diaria 2026 ($117.31) · docs/formulas.md §2',
    isrMonthlyTable:
      'SAT · Art. 96 LISR, Anexo 8 RMF · DOF 28-dic-2025 · Tarifa mensual ISR 2026 · docs/formulas.md §3',
    vacationDaysTable:
      'LFT · Art. 76 (reforma 2023 "Vacaciones Dignas") · Tabla de días de vacaciones · docs/formulas.md §4',
  },
};
