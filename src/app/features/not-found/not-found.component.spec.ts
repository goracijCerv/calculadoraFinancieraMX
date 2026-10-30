// Prueba de ejemplo del NotFoundComponent (Req 12.1).
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { NotFoundComponent } from './not-found.component';

describe('NotFoundComponent', () => {
  let fixture: ComponentFixture<NotFoundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotFoundComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(NotFoundComponent);
    await fixture.whenStable();
  });

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('creates', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('muestra un mensaje descriptivo de página no encontrada (Req 12.1)', () => {
    const title = el().querySelector('.not-found__title');
    expect(title?.textContent?.trim()).toBe('Página no encontrada');

    const message = el().querySelector('.not-found__message');
    expect(message?.textContent?.trim().length).toBeGreaterThan(0);
  });

  it('ofrece un enlace de regreso al inicio (Req 12.1)', () => {
    const home = el().querySelector<HTMLAnchorElement>('a[href="/"]');
    expect(home).not.toBeNull();
    expect(home?.textContent?.trim()).toContain('Volver al inicio');
  });
});
