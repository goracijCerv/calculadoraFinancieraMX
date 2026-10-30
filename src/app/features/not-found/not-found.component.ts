import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { IconComponent } from '../../shared/design-system/icon';

/**
 * `NotFoundComponent` — página 404 (ruta comodín `**`, Req 12.1).
 *
 * Se muestra cuando el usuario navega a una ruta inexistente. Presenta un
 * mensaje descriptivo y un enlace de regreso al inicio mediante `routerLink`
 * a la raíz (`/`). Navegable por teclado con foco visible global (Req 13.2,
 * 13.3).
 *
 * Estilo: SCSS puro con tokens aprobados (Playfair para el acento, Inter para
 * el cuerpo); sin emojis ni efectos excluidos (Req 9.6). Sin desbordes
 * horizontales (Req 11.3). La ruta comodín `**` se conecta en la tarea 6.2.
 *
 * Requirements: 12.1
 */
@Component({
  selector: 'app-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IconComponent],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.scss',
})
export class NotFoundComponent {}
