// Prueba de ejemplo (tarea 5.7) del ReceiptDetailComponent.
//
// Verifica el punto de aceptación de la tarea: el detalle tipo recibo muestra
// un folio y la fecha de cálculo recibidos por entrada (Req 3.7).
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceiptDetailComponent } from './receipt-detail';

describe('ReceiptDetailComponent (ejemplo 5.7 — folio y fecha, Req 3.7)', () => {
  let fixture: ComponentFixture<ReceiptDetailComponent>;

  const folio = 'CF-2026-000987';
  const date = new Date(2026, 2, 21); // 21 de marzo de 2026

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReceiptDetailComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReceiptDetailComponent);
    fixture.componentRef.setInput('folio', folio);
    fixture.componentRef.setInput('date', date);
    fixture.detectChanges();
  });

  function text(selector: string): string {
    const el = fixture.nativeElement.querySelector(selector) as HTMLElement;
    return el?.textContent?.trim() ?? '';
  }

  it('muestra el folio recibido por entrada (Req 3.7)', () => {
    expect(text('.receipt-detail__value--folio')).toBe(folio);
  });

  it('muestra la fecha de cálculo e incluye el año recibido (Req 3.7)', () => {
    const values = Array.from(
      fixture.nativeElement.querySelectorAll('.receipt-detail__value'),
    ) as HTMLElement[];
    const dateText = values[1]?.textContent?.trim() ?? '';
    expect(dateText.length).toBeGreaterThan(0);
    expect(dateText).toContain('2026');
  });

  it('presenta folio y fecha como dos filas del recibo (Req 3.7)', () => {
    const rows = fixture.nativeElement.querySelectorAll('.receipt-detail__row');
    expect(rows.length).toBe(2);
  });

  it('etiqueta ambas filas con su concepto (folio y fecha)', () => {
    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('.receipt-detail__label'),
    ).map((l) => (l as HTMLElement).textContent?.trim());
    expect(labels).toEqual(['Folio', 'Fecha de cálculo']);
  });
});
