import { TestBed } from '@angular/core/testing';
import { ThemeManagerService } from '../../../core/theme/theme-manager.service';
import { ThemeToggleComponent } from './theme-toggle.component';

describe('ThemeToggleComponent', () => {
  function render() {
    const fixture = TestBed.createComponent(ThemeToggleComponent);
    fixture.detectChanges();
    const theme = TestBed.inject(ThemeManagerService);
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    return { fixture, theme, button };
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ThemeToggleComponent] }).compileComponents();
  });

  it('crea el control de alternancia', () => {
    const { fixture, button } = render();
    expect(fixture.componentInstance).toBeTruthy();
    expect(button).toBeTruthy();
    expect(button.type).toBe('button');
  });

  it('refleja el modo claro del servicio en el estado accesible', () => {
    const { fixture, theme, button } = render();
    theme.setMode('light');
    fixture.detectChanges();
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(button.getAttribute('aria-label')).toBe('Activar tema oscuro');
  });

  it('refleja el modo oscuro del servicio en el estado accesible', () => {
    const { fixture, theme, button } = render();
    theme.setMode('dark');
    fixture.detectChanges();
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.getAttribute('aria-label')).toBe('Activar tema claro');
  });

  it('invoca `toggle()` del ThemeManagerService al hacer clic (Req 10.1)', () => {
    const { fixture, theme, button } = render();
    const spy = vi.spyOn(theme, 'toggle');
    button.click();
    fixture.detectChanges();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('alterna el modo del servicio al activarse', () => {
    const { fixture, theme, button } = render();
    theme.setMode('light');
    fixture.detectChanges();
    button.click();
    fixture.detectChanges();
    expect(theme.mode()).toBe('dark');
    button.click();
    fixture.detectChanges();
    expect(theme.mode()).toBe('light');
  });

  it('muestra un icono SVG decorativo (aria-hidden) que hereda currentColor', () => {
    const { button } = render();
    const svg = button.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.getAttribute('stroke')).toBe('currentColor');
  });
});
