import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * `OtherToolsComponent` — sección discreta "Otras herramientas".
 *
 * Presenta otros proyectos propios del autor (herramientas útiles) como una
 * tarjeta sutil con un enlace externo, en lugar de un banner de publicidad de
 * terceros. No carga scripts de terceros ni redes publicitarias: es un simple
 * enlace honesto a otra herramienta propia.
 *
 * El enlace externo abre en pestaña nueva con `rel="noopener noreferrer"` por
 * seguridad. Accesible por teclado con foco visible global. SCSS puro con
 * tokens aprobados.
 */
@Component({
  selector: 'app-other-tools',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './other-tools.html',
  styleUrl: './other-tools.scss',
})
export class OtherToolsComponent {
  /** Título de la herramienta destacada. */
  readonly toolName = input<string>('RapUPic — Convertir HEIC a JPG');

  /** Descripción breve de la herramienta. */
  readonly toolDescription = input<string>(
    'Convierte fotos HEIC a JPG en tu navegador, sin instalar nada y sin subir tus archivos a ningún servidor.',
  );

  /** URL externa de la herramienta. */
  readonly toolHref = input<string>('https://rapupic.pages.dev/heic-to-jpg/');
}
