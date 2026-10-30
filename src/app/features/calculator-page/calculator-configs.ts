// Mapa id → CalculatorConfig (tarea 11.5).
//
// `CALCULATOR_REGISTRY` (tarea 7.1) describe la METADATA de cada calculadora
// (id, index, name, description, phase) para el índice editorial y la búsqueda.
// Este mapa complementa ese registro con la CONFIGURACIÓN EJECUTABLE de las
// calculadoras ya implementadas: campos del formulario, copy, `toInput`,
// validadores cruzados y la función pura de cálculo.
//
// La ruta común `calculadoras/:id` usa este mapa para resolver, por el `:id`,
// la `CalculatorConfig` que recibe `CalculatorPageComponent` (ver
// `calculator-config.resolver.ts`). Un `:id` sin configuración (p.ej. una
// calculadora de una fase futura aún no implementada) no está en el mapa, de
// modo que el resolver puede redirigir al 404.
//
// Las calculadoras de Fases 2 y 3 añadirán aquí su propia entrada conforme se
// implementen; este archivo es el único punto de registro de configuraciones.

import { AGUINALDO_CONFIG } from './aguinaldo.config';
import type { CalculatorConfig } from './calculator-config';
import { DIAS_VACACIONES_CONFIG } from './dias-vacaciones.config';
import { FINIQUITO_CONFIG } from './finiquito.config';
import { ISR_CONFIG } from './isr.config';
import { LIQUIDACION_CONFIG } from './liquidacion.config';
import { PTU_CONFIG } from './ptu.config';
import { SALARIO_DIARIO_CONFIG } from './salario-diario.config';
import { SUELDO_CONFIG } from './sueldo.config';
import { VACACIONES_CONFIG } from './vacaciones.config';

/**
 * Mapa inmutable de `id` de calculadora a su `CalculatorConfig`.
 *
 * El tipo del valor es `CalculatorConfig<unknown>` porque cada calculadora
 * tiene su propio DTO de entrada; la plantilla común es genérica y no necesita
 * conocer el tipo concreto en el punto de resolución por ruta. Cada config
 * conserva su tipado fuerte en su propio archivo (p.ej. `FINIQUITO_CONFIG` es
 * `CalculatorConfig<FiniquitoInput>`).
 */
export const CALCULATOR_CONFIGS: ReadonlyMap<string, CalculatorConfig<unknown>> = new Map<
  string,
  CalculatorConfig<unknown>
>([
  [FINIQUITO_CONFIG.id, FINIQUITO_CONFIG as CalculatorConfig<unknown>],
  [LIQUIDACION_CONFIG.id, LIQUIDACION_CONFIG as CalculatorConfig<unknown>],
  [VACACIONES_CONFIG.id, VACACIONES_CONFIG as CalculatorConfig<unknown>],
  [AGUINALDO_CONFIG.id, AGUINALDO_CONFIG as CalculatorConfig<unknown>],
  [DIAS_VACACIONES_CONFIG.id, DIAS_VACACIONES_CONFIG as CalculatorConfig<unknown>],
  [ISR_CONFIG.id, ISR_CONFIG as CalculatorConfig<unknown>],
  [PTU_CONFIG.id, PTU_CONFIG as CalculatorConfig<unknown>],
  [SALARIO_DIARIO_CONFIG.id, SALARIO_DIARIO_CONFIG as CalculatorConfig<unknown>],
  [SUELDO_CONFIG.id, SUELDO_CONFIG as CalculatorConfig<unknown>],
]);

/**
 * Devuelve la `CalculatorConfig` registrada para un `id`, o `undefined` si no
 * hay ninguna calculadora implementada con ese identificador.
 */
export function getCalculatorConfig(id: string): CalculatorConfig<unknown> | undefined {
  return CALCULATOR_CONFIGS.get(id);
}
