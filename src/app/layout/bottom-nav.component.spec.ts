import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { BottomNavComponent } from './bottom-nav.component';

describe('BottomNavComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BottomNavComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('creates', () => {
    const fixture = TestBed.createComponent(BottomNavComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('exposes the same destinations as the header (Req 11.2, 1.2)', async () => {
    const fixture = TestBed.createComponent(BottomNavComponent);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    const links = Array.from(
      el.querySelectorAll<HTMLAnchorElement>('.app-bottom-nav__link'),
    );
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '/',
      '/calculadoras',
      '/ayuda',
    ]);
    expect(
      links.map((a) => a.querySelector('.app-bottom-nav__label')?.textContent?.trim()),
    ).toEqual(['Inicio', 'Calculadoras', 'Ayuda']);
  });
});
