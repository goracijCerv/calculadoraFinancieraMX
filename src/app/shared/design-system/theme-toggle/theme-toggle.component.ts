import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ThemeManagerService } from '../../../core/theme/theme-manager.service';

/**
 * `ThemeToggleComponent` — control de alternancia claro/oscuro (Req 10.1, 10.2).
 *
 * Enlaza con `ThemeManagerService`: lee la señal `mode` para reflejar el estado
 * y llama a `toggle()` al activarse. El icono es un SVG inline con `currentColor`
 * (hereda el color del token vigente), accesible con `aria-hidden` porque el
 * estado se comunica por `aria-pressed` y por la etiqueta accesible del botón.
 * Sin emojis, sin librerías de UI. SCSS puro.
 *
 * Requirements: 10.1
 */
@Component({
  selector: 'app-theme-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './theme-toggle.component.html',
  styleUrl: './theme-toggle.component.scss',
})
export class ThemeToggleComponent {
  private readonly theme = inject(ThemeManagerService);

  /** Muestra una etiqueta de texto bajo el icono (barra inferior móvil). */
  readonly showLabel = input(false);

  /** Modo de tema vigente, derivado de la señal del servicio. */
  protected readonly mode = this.theme.mode;

  /** Verdadero mientras el tema oscuro esté activo. */
  protected readonly isDark = computed(() => this.mode() === 'dark');

  /** Etiqueta accesible según el modo al que conmutará la acción. */
  protected readonly label = computed(() =>
    this.isDark() ? 'Activar tema claro' : 'Activar tema oscuro',
  );

  /** Alterna el tema a través del `ThemeManagerService` (Req 10.1). */
  protected toggle(): void {
    this.theme.toggle();
  }
}
