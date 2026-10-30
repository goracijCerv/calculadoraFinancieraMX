// Prueba de ejemplo del BreakdownListComponent (Req 3.3, 9.4).
import { ComponentFixture, TestBed } from '@angular/core/testing';

import type { BreakdownItem } from '../../../core/calculation/calculation.types';
import { BreakdownListComponent } from './breakdown-list';

describe('BreakdownListComponent', () => {
  let fixture: ComponentFixture<BreakdownListComponent>;

  const items: BreakdownItem[] = [
    { concept: 'Aguinaldo proporcional', amount: 1250.5 },
    { concept: 'Vacaciones proporcionales', amount: 800.25 },
    { concept: 'Prima vacacional', amount: 200 },
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

  it('renderiza una fila por concepto del desglose', () => {
    expect(rows().length).toBe(items.length);
    const concepts = rows().map(
      (r) => (r.querySelector('.breakdown-list__concept') as HTMLElement).textContent?.trim(),
    );
    expect(concepts).toEqual([
      'Aguinaldo proporcional',
      'Vacaciones proporcionales',
      'Prima vacacional',
    ]);
  });

  it('intercala un divisor ENTRE filas (n-1 divisores) sin tarjeta (Req 9.4)', () => {
    expect(dividers().length).toBe(items.length - 1);
  });

  it('formatea cada importe como moneda con 2 decimales', () => {
    const amounts = rows().map(
      (r) => (r.querySelector('.breakdown-list__amount') as HTMLElement).textContent?.trim() ?? '',
    );
    expect(amounts[0]).toContain('1,250.50');
    expect(amounts[1]).toContain('800.25');
    expect(amounts[2]).toContain('200.00');
  });

  it('no envuelve cada importe en una tarjeta propia', () => {
    // Las filas viven dentro de una única <dl>; no hay contenedor tipo tarjeta
    // por importe (sin elementos con fondo/borde por fila en el marcado).
    const lists = fixture.nativeElement.querySelectorAll('.breakdown-list');
    expect(lists.length).toBe(1);
  });

  it('no renderiza divisores cuando hay un solo concepto', () => {
    fixture.componentRef.setInput('items', [{ concept: 'Único', amount: 10 }] as BreakdownItem[]);
    fixture.detectChanges();
    expect(rows().length).toBe(1);
    expect(dividers().length).toBe(0);
  });
});
