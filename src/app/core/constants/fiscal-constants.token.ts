// Constants_Module — InjectionToken y provider del año fiscal vigente (Req 5.4).
//
// Las calculadoras consumen las constantes a través de este token, nunca
// importando un archivo de año concreto. Así, actualizar el año fiscal vigente
// solo implica cambiar a qué conjunto de constantes apunta el provider (p.ej.
// de `FISCAL_CONSTANTS_2026` a `FISCAL_CONSTANTS_2027`), sin tocar la lógica de
// ninguna calculadora.

import { InjectionToken, type Provider } from '@angular/core';
import type { FiscalConstants } from './fiscal-constants.types';
import { FISCAL_CONSTANTS_2026 } from './fiscal-constants.2026';

/**
 * Token de inyección de las constantes fiscales del año vigente.
 * Las funciones y servicios de cálculo inyectan este token en lugar de
 * depender de un archivo de año específico (Req 5.3, 5.4).
 */
export const FISCAL_CONSTANTS = new InjectionToken<FiscalConstants>('FISCAL_CONSTANTS');

/**
 * Conjunto de constantes del año fiscal vigente. Punto único a cambiar al
 * actualizar de año (p.ej. apuntarlo a `FISCAL_CONSTANTS_2027`).
 */
export const CURRENT_FISCAL_CONSTANTS: FiscalConstants = FISCAL_CONSTANTS_2026;

/**
 * Provider del año fiscal vigente, para registrarse en `app.config.ts`.
 * Actualizar el año solo requiere cambiar `CURRENT_FISCAL_CONSTANTS`.
 */
export const provideFiscalConstants = (): Provider => ({
  provide: FISCAL_CONSTANTS,
  useValue: CURRENT_FISCAL_CONSTANTS,
});
