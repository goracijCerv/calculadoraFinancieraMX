import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { FooterComponent } from './footer.component';
import { provideFiscalConstants } from '../core/constants/fiscal-constants.token';

describe('FooterComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent],
      // El footer aloja el banner del año fiscal, que consume FISCAL_CONSTANTS
      // (Req 17.1); se provee el año vigente para el test.
      providers: [provideRouter([]), provideFiscalConstants()],
    }).compileComponents();
  });

  it('creates', () => {
    const fixture = TestBed.createComponent(FooterComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('shows a donation link that opens safely in a new tab (Req 15.2)', async () => {
    const fixture = TestBed.createComponent(FooterComponent);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    const donate = el.querySelector<HTMLAnchorElement>('.app-footer__link--donate');
    expect(donate).not.toBeNull();
    expect(donate?.getAttribute('target')).toBe('_blank');
    expect(donate?.getAttribute('rel')).toContain('noopener');
  });

  it('links to the privacy policy route (Req 15.3)', async () => {
    const fixture = TestBed.createComponent(FooterComponent);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    const privacy = el.querySelector<HTMLAnchorElement>('a[href="/privacidad"]');
    expect(privacy).not.toBeNull();
    expect(privacy?.textContent?.trim()).toBe('Política de privacidad');
  });
});
