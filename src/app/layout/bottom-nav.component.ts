import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { IconComponent } from '../shared/design-system/icon';
import { ThemeToggleComponent } from '../shared/design-system/theme-toggle/theme-toggle.component';
import { NAV_LINKS } from './nav-links';

/**
 * `BottomNavComponent` — barra de navegación inferior para móvil (Req 11.2).
 *
 * Reproduce los mismos destinos que `HeaderComponent` (Inicio, Calculadoras,
 * Ayuda) usando los enlaces centralizados en `NAV_LINKS`, de modo que no se
 * duplica la lógica de rutas. Solo es visible en tamaños móviles: una media
 * query en CSS la muestra mientras oculta el encabezado, y la oculta en
 * escritorio/tablet (Req 11.1, 11.2).
 *
 * Cada destino muestra un `IconComponent` (icono Lucide, currentColor) con su
 * etiqueta. Accesible por teclado con foco visible global y `aria-current` en
 * el destino activo (Req 13.2, 13.3). SCSS puro, solo tokens aprobados; sin
 * emojis ni efectos excluidos (Req 9.6). Sin desbordes horizontales (Req 11.3).
 *
 * Requirements: 11.1, 11.2, 1.2
 */
@Component({
  selector: 'app-bottom-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, IconComponent, ThemeToggleComponent],
  templateUrl: './bottom-nav.component.html',
  styleUrl: './bottom-nav.component.scss',
})
export class BottomNavComponent {
  /** Destinos editoriales compartidos con el encabezado (Req 1.2). */
  protected readonly links = NAV_LINKS;
}
