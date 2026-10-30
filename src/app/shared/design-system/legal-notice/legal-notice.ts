import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Texto EXACTO del aviso legal exigido por Req 3.5.
 *
 * Se expone como constante para que las pruebas lo verifiquen literalmente y
 * para evitar divergencias accidentales entre plantilla y especificación.
 */
export const LEGAL_NOTICE_TEXT =
  'Resultado estimado con fines informativos. No constituye asesoría legal, fiscal ni contable oficial.';

/**
 * `LegalNoticeComponent` — aviso legal de cada calculadora (Req 3.5).
 *
 * Renderiza SIEMPRE el texto exacto definido en `LEGAL_NOTICE_TEXT`. No recibe
 * entradas: el copy es fijo por requerimiento. Usa únicamente tokens aprobados
 * (tipografía Inter, color de texto secundario). SCSS puro, sin emojis.
 *
 * Requirements: 3.5
 */
@Component({
  selector: 'app-legal-notice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './legal-notice.html',
  styleUrl: './legal-notice.scss',
})
export class LegalNoticeComponent {
  /** Texto exacto del aviso legal (Req 3.5). */
  protected readonly text = LEGAL_NOTICE_TEXT;
}
