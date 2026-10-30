import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { ICON_PATHS, IconName } from './icon-paths';

/** Tamaños editoriales del icono, en px (lado del lienzo cuadrado 24×24). */
export type IconSize = 16 | 20 | 24 | 32;

/**
 * `IconComponent` — iconos Lucide como SVG inline con `currentColor` (Req 9.2, 9.6, 13.x).
 *
 * Renderiza únicamente los iconos del catálogo `ICON_PATHS` (set Lucide mínimo,
 * sin dependencia de runtime) dentro de un `<svg>` con `stroke="currentColor"`,
 * de modo que el icono hereda el color del token vigente en tema claro/oscuro.
 *
 * Accesibilidad (Req 13.1, 13.3):
 * - **Informativo:** cuando se pasa `label`, el SVG expone `role="img"` y
 *   `aria-label`, por lo que un lector de pantalla anuncia su significado.
 * - **Decorativo:** sin `label`, el SVG lleva `aria-hidden="true"` y se excluye
 *   del árbol de accesibilidad (su significado ya lo aporta el texto vecino).
 *
 * Nunca usa emojis ni color de marca propio; sin gradientes, glow, blobs ni
 * glassmorphism (Req 9.6). SCSS puro.
 */
@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './icon.component.scss',
  template: `
    <svg
      class="app-icon"
      viewBox="0 0 24 24"
      [attr.width]="size()"
      [attr.height]="size()"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      [attr.role]="isDecorative() ? null : 'img'"
      [attr.aria-label]="isDecorative() ? null : label()"
      [attr.aria-hidden]="isDecorative() ? 'true' : null"
      [attr.focusable]="false"
      [innerHTML]="markup()"
    ></svg>
  `,
})
export class IconComponent {
  private readonly sanitizer = inject(DomSanitizer);

  /** Nombre del icono Lucide a renderizar. */
  readonly name = input.required<IconName>();

  /** Lado del lienzo en px; 20 por defecto (acorde a la UI). */
  readonly size = input<IconSize>(20);

  /**
   * Etiqueta accesible. Cuando se proporciona (no vacía) el icono es
   * informativo (`role="img"` + `aria-label`); cuando se omite, el icono es
   * decorativo (`aria-hidden`).
   */
  readonly label = input<string | undefined>(undefined);

  /** Verdadero cuando no hay etiqueta: el icono es puramente decorativo. */
  protected readonly isDecorative = computed(() => {
    const value = this.label();
    return value === undefined || value.trim().length === 0;
  });

  /** Markup interno del SVG (geometría Lucide) marcado como confiable. */
  protected readonly markup = computed<SafeHtml>(() =>
    this.sanitizer.bypassSecurityTrustHtml(ICON_PATHS[this.name()]),
  );
}
