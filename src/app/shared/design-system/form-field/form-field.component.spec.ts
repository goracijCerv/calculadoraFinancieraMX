import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { FormFieldComponent } from './form-field.component';

describe('FormFieldComponent', () => {
  let fixture: ComponentFixture<FormFieldComponent>;

  const input = (): HTMLInputElement =>
    fixture.nativeElement.querySelector('.form-field__input');
  const label = (): HTMLLabelElement =>
    fixture.nativeElement.querySelector('.form-field__label');
  const help = (): HTMLElement | null =>
    fixture.nativeElement.querySelector('.form-field__help');
  const error = (): HTMLElement | null =>
    fixture.nativeElement.querySelector('.form-field__error');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormFieldComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FormFieldComponent);
    fixture.componentRef.setInput('label', 'Salario diario');
    fixture.detectChanges();
  });

  it('crea el componente', () => {
    expect(input()).toBeTruthy();
    expect(label()).toBeTruthy();
  });

  it('muestra una etiqueta visible asociada al input por for/id (Req 3.1, 13.1)', () => {
    expect(label().textContent?.trim()).toContain('Salario diario');
    const forAttr = label().getAttribute('for');
    expect(forAttr).toBeTruthy();
    expect(forAttr).toBe(input().id);
  });

  it('no establece aria-describedby cuando no hay ayuda ni error', () => {
    expect(input().getAttribute('aria-describedby')).toBeNull();
    expect(input().getAttribute('aria-invalid')).toBeNull();
  });

  it('asocia el texto de ayuda por aria-describedby (Req 13.1)', async () => {
    fixture.componentRef.setInput('helpText', 'Monto antes de impuestos');
    fixture.detectChanges();
    await fixture.whenStable();

    const helpEl = help();
    expect(helpEl).toBeTruthy();
    expect(helpEl?.textContent?.trim()).toBe('Monto antes de impuestos');
    expect(input().getAttribute('aria-describedby')).toContain(helpEl?.id ?? 'missing');
  });

  it('asocia el mensaje de error por aria-describedby y marca aria-invalid (Req 4.1-4.3, 13.1)', async () => {
    fixture.componentRef.setInput('errorMessage', 'El salario debe ser mayor a cero');
    fixture.detectChanges();
    await fixture.whenStable();

    const errorEl = error();
    expect(errorEl).toBeTruthy();
    expect(errorEl?.textContent?.trim()).toBe('El salario debe ser mayor a cero');
    expect(errorEl?.getAttribute('role')).toBe('alert');
    expect(input().getAttribute('aria-describedby')).toContain(errorEl?.id ?? 'missing');
    expect(input().getAttribute('aria-invalid')).toBe('true');
  });

  it('incluye error y ayuda en aria-describedby cuando ambos están presentes', async () => {
    fixture.componentRef.setInput('helpText', 'Ayuda');
    fixture.componentRef.setInput('errorMessage', 'Error');
    fixture.detectChanges();
    await fixture.whenStable();

    const describedBy = input().getAttribute('aria-describedby') ?? '';
    expect(describedBy).toContain(help()?.id ?? 'missing-help');
    expect(describedBy).toContain(error()?.id ?? 'missing-error');
  });

  it('refleja el tipo de input', async () => {
    fixture.componentRef.setInput('type', 'number');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(input().getAttribute('type')).toBe('number');
  });

  it('muestra el indicador de campo obligatorio', async () => {
    fixture.componentRef.setInput('required', true);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(input().required).toBe(true);
    expect(label().querySelector('.form-field__required')).toBeTruthy();
  });
});

/** Host para ejercitar la integración con Angular Reactive Forms (CVA). */
@Component({
  imports: [FormFieldComponent, ReactiveFormsModule],
  template: `<app-form-field [formControl]="control" label="Salario" />`,
})
class HostComponent {
  readonly control = new FormControl('');
}

describe('FormFieldComponent — Reactive Forms (ControlValueAccessor)', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const input = (): HTMLInputElement =>
    fixture.nativeElement.querySelector('.form-field__input');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('propaga el valor del control al input', async () => {
    host.control.setValue('1234');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(input().value).toBe('1234');
  });

  it('propaga la entrada del usuario al control', () => {
    input().value = '567';
    input().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(host.control.value).toBe('567');
  });

  it('marca el control como tocado al perder el foco', () => {
    expect(host.control.touched).toBe(false);
    input().dispatchEvent(new Event('blur'));
    expect(host.control.touched).toBe(true);
  });

  it('respeta el estado deshabilitado del control', async () => {
    host.control.disable();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(input().disabled).toBe(true);
  });
});
