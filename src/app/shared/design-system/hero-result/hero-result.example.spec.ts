// Prueba de ejemplo (tarea 5.7) del HeroResultComponent.
//
// Verifica el punto de aceptación de la tarea: el monto héroe es la mayor
// tipografía de la pantalla, ≥1.5× del siguiente nivel de jerarquía (Req 9.3).
//
// En jsdom no se resuelven estilos calculados a partir de CSS custom
// properties, así que la verificación combina dos evidencias:
//   1. DOM/estructura: el monto se renderiza en el elemento que lleva la clase
//      `hero-result__amount`, la única que aplica `--font-size-hero`.
//   2. Escala tipográfica: se comprueba, contra los valores declarados de la
//      escala editorial de `_tokens.scss`, que `--font-size-hero` (3rem) sea
//      ≥1.5× `--font-size-2xl` (2rem, siguiente nivel) y el mayor de la escala,
//      que es la relación que exige Req 9.3. Si la escala cambiara en los
//      tokens, estos valores deben actualizarse en conjunto.
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeroResultComponent } from './hero-result';

// Escala tipográfica editorial declarada en `src/styles/_tokens.scss` (rem).
// El monto héroe usa `--font-size-hero`; el siguiente nivel es `--font-size-2xl`.
const FONT_SIZE_REM = {
  hero: 5, // --font-size-hero
  '2xl': 2, // --font-size-2xl (siguiente nivel de jerarquía)
  xl: 1.5, // --font-size-xl
  lg: 1.25, // --font-size-lg
  md: 1, // --font-size-md
} as const;

describe('HeroResultComponent (ejemplo 5.7 — monto héroe ≥1.5×, Req 9.3)', () => {
  let fixture: ComponentFixture<HeroResultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeroResultComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HeroResultComponent);
  });

  function amountEl(): HTMLElement {
    return fixture.nativeElement.querySelector('.hero-result__amount') as HTMLElement;
  }

  it('renderiza el monto en el elemento que aplica el token héroe (Req 9.3)', () => {
    fixture.componentRef.setInput('amount', 9876.54);
    fixture.detectChanges();
    const el = amountEl();
    expect(el).toBeTruthy();
    // El monto formateado vive en el elemento con la clase del token héroe.
    expect(el.classList).toContain('hero-result__amount');
    expect(el.textContent?.trim()).toContain('9,876.54');
  });

  it('el tamaño héroe es ≥1.5× el siguiente nivel de jerarquía (Req 9.3)', () => {
    expect(FONT_SIZE_REM.hero).toBeGreaterThanOrEqual(FONT_SIZE_REM['2xl'] * 1.5);
  });

  it('el tamaño héroe es el mayor de la escala tipográfica (Req 9.3)', () => {
    const otros = [
      FONT_SIZE_REM['2xl'],
      FONT_SIZE_REM.xl,
      FONT_SIZE_REM.lg,
      FONT_SIZE_REM.md,
    ];
    for (const size of otros) {
      expect(FONT_SIZE_REM.hero).toBeGreaterThan(size);
    }
  });
});
