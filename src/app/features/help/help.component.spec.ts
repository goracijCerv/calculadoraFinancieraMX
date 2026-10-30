// Prueba de ejemplo del HelpComponent (Req 1.6).
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { HelpComponent } from './help.component';

describe('HelpComponent', () => {
  let fixture: ComponentFixture<HelpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HelpComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(HelpComponent);
    await fixture.whenStable();
  });

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('creates', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('presenta una sección de preguntas frecuentes con al menos una entrada (Req 1.6)', () => {
    const faqHeading = el().querySelector('#help-faq-heading');
    expect(faqHeading?.textContent?.trim()).toBe('Preguntas frecuentes');

    const questions = el().querySelectorAll('.help__faq-question');
    const answers = el().querySelectorAll('.help__faq-answer');
    expect(questions.length).toBeGreaterThan(0);
    expect(answers.length).toBe(questions.length);
  });

  it('presenta una sección de guías o recursos con enlaces internos (Req 1.6)', () => {
    const resourcesHeading = el().querySelector('#help-resources-heading');
    expect(resourcesHeading?.textContent?.trim()).toBe('Guías y recursos');

    const links = el().querySelectorAll<HTMLAnchorElement>('.help__resource-link');
    expect(links.length).toBeGreaterThan(0);
    for (const link of Array.from(links)) {
      expect(link.getAttribute('href')).toMatch(/^\//);
    }
  });

  it('enlaza al listado de calculadoras desde los recursos (Req 1.6)', () => {
    const toList = el().querySelector<HTMLAnchorElement>('a[href="/calculadoras"]');
    expect(toList).not.toBeNull();
  });

  it('expone un único encabezado de página de nivel 1', () => {
    const h1 = el().querySelectorAll('h1');
    expect(h1.length).toBe(1);
    expect(h1[0].textContent?.trim().length).toBeGreaterThan(0);
  });
});
