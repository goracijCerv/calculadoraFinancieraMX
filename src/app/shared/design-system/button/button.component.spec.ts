import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonComponent } from './button.component';

/** Host para verificar la proyección de contenido del botón. */
@Component({
  imports: [ButtonComponent],
  template: `<app-button>Calcular</app-button>`,
})
class HostComponent {}

describe('ButtonComponent', () => {
  let fixture: ComponentFixture<ButtonComponent>;

  function button(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('button') as HTMLButtonElement;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonComponent, HostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(ButtonComponent);
    await fixture.whenStable();
  });

  it('crea el botón con la variante primaria (vino) por defecto', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(button().classList).toContain('app-button');
    expect(button().classList).toContain('app-button--primary');
  });

  it('mantiene el tipo nativo `button` por defecto', () => {
    expect(button().type).toBe('button');
  });

  it('aplica la clase de la variante seleccionada', async () => {
    fixture.componentRef.setInput('variant', 'secondary');
    await fixture.whenStable();
    expect(button().classList).toContain('app-button--secondary');
    expect(button().classList).not.toContain('app-button--primary');

    fixture.componentRef.setInput('variant', 'text');
    await fixture.whenStable();
    expect(button().classList).toContain('app-button--text');
    expect(button().classList).not.toContain('app-button--secondary');
  });

  it('refleja el tipo nativo configurado', async () => {
    fixture.componentRef.setInput('type', 'submit');
    await fixture.whenStable();
    expect(button().type).toBe('submit');
  });

  it('deshabilita el botón cuando `disabled` es verdadero', async () => {
    expect(button().disabled).toBe(false);
    fixture.componentRef.setInput('disabled', true);
    await fixture.whenStable();
    expect(button().disabled).toBe(true);
  });

  it('aplica la clase de ancho completo cuando `fullWidth` es verdadero', async () => {
    expect(button().classList).not.toContain('app-button--full-width');
    fixture.componentRef.setInput('fullWidth', true);
    await fixture.whenStable();
    expect(button().classList).toContain('app-button--full-width');
  });

  it('proyecta el contenido dentro del botón', async () => {
    const hostFixture = TestBed.createComponent(HostComponent);
    await hostFixture.whenStable();
    const projected = hostFixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(projected.textContent?.trim()).toBe('Calcular');
  });
});
