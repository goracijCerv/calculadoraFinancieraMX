import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { App } from './app';
import { provideFiscalConstants } from './core/constants/fiscal-constants.token';

describe('App shell', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      // El shell renderiza el footer, que aloja el banner del año fiscal y
      // consume FISCAL_CONSTANTS (Req 17.1); se provee el año vigente.
      providers: [provideRouter([]), provideFiscalConstants()],
    }).compileComponents();
  });

  it('should create the shell', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders header, footer and mobile bottom nav around the router outlet', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('app-header')).not.toBeNull();
    expect(el.querySelector('router-outlet')).not.toBeNull();
    expect(el.querySelector('app-footer')).not.toBeNull();
    expect(el.querySelector('app-bottom-nav')).not.toBeNull();
  });

  it('exposes the editorial destinations in the header', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    const headerLinks = Array.from(
      el.querySelectorAll('app-header .app-header__link'),
    ).map((a) => a.textContent?.trim());

    expect(headerLinks).toEqual(['Inicio', 'Calculadoras', 'Ayuda']);
  });

  it('exposes donation and privacy links in the footer', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    const donate = el.querySelector(
      'app-footer .app-footer__link--donate',
    ) as HTMLAnchorElement | null;
    const privacy = el.querySelector(
      'app-footer a[href="/privacidad"]',
    ) as HTMLAnchorElement | null;

    expect(donate).not.toBeNull();
    expect(privacy).not.toBeNull();
  });
});
