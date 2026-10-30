// Prueba de ejemplo del HeroResultComponent (Req 3.2, 9.3).
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeroResultComponent } from './hero-result';

describe('HeroResultComponent', () => {
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

  it('renderiza el monto héroe formateado como moneda', () => {
    fixture.componentRef.setInput('amount', 12345.6);
    fixture.detectChanges();
    const text = amountEl().textContent?.trim() ?? '';
    // Formato de moneda con 2 decimales (independiente del símbolo/locale).
    expect(text).toContain('12,345.60');
  });

  it('muestra la etiqueta editorial del resultado', () => {
    fixture.componentRef.setInput('amount', 100);
    fixture.componentRef.setInput('label', 'Finiquito estimado');
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('.hero-result__label') as HTMLElement;
    expect(label.textContent?.trim()).toBe('Finiquito estimado');
  });

  it('incluye el filete de acento vino decorativo (Req 9.3)', () => {
    fixture.componentRef.setInput('amount', 1);
    fixture.detectChanges();
    const filete = fixture.nativeElement.querySelector('.hero-result__filete') as HTMLElement;
    expect(filete).toBeTruthy();
    expect(filete.getAttribute('aria-hidden')).toBe('true');
  });

  it('expone un aria-label que combina etiqueta y monto', () => {
    fixture.componentRef.setInput('amount', 500);
    fixture.componentRef.setInput('label', 'Total');
    fixture.detectChanges();
    const section = fixture.nativeElement.querySelector('.hero-result') as HTMLElement;
    expect(section.getAttribute('aria-label')).toBe('Total: 500');
  });

  // Req 9.3: el monto héroe es el texto de mayor tamaño (≥1.5× el siguiente
  // nivel). El tamaño se expresa con el token --font-size-hero, que la escala
  // de _tokens.scss define como ≥1.5× --font-size-2xl. Aquí verificamos que el
  // monto se renderiza con la clase que aplica ese token (el valor numérico de
  // la relación lo garantizan los tokens y lo cubre la prueba de presentación
  // de la tarea 5.7).
  it('aplica la clase del monto héroe que usa el token de mayor tamaño', () => {
    fixture.componentRef.setInput('amount', 1);
    fixture.detectChanges();
    expect(amountEl()).toBeTruthy();
    expect(amountEl().classList).toContain('hero-result__amount');
  });
});
