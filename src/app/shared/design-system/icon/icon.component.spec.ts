// Pruebas de ejemplo del IconComponent — Lucide SVG inline (Req 9.2, 9.6, 13.x).
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ICON_PATHS, IconName } from './icon-paths';
import { IconComponent } from './icon.component';

describe('IconComponent', () => {
  let fixture: ComponentFixture<IconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(IconComponent);
  });

  function svg(): SVGSVGElement {
    return fixture.nativeElement.querySelector('svg.app-icon') as SVGSVGElement;
  }

  it('renderiza el SVG con stroke="currentColor" para heredar el token vigente', () => {
    fixture.componentRef.setInput('name', 'search');
    fixture.detectChanges();
    expect(svg().getAttribute('stroke')).toBe('currentColor');
    expect(svg().getAttribute('fill')).toBe('none');
  });

  it('es decorativo (aria-hidden) cuando no se proporciona label', () => {
    fixture.componentRef.setInput('name', 'calculator');
    fixture.detectChanges();
    const el = svg();
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.getAttribute('role')).toBeNull();
    expect(el.getAttribute('aria-label')).toBeNull();
  });

  it('es informativo (role="img" + aria-label) cuando se proporciona label', () => {
    fixture.componentRef.setInput('name', 'help-circle');
    fixture.componentRef.setInput('label', 'Ayuda');
    fixture.detectChanges();
    const el = svg();
    expect(el.getAttribute('role')).toBe('img');
    expect(el.getAttribute('aria-label')).toBe('Ayuda');
    expect(el.getAttribute('aria-hidden')).toBeNull();
  });

  it('trata una label en blanco como decorativa', () => {
    fixture.componentRef.setInput('name', 'home');
    fixture.componentRef.setInput('label', '   ');
    fixture.detectChanges();
    expect(svg().getAttribute('aria-hidden')).toBe('true');
    expect(svg().getAttribute('role')).toBeNull();
  });

  it('aplica el tamaño solicitado al ancho y alto', () => {
    fixture.componentRef.setInput('name', 'menu');
    fixture.componentRef.setInput('size', 32);
    fixture.detectChanges();
    expect(svg().getAttribute('width')).toBe('32');
    expect(svg().getAttribute('height')).toBe('32');
  });

  it('inyecta la geometría del icono solicitado', () => {
    fixture.componentRef.setInput('name', 'x');
    fixture.detectChanges();
    // El path característico de "x" debe estar presente en el SVG inline.
    expect(svg().querySelectorAll('path').length).toBe(2);
  });

  it('no usa emojis ni gradientes/glow en ningún icono del catálogo (Req 9.6)', () => {
    const names = Object.keys(ICON_PATHS) as IconName[];
    // Rango de emojis básicos y pictográficos.
    const emoji = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
    for (const markup of Object.values(ICON_PATHS)) {
      expect(emoji.test(markup)).toBe(false);
      expect(markup).not.toContain('linearGradient');
      expect(markup).not.toContain('radialGradient');
      expect(markup).not.toContain('filter');
      // La geometría no debe fijar un color propio: el color llega por currentColor.
      expect(markup).not.toContain('#');
    }
    expect(names.length).toBeGreaterThan(0);
  });
});
