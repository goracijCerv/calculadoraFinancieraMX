import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('creates', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the three editorial destinations with routerLink targets (Req 1.2)', async () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    const links = Array.from(
      el.querySelectorAll<HTMLAnchorElement>('.app-header__link'),
    );
    expect(links.map((a) => a.textContent?.trim())).toEqual([
      'Inicio',
      'Calculadoras',
      'Ayuda',
    ]);
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '/',
      '/calculadoras',
      '/ayuda',
    ]);
  });

  it('includes the theme toggle control (Req 10.1)', async () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('app-theme-toggle')).not.toBeNull();
  });
});
