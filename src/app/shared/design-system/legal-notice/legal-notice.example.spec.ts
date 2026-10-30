// Prueba de ejemplo (tarea 5.7) del LegalNoticeComponent.
//
// Verifica el punto de aceptación de la tarea: el aviso legal se renderiza con
// el texto EXACTO exigido por Req 3.5, carácter por carácter, sin recorte ni
// normalización que oculte diferencias de puntuación o acentos.
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LegalNoticeComponent, LEGAL_NOTICE_TEXT } from './legal-notice';

const EXACT_LEGAL_TEXT =
  'Resultado estimado con fines informativos. No constituye asesoría legal, fiscal ni contable oficial.';

describe('LegalNoticeComponent (ejemplo 5.7 — texto exacto, Req 3.5)', () => {
  let fixture: ComponentFixture<LegalNoticeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LegalNoticeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LegalNoticeComponent);
    fixture.detectChanges();
  });

  function noticeText(): string {
    const el = fixture.nativeElement.querySelector('.legal-notice') as HTMLElement;
    return el.textContent?.trim() ?? '';
  }

  it('renderiza el aviso legal con el texto EXACTO del requisito (Req 3.5)', () => {
    expect(noticeText()).toBe(EXACT_LEGAL_TEXT);
  });

  it('coincide literal con la constante publicada por el componente', () => {
    expect(LEGAL_NOTICE_TEXT).toBe(EXACT_LEGAL_TEXT);
    expect(noticeText()).toBe(LEGAL_NOTICE_TEXT);
  });

  it('conserva la puntuación exacta: termina en punto y usa una sola coma', () => {
    const text = noticeText();
    expect(text.endsWith('.')).toBe(true);
    expect((text.match(/,/g) ?? []).length).toBe(1);
    // Dos oraciones separadas por un punto y espacio.
    expect(text.split('. ').length).toBe(2);
  });

  it('conserva los acentos exactos del copy (asesoría)', () => {
    expect(noticeText()).toContain('asesoría');
  });
});
