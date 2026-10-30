import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Grosor del filete editorial, en px. */
export type EditorialRuleWeight = 1 | 2 | 3;

/**
 * `EditorialRuleComponent` — filete editorial propio (SVG) para el acento vino.
 *
 * Dibuja una regla horizontal corta que acompaña a títulos y a la cifra héroe
 * (Req 9.3). Es un SVG propio (no Lucide) con `currentColor`, de modo que su
 * color proviene del contexto: colocándolo donde `color: var(--rule-accent-color)`
 * (vino #782F40) rinde el filete de acento aprobado, sin introducir color propio.
 *
 * Es decorativo: `aria-hidden="true"`. Sin gradientes, glow, blobs ni
 * glassmorphism (Req 9.6). Respeta la paleta y tipografía aprobadas.
 *
 * Requirements: 9.2, 9.6, 13.3
 */
@Component({
  selector: 'app-editorial-rule',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './editorial-rule.component.scss',
  template: `
    <svg
      class="app-editorial-rule"
      [attr.width]="length()"
      [attr.height]="weight()"
      [attr.viewBox]="'0 0 ' + length() + ' ' + weight()"
      preserveAspectRatio="none"
      fill="none"
      stroke="currentColor"
      [attr.stroke-width]="weight()"
      stroke-linecap="square"
      aria-hidden="true"
      [attr.focusable]="false"
    >
      <line [attr.x1]="0" [attr.y1]="half()" [attr.x2]="length()" [attr.y2]="half()" />
    </svg>
  `,
})
export class EditorialRuleComponent {
  /** Longitud del filete en px. */
  readonly length = input<number>(48);

  /** Grosor del filete en px (3 por defecto, acorde a `--rule-accent-width`). */
  readonly weight = input<EditorialRuleWeight>(3);

  /** Mitad del grosor para centrar la línea en el lienzo. */
  protected half(): number {
    return this.weight() / 2;
  }
}
