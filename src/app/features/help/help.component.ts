import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { IconComponent } from '../../shared/design-system/icon';

/** Entrada de pregunta frecuente de la página de Ayuda. */
export interface FaqEntry {
  /** Pregunta visible, encabeza la entrada. */
  readonly question: string;
  /** Respuesta en lenguaje simple. */
  readonly answer: string;
}

/** Guía o recurso enlazado desde la página de Ayuda. */
export interface HelpResource {
  /** Título del recurso o guía. */
  readonly title: string;
  /** Descripción breve del recurso. */
  readonly description: string;
  /** Ruta interna de destino (`routerLink`). */
  readonly path: string;
}

/**
 * `HelpComponent` — página de Ayuda (ruta `/ayuda`, Req 1.6).
 *
 * Presenta dos bloques editoriales: preguntas frecuentes (FAQ) y una sección de
 * guías o recursos que enlaza a destinos internos de la aplicación. El contenido
 * es estático (sin backend, Req 14) y navegable por teclado con foco visible
 * global (Req 13.2, 13.3).
 *
 * Estilo: SCSS puro con tokens aprobados (Playfair para títulos de acento, Inter
 * para el cuerpo); sin emojis ni efectos excluidos (Req 9.6). Sin desbordes
 * horizontales (Req 11.3). La ruta `/ayuda` se conecta en la tarea 6.2.
 *
 * Requirements: 1.6
 */
@Component({
  selector: 'app-help',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IconComponent],
  templateUrl: './help.component.html',
  styleUrl: './help.component.scss',
})
export class HelpComponent {
  /** Preguntas frecuentes de la aplicación (Req 1.6). */
  protected readonly faqs: readonly FaqEntry[] = [
    {
      question: '¿Necesito registrarme para usar las calculadoras?',
      answer:
        'No. Todas las calculadoras son gratuitas y funcionan sin registro ni ' +
        'instalación. Abres la que necesitas, capturas tus datos y obtienes el ' +
        'resultado al instante.',
    },
    {
      question: '¿Mis datos salen de mi navegador?',
      answer:
        'No. El cálculo ocurre por completo en tu dispositivo. Los datos que ' +
        'capturas no se envían a ningún servidor.',
    },
    {
      question: '¿Los resultados son oficiales?',
      answer:
        'Son estimaciones con fines informativos basadas en la Ley Federal del ' +
        'Trabajo y en las tablas del SAT del año fiscal vigente. No constituyen ' +
        'asesoría legal, fiscal ni contable oficial.',
    },
    {
      question: '¿De qué año son las cifras que usan las calculadoras?',
      answer:
        'La aplicación muestra de forma visible el año fiscal de las constantes ' +
        'cargadas. Si el año en curso es posterior, verás un aviso de que los ' +
        'valores podrían estar desactualizados.',
    },
  ];

  /** Guías y recursos enlazados a secciones internas (Req 1.6). */
  protected readonly resources: readonly HelpResource[] = [
    {
      title: 'Explora todas las calculadoras',
      description:
        'Revisa el índice completo de calculadoras laborales y fiscales y ' +
        'encuentra la que necesitas.',
      path: '/calculadoras',
    },
    {
      title: 'Cómo tratamos tu información',
      description:
        'Consulta la política de privacidad para conocer cómo se maneja tu ' +
        'información al usar el sitio.',
      path: '/privacidad',
    },
  ];
}
