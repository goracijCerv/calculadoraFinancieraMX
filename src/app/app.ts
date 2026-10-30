import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { SeoService } from './core/seo/seo.service';
import { BottomNavComponent } from './layout/bottom-nav.component';
import { FooterComponent } from './layout/footer.component';
import { HeaderComponent } from './layout/header.component';

/**
 * `App` — shell de la aplicación (Req 1.2, 11.1).
 *
 * Compone el encabezado editorial (`HeaderComponent`), el área de contenido
 * enrutado (`<router-outlet>`), el pie de página global (`FooterComponent`) y
 * la barra de navegación inferior para móvil (`BottomNavComponent`). La
 * conmutación entre encabezado y barra inferior la resuelve una media query en
 * CSS, sin duplicar la lógica de rutas (Req 11.2).
 *
 * El `ThemeManagerService` se provee en raíz, por lo que el tema queda
 * disponible para toda la aplicación desde este shell (Req 10). El
 * `SeoService` se arranca aquí (`init()`) para mantener la meta description y
 * las etiquetas Open Graph sincronizadas con cada ruta (tarea 23.1, Req 1.1,
 * 1.3) sin alterar los títulos por ruta, que gestiona el router.
 *
 * Requirements: 1.2, 11.1
 */
@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, BottomNavComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly seo = inject(SeoService);

  constructor() {
    // Arranca la sincronización de SEO por ruta una sola vez desde el shell.
    this.seo.init();
  }
}
