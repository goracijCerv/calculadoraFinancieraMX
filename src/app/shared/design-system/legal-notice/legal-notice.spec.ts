// Prueba de ejemplo del LegalNoticeComponent (Req 3.5).
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LegalNoticeComponent, LEGAL_NOTICE_TEXT } from './legal-notice';

describe('LegalNoticeComponent', () => {
  let fixture: ComponentFixture<LegalNoticeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LegalNoticeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LegalNoticeComponent);
    fixture.detectChanges();
  });

  function notice(): HTMLElement {
    return fixture.nativeElement.querySelector('.legal-notice') as HTMLElement;
  }

  it('renderiza el aviso legal con el texto EXACTO exigido por Req 3.5', () => {
    const expected =
      'Resultado estimado con fines informativos. No constituye asesoría legal, fiscal ni contable oficial.';
    expect(notice().textContent?.trim()).toBe(expected);
  });

  it('expone la constante del texto alineada con lo renderizado', () => {
    expect(notice().textContent?.trim()).toBe(LEGAL_NOTICE_TEXT);
  });

  it('marca el aviso como nota para tecnologías de asistencia', () => {
    expect(notice().getAttribute('role')).toBe('note');
  });
});
