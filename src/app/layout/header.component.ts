import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { ThemeToggleComponent } from '../shared/design-system/theme-toggle/theme-toggle.component';
import { NAV_LINKS } from './nav-links';

/**
 * `HeaderComponent` — encabezado editorial de la aplicación (Req 1.2, 11.1).
 *
 * Presenta la marca y la navegación principal (Inicio, Calculadoras, Ayuda)
 * mediante `routerLink`, junto con el `ThemeToggleComponent` (Req 10.1). Es
 * visible en escritorio y tablet; en móvil se oculta por media query y su lugar
 * lo toma `BottomNavComponent`, que resuelve los mismos destinos (Req 11.2) sin
 * duplicar la lógica de rutas.
 *
 * Accesibilidad (Req 13.2, 13.3): navegación operable por teclado con foco
 * visible global (`:focus-visible`), landmark `<header>`/`<nav>` etiquetado y
 * marca del enlace activo con `aria-current`. SCSS puro, solo tokens aprobados
 * (Req 9.1, 9.2); sin emojis ni efectos excluidos (Req 9.6).
 *
 * Requirements: 1.2, 11.1, 10.1
 */
@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, ThemeToggleComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  /** Destinos editoriales compartidos con la barra inferior (Req 1.2). */
  protected readonly links = NAV_LINKS;
}
