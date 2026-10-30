import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Sección de contenido de la política de privacidad. */
export interface PrivacySection {
  /** Encabezado visible de la sección. */
  readonly heading: string;
  /** Párrafos de la sección en lenguaje simple. */
  readonly paragraphs: readonly string[];
}

/**
 * `PrivacyComponent` — política de privacidad (ruta `/privacidad`, Req 15.3).
 *
 * Expone el contenido de la política de privacidad, accesible desde el enlace
 * del pie de página (`FooterComponent`). El contenido es estático (sin backend,
 * Req 14) y navegable por teclado con foco visible global (Req 13.2, 13.3).
 *
 * Incluye además una sección de anuncios que documenta que la monetización
 * (AdSense) aún no está activa: no se cargan scripts de terceros ni se muestran
 * anuncios reales, solo se reservan espacios de diseño (Req 15.1). También
 * anticipa cómo se manejarán los datos cuando la publicidad se active.
 *
 * Estilo: SCSS puro con tokens aprobados (Playfair para títulos de acento,
 * Inter para el cuerpo); sin emojis ni efectos excluidos (Req 9.6). Sin
 * desbordes horizontales (Req 11.3). La ruta `/privacidad` se conecta en la
 * tarea 6.2.
 *
 * Requirements: 15.1, 15.3
 */
@Component({
  selector: 'app-privacy',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './privacy.component.html',
  styleUrl: './privacy.component.scss',
})
export class PrivacyComponent {
  /** Secciones de la política de privacidad (Req 15.3). */
  protected readonly sections: readonly PrivacySection[] = [
    {
      heading: 'Cálculo en tu navegador',
      paragraphs: [
        'Todas las calculadoras se ejecutan por completo en tu dispositivo. ' +
          'Los datos que capturas para calcular (salario, fechas, antigüedad y ' +
          'similares) no se envían a ningún servidor ni se almacenan fuera de tu ' +
          'navegador.',
      ],
    },
    {
      heading: 'Almacenamiento local',
      paragraphs: [
        'El sitio guarda únicamente tu preferencia de tema (claro u oscuro) en el ' +
          'almacenamiento local de tu navegador, para recordarla en tu próxima ' +
          'visita. Puedes borrarla limpiando los datos del sitio desde tu navegador.',
      ],
    },
    {
      heading: 'Uso informativo de los resultados',
      paragraphs: [
        'Los resultados son estimaciones con fines informativos y no constituyen ' +
          'asesoría legal, fiscal ni contable oficial. Verifica siempre tu caso con ' +
          'una persona profesional o con la autoridad correspondiente.',
      ],
    },
    {
      heading: 'Anuncios',
      paragraphs: [
        'Por ahora el sitio no muestra anuncios. Solo se reservan espacios de ' +
          'diseño para publicidad, sin cargar anuncios reales ni scripts de ' +
          'terceros y sin realizar peticiones a redes publicitarias.',
        'Si en el futuro se activa la publicidad (por ejemplo, Google AdSense), ' +
          'actualizaremos esta política para describir qué datos recopilaría la ' +
          'red publicitaria y las opciones disponibles para gestionarlos. El ' +
          'cálculo seguirá ejecutándose por completo en tu navegador: tus datos ' +
          'de entrada no se compartirían con ninguna red de anuncios.',
      ],
    },
    {
      heading: 'Cambios en esta política',
      paragraphs: [
        'Si la política de privacidad cambia, la versión vigente estará disponible ' +
          'en esta misma página.',
      ],
    },
  ];
}
