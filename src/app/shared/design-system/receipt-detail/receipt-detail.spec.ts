// Prueba de ejemplo del ReceiptDetailComponent (Req 3.7).
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceiptDetailComponent } from './receipt-detail';

describe('ReceiptDetailComponent', () => {
  let fixture: ComponentFixture<ReceiptDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReceiptDetailComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReceiptDetailComponent);
    fixture.componentRef.setInput('folio', 'CF-2026-000123');
    fixture.componentRef.setInput('date', new Date(2026, 0, 15));
    fixture.detectChanges();
  });

  function values(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.receipt-detail__value'));
  }

  it('muestra el folio recibido por entrada', () => {
    const folio = fixture.nativeElement.querySelector(
      '.receipt-detail__value--folio',
    ) as HTMLElement;
    expect(folio.textContent?.trim()).toBe('CF-2026-000123');
  });

  it('muestra la fecha de cálculo formateada', () => {
    const [, dateValue] = values();
    const text = dateValue.textContent?.trim() ?? '';
    // El formato depende del locale; verificamos que incluye el año recibido.
    expect(text.length).toBeGreaterThan(0);
    expect(text).toContain('2026');
  });

  it('renderiza exactamente dos filas (folio y fecha)', () => {
    const rows = fixture.nativeElement.querySelectorAll('.receipt-detail__row');
    expect(rows.length).toBe(2);
  });

  it('usa etiquetas por defecto para folio y fecha', () => {
    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('.receipt-detail__label'),
    ).map((l) => (l as HTMLElement).textContent?.trim());
    expect(labels).toEqual(['Folio', 'Fecha de cálculo']);
  });
});
