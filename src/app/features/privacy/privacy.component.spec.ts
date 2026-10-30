// Prueba de ejemplo del PrivacyComponent (Req 15.3).
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrivacyComponent } from './privacy.component';

describe('PrivacyComponent', () => {
  let fixture: ComponentFixture<PrivacyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrivacyComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(PrivacyComponent);
    await fixture.whenStable();
  });

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('creates', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('muestra el título de la política de privacidad (Req 15.3)', () => {
    const h1 = el().querySelectorAll('h1');
    expect(h1.length).toBe(1);
    expect(h1[0].textContent?.trim()).toBe('Política de privacidad');
  });

  it('presenta secciones de contenido con texto (Req 15.3)', () => {
    const sections = el().querySelectorAll('.privacy__section');
    expect(sections.length).toBeGreaterThan(0);

    const titles = el().querySelectorAll('.privacy__section-title');
    const paragraphs = el().querySelectorAll('.privacy__paragraph');
    expect(titles.length).toBe(sections.length);
    expect(paragraphs.length).toBeGreaterThan(0);
    for (const paragraph of Array.from(paragraphs)) {
      expect(paragraph.textContent?.trim().length).toBeGreaterThan(0);
    }
  });

  it('incluye una sección de anuncios que aclara que no están activos (Req 15.1)', () => {
    const titles = Array.from(el().querySelectorAll('.privacy__section-title')).map(
      (t) => t.textContent?.trim(),
    );
    expect(titles).toContain('Anuncios');

    // El cuerpo documenta que aún no hay anuncios activos ni scripts de terceros.
    const text = el().textContent ?? '';
    expect(text).toContain('no muestra anuncios');
    expect(text).toContain('scripts de');
  });
});
