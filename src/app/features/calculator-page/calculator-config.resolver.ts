// Resolver de `CalculatorConfig` por `:id` de ruta (tarea 11.5).
//
// La ruta común `calculadoras/:id` usa este resolver para obtener, a partir del
// parámetro `:id`, la `CalculatorConfig` concreta que necesita
// `CalculatorPageComponent` (que la recibe por su `input` `config`). Con
// `withComponentInputBinding()` activo (ver `app.config.ts`), el valor resuelto
// bajo la clave `config` se enlaza automáticamente a ese input.
//
// Si el `:id` no corresponde a ninguna calculadora implementada, el resolver
// redirige a la ruta comodín (404) devolviendo un `RedirectCommand`, de modo
// que la plantilla común nunca se renderiza sin configuración (Req 12.1).

import { inject } from '@angular/core';
import {
  Router,
  type ActivatedRouteSnapshot,
  type ResolveFn,
  RedirectCommand,
} from '@angular/router';

import type { CalculatorConfig } from './calculator-config';
import { getCalculatorConfig } from './calculator-configs';

/**
 * Resuelve la `CalculatorConfig` del `:id` de la ruta.
 *
 * @returns la config correspondiente, o un `RedirectCommand` hacia `/404`
 *   cuando el `:id` no tiene una calculadora implementada.
 */
export const calculatorConfigResolver: ResolveFn<CalculatorConfig<unknown>> = (
  route: ActivatedRouteSnapshot,
): CalculatorConfig<unknown> | RedirectCommand => {
  const id = route.paramMap.get('id') ?? '';
  const config = getCalculatorConfig(id);
  if (config) {
    return config;
  }
  const router = inject(Router);
  return new RedirectCommand(router.parseUrl('/404'));
};

/**
 * Resuelve la `description` de SEO de la ruta `calculadoras/:id` a partir de la
 * `CalculatorConfig` del `:id` (tarea 23.1, Req 1.3).
 *
 * El `SeoService` lee esta `description` de `route.data` para alimentar la
 * `meta[name="description"]` y `og:description` de cada calculadora, sin
 * duplicar el copy editorial que ya vive en la config. Si el `:id` no tiene una
 * calculadora implementada devuelve `undefined`, en cuyo caso el `SeoService`
 * aplica la descripción por defecto del sitio (y el `configResolver` redirige
 * al 404).
 */
export const calculatorSeoDescriptionResolver: ResolveFn<string | undefined> = (
  route: ActivatedRouteSnapshot,
): string | undefined => {
  const id = route.paramMap.get('id') ?? '';
  return getCalculatorConfig(id)?.description;
};

/**
 * Resuelve el `title` del documento para la ruta `calculadoras/:id` a partir de
 * la `CalculatorConfig` del `:id` (Req 1.1, 23.1).
 *
 * Se implementa como `ResolveFn<string>` (en lugar de leer `route.data['config']`
 * desde la función `title` de la ruta) porque el dato resuelto por el
 * `configResolver` no está garantizado en `route.data` en el momento en que el
 * router evalúa el título: leerlo allí producía `undefined` y, al acceder a
 * `.name`, abortaba la navegación. Aquí se busca la config por el `:id` de la
 * ruta —disponible de forma síncrona— para construir un título fiable. Si el
 * `:id` no corresponde a una calculadora, se usa un título genérico (el
 * `configResolver` ya redirige al 404 en ese caso).
 */
export const calculatorTitleResolver: ResolveFn<string> = (
  route: ActivatedRouteSnapshot,
): string => {
  const id = route.paramMap.get('id') ?? '';
  const config = getCalculatorConfig(id);
  return config ? `${config.name} — Chécalo` : 'Calculadora — Chécalo';
};
