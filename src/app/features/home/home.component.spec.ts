// Prueba de ejemplo del HomeComponent (Req 1.1).
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { CALCULATOR_REGISTRY } from '../../core/registry/calculator-registry';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(HomeComponent);
    await fixture.whenStable();
  });

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('creates', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('presenta un único título héroe de nivel 1 con el texto editorial (Req 1.1)', () => {
    const h1 = el().querySelectorAll('h1');
    expect(h1.length).toBe(1);
    expect(h1[0].textContent?.trim()).toBe('Tus derechos también cuentan.');
  });

  it('presenta el índice de las calculadoras principales (Req 1.1)', () => {
    const mainHeading = el().querySelector('#home-main-heading');
    expect(mainHeading?.textContent?.trim()).toBe('Lo que te corresponde');

    const section = mainHeading?.closest('.home__section');
    const items = section?.querySelectorAll('.home__index-item') ?? [];
    const mainCount = CALCULATOR_REGISTRY.filter((c) => c.phase <= 2).length;
    expect(items.length).toBe(mainCount);

  });

  it('presenta una sección de herramientas adicionales (Req 1.1)', () => {
    const toolsHeading = el().querySelector('#home-tools-heading');
    expect(toolsHeading?.textContent?.trim()).toBe('Sueldo e impuestos');

    const section = toolsHeading?.closest('.home__section');
    const items = section?.querySelectorAll('.home__index-item') ?? [];
    const toolCount = CALCULATOR_REGISTRY.filter((c) => c.phase === 3).length;
    expect(items.length).toBe(toolCount);
  });

  it('enlaza cada calculadora a su ruta calculadoras/:id (Req 1.1, 1.4)', () => {
    const links = el().querySelectorAll<HTMLAnchorElement>('.home__index-link');
    expect(links.length).toBe(CALCULATOR_REGISTRY.length);

    const hrefs = Array.from(links).map((link) => link.getAttribute('href'));
    for (const calculator of CALCULATOR_REGISTRY) {
      expect(hrefs).toContain(`/calculadoras/${calculator.id}`);
    }
  });

  it('ofrece un enlace al listado completo de calculadoras', () => {
    const toList = el().querySelector<HTMLAnchorElement>('a[href="/calculadoras"]');
    expect(toList).not.toBeNull();
  });
});
