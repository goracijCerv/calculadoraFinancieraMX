// Prueba de ejemplo del ErrorStateComponent (Req 12.2).
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ErrorStateComponent } from './error-state';

describe('ErrorStateComponent', () => {
  let fixture: ComponentFixture<ErrorStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorStateComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(ErrorStateComponent);
  });

  function messageEl(): HTMLElement {
    return fixture.nativeElement.querySelector('.error-state__message') as HTMLElement;
  }

  function retryButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('button') as HTMLButtonElement;
  }

  it('renderiza el mensaje de error descriptivo (Req 12.2)', async () => {
    fixture.componentRef.setInput('message', 'No se pudo calcular el resultado.');
    await fixture.whenStable();
    expect(messageEl().textContent?.trim()).toBe('No se pudo calcular el resultado.');
  });

  it('ofrece una acción de reintento con etiqueta por defecto (Req 12.2)', async () => {
    fixture.componentRef.setInput('message', 'Error de cálculo.');
    await fixture.whenStable();
    expect(retryButton()).toBeTruthy();
    expect(retryButton().textContent?.trim()).toBe('Reintentar');
  });

  it('permite personalizar la etiqueta de reintento', async () => {
    fixture.componentRef.setInput('message', 'Error de cálculo.');
    fixture.componentRef.setInput('retryLabel', 'Intentar de nuevo');
    await fixture.whenStable();
    expect(retryButton().textContent?.trim()).toBe('Intentar de nuevo');
  });

  it('emite el evento retry al activar la acción (Req 12.2)', async () => {
    fixture.componentRef.setInput('message', 'Error de cálculo.');
    await fixture.whenStable();
    let emitted = 0;
    fixture.componentInstance.retry.subscribe(() => (emitted += 1));
    retryButton().click();
    expect(emitted).toBe(1);
  });

  it('expone el estado de error a lectores de pantalla como alert', async () => {
    fixture.componentRef.setInput('message', 'Error de cálculo.');
    await fixture.whenStable();
    const section = fixture.nativeElement.querySelector('.error-state') as HTMLElement;
    expect(section.getAttribute('role')).toBe('alert');
    expect(section.getAttribute('aria-live')).toBe('assertive');
  });
});
