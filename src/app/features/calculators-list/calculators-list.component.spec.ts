// Prueba de ejemplo del CalculatorsListComponent (Req 1.3, 2.2, 2.3, 2.4, 11.4).
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { CALCULATOR_REGISTRY } from '../../core/registry/calculator-registry';
import { CalculatorsListComponent } from './calculators-list.component';

describe('CalculatorsListComponent', () => {
  let fixture: ComponentFixture<CalculatorsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalculatorsListComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(CalculatorsListComponent);
    await fixture.whenStable();
  });

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  async function typeSearch(value: string): Promise<void> {
    const input = el().querySelector<HTMLInputElement>('.list__search-input');
    expect(input).not.toBeNull();
    input!.value = value;
    input!.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it('creates', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('muestra el índice completo del registry (Req 1.3)', () => {
    const items = el().querySelectorAll('.list__index-item');
    expect(items.length).toBe(CALCULATOR_REGISTRY.length);
  });

  it('enlaza cada calculadora a calculadoras/:id (Req 1.4)', () => {
    const links = el().querySelectorAll<HTMLAnchorElement>('.list__index-link');
    expect(links.length).toBe(CALCULATOR_REGISTRY.length);
    const first = links[0].getAttribute('href');
    expect(first).toBe(`/calculadoras/${CALCULATOR_REGISTRY[0].id}`);
  });

  it('expone un único encabezado de página de nivel 1', () => {
    const h1 = el().querySelectorAll('h1');
    expect(h1.length).toBe(1);
    expect(h1[0].textContent?.trim().length).toBeGreaterThan(0);
  });

  it('asocia una etiqueta visible al campo de búsqueda (Req 13.1)', () => {
    const label = el().querySelector<HTMLLabelElement>('.list__search-label');
    const input = el().querySelector<HTMLInputElement>('.list__search-input');
    expect(label?.getAttribute('for')).toBe('list-search');
    expect(input?.id).toBe('list-search');
  });

  it('filtra por nombre y muestra solo las coincidencias (Req 2.2)', async () => {
    await typeSearch('finiquito');
    const names = Array.from(el().querySelectorAll('.list__index-name')).map((n) =>
      n.textContent?.trim().toLowerCase(),
    );
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(name).toContain('finiquito');
    }
    expect(el().querySelector('app-empty-state')).toBeNull();
  });

  it('restaura la lista completa al borrar el término (Req 2.4)', async () => {
    await typeSearch('finiquito');
    expect(el().querySelectorAll('.list__index-item').length).toBeLessThan(
      CALCULATOR_REGISTRY.length,
    );

    await typeSearch('   ');
    expect(el().querySelectorAll('.list__index-item').length).toBe(
      CALCULATOR_REGISTRY.length,
    );
  });

  it('muestra el estado vacío cuando no hay coincidencias (Req 2.3)', async () => {
    await typeSearch('zzz-no-existe-xyz');

    const empty = el().querySelector('app-empty-state');
    expect(empty).not.toBeNull();
    expect(empty?.textContent).toContain('No encontramos calculadoras');

    // No se renderiza ningún elemento del índice mientras hay estado vacío.
    expect(el().querySelectorAll('.list__index-item').length).toBe(0);
  });

  it('muestra la sección "Otras herramientas" con un enlace propio, sin scripts de terceros', () => {
    const section = el().querySelector('.other-tools');
    expect(section).not.toBeNull();

    const link = section?.querySelector<HTMLAnchorElement>('.other-tools__card');
    expect(link).not.toBeNull();
    expect(link?.getAttribute('href')).toBe('https://rapupic.pages.dev/heic-to-jpg/');
    expect(link?.getAttribute('target')).toBe('_blank');
    expect(link?.getAttribute('rel')).toContain('noopener');

    // Sin anuncios de terceros: no se inyectan scripts ni iframes.
    expect(el().querySelector('iframe')).toBeNull();
    expect(el().querySelector('script')).toBeNull();
  });
});
