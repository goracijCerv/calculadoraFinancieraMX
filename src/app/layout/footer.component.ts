import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { IconComponent } from '../shared/design-system/icon';
import { FiscalYearBannerComponent } from '../shared/design-system/fiscal-year-banner';

/**
 * `FooterComponent` — pie de página global (Req 15.2, 15.3).
 *
 * Presenta un enlace de donación (Req 15.2) con destino provisional (se
 * conectará a la plataforma real más adelante, sin rehacer el diseño) y un
 * enlace interno a la política de privacidad vía `routerLink` (Req 15.3). La
 * ruta `/privacidad` se configura en la tarea 6.2.
 *
 * El enlace de donación es externo: abre en una pestaña nueva con
 * `rel="noopener noreferrer"` por seguridad. Accesible por teclado con foco
 * visible global (Req 13.2, 13.3). SCSS puro, solo tokens aprobados (Req 9.1,
 * 9.2); sin emojis ni efectos excluidos (Req 9.6). Sin desbordes (Req 11.3).
 *
 * Alberga además el `FiscalYearBannerComponent` para que el año fiscal vigente
 * de las constantes sea SIEMPRE visible en el shell (Req 17.1) y, si el año
 * actual es posterior, avise del desfase (Req 17.2). El año actual se inyecta
 * aquí, en la capa de presentación (`new Date().getFullYear()`), y se pasa al
 * banner, que delega la decisión de desfase en la función pura `checkStaleness`.
 *
 * Requirements: 15.2, 15.3, 17.1, 17.2
 */
@Component({
  selector: 'app-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IconComponent, FiscalYearBannerComponent],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  /**
   * Destino del enlace de donación (Req 15.2). Plataforma Ko-fi del proyecto.
   */
  protected readonly donationHref = 'https://ko-fi.com/cervantiliap';

  /**
   * Año actual observado, leído aquí (presentación) para preservar la pureza
   * del `Staleness_Check` (Req 17.2). Se calcula una vez al construir el shell.
   */
  protected readonly currentYear = new Date().getFullYear();
}
