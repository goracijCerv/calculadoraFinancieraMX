// SeoService — SEO por ruta (tarea 23.1, Req 1.1, 1.3).
//
// CalculaFácil es una SPA cuyo contenido cambia por ruta sin recargar la
// página; los crawlers y las previsualizaciones en redes sociales necesitan
// que el `<title>`, la `meta[name="description"]` y las etiquetas Open Graph se
// actualicen en cada navegación. Este servicio escucha los eventos de
// navegación del router, lee los metadatos declarados en `route.data` de la
// ruta activa más profunda y los aplica mediante los servicios `Title` y `Meta`
// de Angular.
//
// Los títulos por ruta ya los gestiona el router a través del campo `title` de
// cada ruta (`TitleStrategy` por defecto); este servicio NO los duplica, solo
// los LEE para derivar `og:title` cuando la ruta no declara uno explícito. La
// descripción y las etiquetas Open Graph se toman de `route.data`.
//
// Diseño de referencia: design.md → "Estructura de rutas" y el shell
// (`AppComponent`) que arranca el servicio.

import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import {
  ActivatedRoute,
  type Data,
  NavigationEnd,
  Router,
} from '@angular/router';
import { Subscription, filter } from 'rxjs';

/**
 * Metadatos de SEO que una ruta puede declarar bajo `route.data`.
 *
 * Todos son opcionales: una ruta sin `description` ni campos `og*` recibe los
 * valores por defecto del sitio. El `title` NO vive aquí (lo gestiona el campo
 * `title` de la ruta); se lee del `Title` service para derivar `og:title`.
 */
export interface RouteSeoData {
  /** Texto de `meta[name="description"]`. */
  readonly description?: string;
  /** Sobrescribe `og:title` (por defecto usa el `<title>` de la ruta). */
  readonly ogTitle?: string;
  /** Sobrescribe `og:description` (por defecto usa `description`). */
  readonly ogDescription?: string;
  /** Valor de `og:type` (por defecto `website`). */
  readonly ogType?: string;
}

/** Descripción por defecto del sitio cuando una ruta no declara la suya. */
export const DEFAULT_SEO_DESCRIPTION =
  'Calculadoras laborales y fiscales gratuitas para México: finiquito, ' +
  'liquidación, aguinaldo, vacaciones, ISR y más. Cálculo instantáneo en tu ' +
  'navegador, sin registro.';

/** Valor por defecto de `og:type` para las páginas del sitio. */
const DEFAULT_OG_TYPE = 'website';

/**
 * `SeoService` (provisto en raíz) mantiene sincronizados, en cada navegación,
 * la `meta[name="description"]` y las etiquetas Open Graph
 * (`og:title`, `og:description`, `og:type`, `og:url`) con los metadatos de la
 * ruta activa (Req 1.1, 1.3).
 *
 * Se arranca una sola vez desde el shell (`AppComponent`) llamando a `init()`.
 * El acceso al DOM para derivar `og:url` pasa por `DOCUMENT`, de modo que el
 * servicio es testeable de forma determinista.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  private subscription: Subscription | null = null;

  /**
   * Suscribe el servicio a los eventos `NavigationEnd` del router y aplica los
   * metadatos de la ruta activa al terminar cada navegación. Idempotente: una
   * segunda llamada no crea una segunda suscripción.
   */
  init(): void {
    if (this.subscription !== null) {
      return;
    }
    // Aplica también la ruta inicial (la primera navegación puede completarse
    // antes de que el shell llame a `init()`).
    this.update(this.collectRouteData());
    this.subscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => this.update(this.collectRouteData()));
  }

  /** Cancela la suscripción al router (usado en pruebas y al destruir). */
  destroy(): void {
    this.subscription?.unsubscribe();
    this.subscription = null;
  }

  /**
   * Aplica los metadatos resueltos a `Meta` (description + Open Graph).
   *
   * El `og:title` por defecto es el `<title>` vigente (que el router ya fijó a
   * partir del campo `title` de la ruta), de modo que los títulos siguen
   * funcionando y Open Graph se mantiene consistente con ellos.
   */
  update(data: RouteSeoData): void {
    const description = data.description ?? DEFAULT_SEO_DESCRIPTION;
    const ogTitle = data.ogTitle ?? this.title.getTitle();
    const ogDescription = data.ogDescription ?? description;
    const ogType = data.ogType ?? DEFAULT_OG_TYPE;

    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: ogTitle });
    this.meta.updateTag({ property: 'og:description', content: ogDescription });
    this.meta.updateTag({ property: 'og:type', content: ogType });
    this.meta.updateTag({ property: 'og:url', content: this.currentUrl() });
  }

  /**
   * Recorre el árbol de rutas activas hasta la hoja y combina su `data`,
   * devolviendo únicamente los campos de SEO conocidos. La hoja gana sobre los
   * ancestros al combinar (comportamiento de `route.data` de Angular).
   */
  private collectRouteData(): RouteSeoData {
    let route = this.activatedRoute.snapshot;
    while (route.firstChild) {
      route = route.firstChild;
    }
    return this.pickSeoData(route.data);
  }

  /** Extrae de un `Data` arbitrario solo los campos reconocidos de SEO. */
  private pickSeoData(data: Data): RouteSeoData {
    const picked: RouteSeoData = {
      description: typeof data['description'] === 'string' ? data['description'] : undefined,
      ogTitle: typeof data['ogTitle'] === 'string' ? data['ogTitle'] : undefined,
      ogDescription:
        typeof data['ogDescription'] === 'string' ? data['ogDescription'] : undefined,
      ogType: typeof data['ogType'] === 'string' ? data['ogType'] : undefined,
    };
    return picked;
  }

  /** URL absoluta actual para `og:url`, tolerante a entornos sin `location`. */
  private currentUrl(): string {
    const location = this.document.defaultView?.location;
    return location?.href ?? '';
  }
}
