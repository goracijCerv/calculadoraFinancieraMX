import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { provideFiscalConstants } from './core/constants/fiscal-constants.token';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // `withComponentInputBinding()` enlaza los datos resueltos por ruta (p.ej.
    // la `CalculatorConfig` del resolver de `calculadoras/:id`) a los inputs del
    // componente destino; así `CalculatorPageComponent` recibe su `config`
    // directamente desde la ruta (tarea 11.5).
    provideRouter(routes, withComponentInputBinding()),
    provideFiscalConstants()
  ]
};
