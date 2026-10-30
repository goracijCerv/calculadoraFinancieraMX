import { Route } from '@angular/router';

import { routes } from './app.routes';

/**
 * Pruebas de la tabla de rutas (Req 1.4, 12.1).
 *
 * Validan la forma declarativa de `routes` sin instanciar las páginas (que se
 * cargan de forma perezosa con `loadComponent`): que existan los destinos
 * exigidos, que todas las rutas sean perezosas y que la ruta comodín `**` esté
 * configurada y colocada al final para resolver el 404 (Req 12.1).
 */
describe('app.routes', () => {
  function pathOf(route: Route): string | undefined {
    return route.path;
  }

  it('defines every required destination (Req 1.4)', () => {
    const paths = routes.map(pathOf);
    expect(paths).toEqual([
      '',
      'calculadoras',
      'calculadoras/:id',
      'ayuda',
      'privacidad',
      '**',
    ]);
  });

  it('lazy-loads every route via loadComponent (Req 11.1)', () => {
    for (const route of routes) {
      expect(typeof route.loadComponent).toBe('function');
    }
  });

  it('never eagerly binds a component on any route (Req 11.1)', () => {
    // Un `component` eager arrastraría la página al bundle inicial; la carga
    // perezosa exige que ninguna ruta lo declare y que todas usen
    // `loadComponent` (que Angular divide en un chunk independiente).
    for (const route of routes) {
      expect(route.component).toBeUndefined();
      expect(route.loadComponent).toBeDefined();
    }
  });

  it('resolves each loadComponent to a renderable component class (Req 11.1)', async () => {
    // Ejecutar cada `loadComponent` confirma que el `import()` dinámico existe
    // y entrega una clase de componente (no un módulo vacío), es decir, que la
    // división perezosa en chunks está correctamente cableada por ruta.
    for (const route of routes) {
      const loaded = await route.loadComponent!();
      expect(typeof loaded).toBe('function');
    }
  });

  it('places the wildcard 404 route last (Req 12.1)', () => {
    const wildcardIndex = routes.findIndex((r) => r.path === '**');
    expect(wildcardIndex).toBe(routes.length - 1);
  });

  it('exposes a parameterized calculator route (Req 1.4)', () => {
    expect(routes.some((r) => r.path === 'calculadoras/:id')).toBe(true);
  });
});
