// Pruebas de ejemplo/integración de navegación responsive y rutas (tarea 6.3).
//
// Cobertura:
//  - Barra inferior en móvil con los tres destinos (Req 11.2).
//  - Listado de calculadoras en dos columnas en escritorio (Req 11.4).
//  - Ausencia de desbordes horizontales en el shell (Req 11.3).
//  - Navegación por teclado y foco visible: elementos interactivos enfocables
//    sin suprimir el indicador de foco (Req 13.2, 13.3).
//  - Ruta inexistente → 404 (Req 12.1).
//
// Nota sobre jsdom: no evalúa media queries ni aplica hojas de estilo externas,
// por lo que la visibilidad móvil/escritorio y las dos columnas se comprueban
// de forma ESTRUCTURAL (existencia de componentes, enlaces y clases que las
// media queries activan), siguiendo la guía de la tarea. El enrutado se ejercita
// con `RouterTestingHarness` + `provideRouter(routes)` usando la tabla real.

import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { withComponentInputBinding } from '@angular/router';

import { routes } from '../app.routes';
import { App } from '../app';
import { provideFiscalConstants } from '../core/constants/fiscal-constants.token';
import { NotFoundComponent } from '../features/not-found/not-found.component';
import { BottomNavComponent } from './bottom-nav.component';
import { HeaderComponent } from './header.component';
import { CalculatorsListComponent } from '../features/calculators-list/calculators-list.component';
import { CalculatorPageComponent } from '../features/calculator-page/calculator-page.component';

/** Host mínimo para montar directamente la lista sin pasar por el router. */
@Component({
  standalone: true,
  imports: [CalculatorsListComponent],
  template: '<app-calculators-list />',
})
class ListHost {}

describe('Navegación responsive y rutas (tarea 6.3)', () => {
  describe('BottomNavComponent — barra inferior móvil (Req 11.2, 13.2, 13.3)', () => {
    let fixture: ComponentFixture<BottomNavComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [BottomNavComponent],
        providers: [provideRouter([])],
      }).compileComponents();
      fixture = TestBed.createComponent(BottomNavComponent);
      await fixture.whenStable();
    });

    function el(): HTMLElement {
      return fixture.nativeElement as HTMLElement;
    }

    it('renderiza la barra inferior con los tres destinos y rutas (Req 11.2)', () => {
      const nav = el().querySelector('nav.app-bottom-nav');
      expect(nav).not.toBeNull();

      const links = Array.from(
        el().querySelectorAll<HTMLAnchorElement>('.app-bottom-nav__link'),
      );
      expect(links.map((a) => a.getAttribute('href'))).toEqual([
        '/',
        '/calculadoras',
        '/ayuda',
      ]);
      expect(
        links.map((a) =>
          a.querySelector('.app-bottom-nav__label')?.textContent?.trim(),
        ),
      ).toEqual(['Inicio', 'Calculadoras', 'Ayuda']);
    });

    it('expone los enlaces como anclas enfocables por teclado (Req 13.2)', () => {
      const links = Array.from(
        el().querySelectorAll<HTMLAnchorElement>('.app-bottom-nav__link'),
      );
      expect(links.length).toBe(3);
      for (const link of links) {
        // Anclas con href: enfocables en el orden natural del tabulador.
        expect(link.tagName).toBe('A');
        expect(link.getAttribute('href')).not.toBeNull();
        // No se saca de la secuencia de tabulación.
        expect(link.getAttribute('tabindex')).not.toBe('-1');
      }
    });

    it('no suprime el indicador de foco en línea en los enlaces (Req 13.3)', () => {
      const links = Array.from(
        el().querySelectorAll<HTMLAnchorElement>('.app-bottom-nav__link'),
      );
      for (const link of links) {
        // El foco visible global se define en _reset.scss; aquí comprobamos que
        // ningún enlace lo anule con un estilo en línea `outline:none`.
        expect(link.style.outline).toBe('');
      }
    });
  });

  describe('HeaderComponent — navegación editorial de escritorio (Req 13.2)', () => {
    let fixture: ComponentFixture<HeaderComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [HeaderComponent],
        providers: [provideRouter([])],
      }).compileComponents();
      fixture = TestBed.createComponent(HeaderComponent);
      await fixture.whenStable();
    });

    it('expone los mismos destinos que la barra inferior, enfocables (Req 11.2, 13.2)', () => {
      const el = fixture.nativeElement as HTMLElement;
      const links = Array.from(
        el.querySelectorAll<HTMLAnchorElement>('.app-header__link'),
      );
      expect(links.map((a) => a.getAttribute('href'))).toEqual([
        '/',
        '/calculadoras',
        '/ayuda',
      ]);
      for (const link of links) {
        expect(link.tagName).toBe('A');
        expect(link.getAttribute('tabindex')).not.toBe('-1');
        expect(link.style.outline).toBe('');
      }
    });
  });

  describe('App shell — sin desbordes horizontales (Req 11.3)', () => {
    let fixture: ComponentFixture<App>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [App],
        // El shell renderiza el footer, que aloja el banner del año fiscal y
        // consume FISCAL_CONSTANTS; se provee el año vigente para el test.
        providers: [provideRouter([]), provideFiscalConstants()],
      }).compileComponents();
      fixture = TestBed.createComponent(App);
      await fixture.whenStable();
    });

    it('aplica la clase estructural del shell que corta el desborde (Req 11.3)', () => {
      const el = fixture.nativeElement as HTMLElement;
      const shell = el.querySelector('.app-shell');
      expect(shell).not.toBeNull();
      // El contenedor principal centrado y acotado vive dentro del shell.
      expect(el.querySelector('.app-shell__main')).not.toBeNull();
    });

    it('renderiza encabezado y barra inferior en el mismo shell (Req 11.1, 11.2)', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('app-header')).not.toBeNull();
      expect(el.querySelector('app-bottom-nav')).not.toBeNull();
    });
  });

  describe('CalculatorsListComponent — dos columnas en escritorio (Req 11.4)', () => {
    let fixture: ComponentFixture<ListHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [ListHost],
        providers: [provideRouter([])],
      }).compileComponents();
      fixture = TestBed.createComponent(ListHost);
      await fixture.whenStable();
    });

    it('renderiza el contenedor de índice que la media query convierte en dos columnas (Req 11.4)', () => {
      const el = fixture.nativeElement as HTMLElement;
      // `.list__index` es el contenedor sobre el que la media query de
      // escritorio aplica `grid-template-columns: repeat(2, ...)`.
      const grid = el.querySelector('.list__index');
      expect(grid).not.toBeNull();
      // Debe contener varias celdas enlazadas para poder repartirse en columnas.
      const items = el.querySelectorAll('.list__index-item');
      expect(items.length).toBeGreaterThan(1);
    });

    it('mantiene los enlaces del listado enfocables por teclado (Req 13.2)', () => {
      const el = fixture.nativeElement as HTMLElement;
      const links = Array.from(
        el.querySelectorAll<HTMLAnchorElement>('.list__index-link'),
      );
      expect(links.length).toBeGreaterThan(0);
      for (const link of links) {
        expect(link.tagName).toBe('A');
        expect(link.getAttribute('tabindex')).not.toBe('-1');
        expect(link.style.outline).toBe('');
      }
    });
  });

  describe('Enrutado con la tabla real (Req 12.1)', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        // Se usa la tabla de rutas real y el provider del año fiscal vigente,
        // como en `app.config.ts`, para que las páginas perezosas se resuelvan.
        providers: [provideRouter(routes), provideFiscalConstants()],
      });
    });

    it('navega a la raíz y resuelve una ruta conocida sin caer en 404 (Req 1.4)', async () => {
      const harness = await RouterTestingHarness.create();
      const activated = await harness.navigateByUrl('/calculadoras');
      expect(activated).not.toBeInstanceOf(NotFoundComponent);
      expect(activated).toBeInstanceOf(CalculatorsListComponent);
    });

    it('resuelve una ruta inexistente al componente 404 (Req 12.1)', async () => {
      const harness = await RouterTestingHarness.create();
      const activated = await harness.navigateByUrl('/ruta-que-no-existe-xyz');
      expect(activated).toBeInstanceOf(NotFoundComponent);
    });

    it('resuelve una ruta inexistente de calculadora al 404 (Req 12.1)', async () => {
      const harness = await RouterTestingHarness.create();
      const activated = await harness.navigateByUrl('/calculadoras/no-existe');
      expect(activated).toBeInstanceOf(NotFoundComponent);
    });
  });

  describe('Detalle de calculadora con la tabla real (Req 1.4)', () => {
    beforeEach(() => {
      // `withComponentInputBinding()` replica `app.config.ts`: enlaza la
      // `CalculatorConfig` resuelta al input `config` de la plantilla común.
      TestBed.configureTestingModule({
        providers: [
          provideRouter(routes, withComponentInputBinding()),
          provideFiscalConstants(),
        ],
      });
    });

    // Regresión: la función `title` en línea de la ruta `calculadoras/:id` leía
    // `route.data['config']`, que aún no estaba disponible al evaluar el título;
    // acceder a `.name` sobre `undefined` lanzaba y abortaba la navegación a
    // CUALQUIER calculadora. El título se resuelve ahora con un `ResolveFn` que
    // busca la config por el `:id`. Estas pruebas navegan por rutas reales de
    // calculadora y verifican el render y el título.
    it('navega a /calculadoras/finiquito, renderiza el formulario y fija el título (Req 1.4)', async () => {
      const harness = await RouterTestingHarness.create();
      const activated = await harness.navigateByUrl('/calculadoras/finiquito');
      expect(activated).toBeInstanceOf(CalculatorPageComponent);

      const el = harness.routeNativeElement as HTMLElement;
      expect(el.querySelector('.calculator-page__title')?.textContent).toContain(
        'Finiquito',
      );
      expect(el.querySelector('form.calculator-page__form')).not.toBeNull();
      expect(document.title).toBe('Finiquito — Chécalo');
    });

    it('navega a /calculadoras/isr y fija el título correcto (Req 1.4)', async () => {
      const harness = await RouterTestingHarness.create();
      const activated = await harness.navigateByUrl('/calculadoras/isr');
      expect(activated).toBeInstanceOf(CalculatorPageComponent);
      expect(document.title).toBe('ISR mensual — Chécalo');
    });

    it('la página 404 muestra mensaje descriptivo y enlace al inicio (Req 12.1)', async () => {
      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl('/otra/ruta/rota');
      const el = harness.routeNativeElement as HTMLElement;

      const title = el.querySelector('.not-found__title');
      expect(title?.textContent?.trim()).toBe('Página no encontrada');
      expect(
        el.querySelector('.not-found__message')?.textContent?.trim().length,
      ).toBeGreaterThan(0);

      const home = el.querySelector<HTMLAnchorElement>('a[href="/"]');
      expect(home).not.toBeNull();
      // Enlace de regreso enfocable por teclado y sin suprimir el foco (Req 13.2, 13.3).
      expect(home?.tagName).toBe('A');
      expect(home?.getAttribute('tabindex')).not.toBe('-1');
      expect(home?.style.outline).toBe('');
    });
  });
});
