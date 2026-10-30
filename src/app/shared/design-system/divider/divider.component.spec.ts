import { TestBed } from '@angular/core/testing';
import { DividerComponent } from './divider.component';

describe('DividerComponent', () => {
  function render() {
    const fixture = TestBed.createComponent(DividerComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    return { fixture, el };
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DividerComponent] }).compileComponents();
  });

  it('crea el divisor', () => {
    const { fixture } = render();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('expone el rol de separador para accesibilidad', () => {
    const { el } = render();
    expect(el.getAttribute('role')).toBe('separator');
  });

  it('es horizontal por defecto', () => {
    const { el } = render();
    expect(el.getAttribute('aria-orientation')).toBe('horizontal');
    expect(el.classList).toContain('app-divider');
    expect(el.classList).not.toContain('app-divider--vertical');
  });

  it('aplica la orientación vertical cuando se solicita', async () => {
    const { fixture, el } = render();
    fixture.componentRef.setInput('orientation', 'vertical');
    await fixture.whenStable();
    expect(el.getAttribute('aria-orientation')).toBe('vertical');
    expect(el.classList).toContain('app-divider--vertical');
  });

  it('se renderiza como un único elemento de bloque sin contenido proyectado', () => {
    // El filete de 1px en --rule-color se expresa en el SCSS del componente
    // (Req 9.4); aquí verificamos que el host no introduce contenido propio.
    const { el } = render();
    expect(el.children.length).toBe(0);
    expect(el.textContent?.trim()).toBe('');
  });
});
