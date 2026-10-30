import { Routes } from '@angular/router';

import {
  calculatorConfigResolver,
  calculatorSeoDescriptionResolver,
  calculatorTitleResolver,
} from './features/calculator-page/calculator-config.resolver';

/**
 * Tabla de rutas de CalculaFácil (Req 1.4, 12.1).
 *
 * Todas las páginas se cargan de forma perezosa con `loadComponent` para
 * mantener el bundle inicial ligero (PLAN 4.3, Req 11.1). El `CalculatorRegistry`
 * declara la metadata de cada calculadora; la ruta común `calculadoras/:id`
 * resuelve la plantilla compartida `CalculatorPageComponent`, que especializa su
 * comportamiento según el `:id`. Un `resolve` traduce el `:id` a la
 * `CalculatorConfig` concreta y, con `withComponentInputBinding()`, la enlaza al
 * input `config` del componente; un `:id` sin calculadora implementada redirige
 * al 404 (Req 1.4, 12.1).
 *
 * La ruta comodín `**` siempre va al final y renderiza `NotFoundComponent`, que
 * muestra un mensaje descriptivo y un enlace de regreso al inicio (Req 12.1).
 *
 * Requirements: 1.4, 12.1
 */
export const routes: Routes = [
  {
    path: '',
    title: 'Chécalo — Tus derechos también cuentan',
    // Metadatos de SEO por ruta (tarea 23.1, Req 1.1): la `description` alimenta
    // `meta[name="description"]` y `og:description`; el `SeoService` deriva
    // `og:title` del `title` de la ruta. Añadidos de forma aditiva para no
    // alterar la carga de componentes (coordinación con tarea 24.1).
    data: {
      description:
        'Calculadoras laborales y fiscales gratuitas para México: finiquito, ' +
        'liquidación, aguinaldo, vacaciones, ISR y más. Cálculo instantáneo en ' +
        'tu navegador, sin registro.',
    },
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'calculadoras',
    title: 'Calculadoras — Chécalo',
    data: {
      description:
        'Explora todas las calculadoras laborales y fiscales de Chécalo: ' +
        'finiquito, liquidación, aguinaldo, vacaciones, ISR, sueldo neto/bruto, ' +
        'salario diario y PTU.',
    },
    loadComponent: () =>
      import('./features/calculators-list/calculators-list.component').then(
        (m) => m.CalculatorsListComponent,
      ),
  },
  {
    path: 'calculadoras/:id',
    loadComponent: () =>
      import('./features/calculator-page/calculator-page.component').then(
        (m) => m.CalculatorPageComponent,
      ),
    // Resuelve la config por `:id` (redirige al 404 si no existe) y la enlaza al
    // input `config` del componente vía `withComponentInputBinding()`.
    resolve: {
      config: calculatorConfigResolver,
      // Deriva la `description` de la ruta de la propia `CalculatorConfig`
      // resuelta, de modo que cada calculadora expone su descripción editorial
      // como meta description / og:description (Req 1.3) sin duplicar copy.
      description: calculatorSeoDescriptionResolver,
    },
    // El `title` se resuelve con `calculatorTitleResolver`, que busca la config
    // por el `:id` de la ruta. Antes se derivaba de `route.data['config']` desde
    // una función `title` en línea, pero ese dato resuelto no está garantizado
    // en `route.data` cuando el router evalúa el título, y acceder a `.name`
    // sobre `undefined` abortaba la navegación a cualquier calculadora.
    title: calculatorTitleResolver,
  },
  {
    path: 'ayuda',
    title: 'Ayuda — Chécalo',
    data: {
      description:
        'Preguntas frecuentes y guías sobre finiquito, liquidación, aguinaldo, ' +
        'vacaciones e ISR en México. Resuelve tus dudas laborales y fiscales.',
    },
    loadComponent: () =>
      import('./features/help/help.component').then((m) => m.HelpComponent),
  },
  {
    path: 'privacidad',
    title: 'Aviso de privacidad — Chécalo',
    data: {
      description:
        'Aviso de privacidad de Chécalo: tus datos no salen de tu ' +
        'navegador. Todos los cálculos se ejecutan localmente, sin servidor.',
    },
    loadComponent: () =>
      import('./features/privacy/privacy.component').then((m) => m.PrivacyComponent),
  },
  {
    path: '**',
    title: 'Página no encontrada — Chécalo',
    data: {
      description:
        'La página que buscas no existe. Vuelve al inicio de Chécalo para ' +
        'encontrar la calculadora que necesitas.',
    },
    loadComponent: () =>
      import('./features/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];
