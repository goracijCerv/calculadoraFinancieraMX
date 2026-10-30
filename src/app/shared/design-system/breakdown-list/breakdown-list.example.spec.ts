// Prueba de ejemplo (tarea 5.7) del BreakdownListComponent.
//
// Verifica los puntos de aceptación de la tarea: el desglose se renderiza como
// filas separadas por divisores (`app-divider`), intercalados ENTRE filas
// (n-1 divisores), y SIN una tarjeta por importe (Req 3.3, 9.4).
import { ComponentFixture, TestBed } from '@angular/core/testing';

import type { BreakdownItem } from '../../../core/calculation/calculation.types';
import { BreakdownListComponent } from './breakdown-list';

describe('BreakdownListComponent (ejemplo 5.7 — divisores sin tarjeta, Req 3.3, 9.4)', () => {
  let fixture: ComponentFixture<BreakdownListComponent>;

  const items: BreakdownItem[] = [
    { concept: 'Aguinaldo proporcional', amount: 1250.5 },
    { concept: 'Vacaciones proporcionales', amount: 800.25 },
    { concept: 'Prima vacacional', amount: 200 },
    { concept: 'Días pendientes', amount: 500.75 },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BreakdownListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BreakdownListComponent);
    fixture.componentRef.setInput('items', items);
    fixture.detectChanges();
  });

  function rows(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.breakdown-list__row'));
  }

  function dividers(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('app-divider'));
  }

  it('renderiza una fila por concepto del desglose (Req 3.3)', () => {
    expect(rows().length).toBe(items.length);
  });

  it('intercala exactamente n-1 divisores ENTRE las filas (Req 9.4)', () => {
    expect(dividers().length).toBe(items.length - 1);
  });

  it('cada divisor es un separador accesible (role="separator")', () => {
    for (const divider of dividers()) {
      expect(divider.getAttribute('role')).toBe('separator');
    }
  });

  it('NO usa una tarjeta por importe: todo vive en una sola lista <dl> (Req 9.4)', () => {
    const lists = fixture.nativeElement.querySelectorAll('.breakdown-list');
    expect(lists.length).toBe(1);
    expect((lists[0] as HTMLElement).tagName.toLowerCase()).toBe('dl');
    // No existe ningún elemento tipo tarjeta por fila/importe en el marcado.
    const perItemCards = fixture.nativeElement.querySelectorAll(
      '.breakdown-list__card, .card, [class*="breakdown-list__row"] .card',
    );
    expect(perItemCards.length).toBe(0);
  });

  it('con un solo concepto no renderiza divisores (Req 9.4)', () => {
    fixture.componentRef.setInput('items', [
      { concept: 'Único concepto', amount: 10 },
    ] as BreakdownItem[]);
    fixture.detectChanges();
    expect(rows().length).toBe(1);
    expect(dividers().length).toBe(0);
  });
});
