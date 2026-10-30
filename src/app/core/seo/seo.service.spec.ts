// Pruebas del SeoService (tarea 23.1, Req 1.1, 1.3).
//
// Verifican que, al navegar, el servicio sincroniza la meta description y las
// etiquetas Open Graph (og:title/og:description/og:type/og:url) a partir de los
// metadatos declarados en `route.data`, y que los títulos por ruta siguen
// funcionando (el router los fija y el servicio deriva `og:title` de ellos).
// También cubren los valores por defecto cuando una ruta no declara SEO.

import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';

import { DEFAULT_SEO_DESCRIPTION, SeoService } from './seo.service';

@Component({ selector: 'app-seo-stub', template: '' })
class StubComponent {}

describe('SeoService', () => {
  let service: SeoService;
  let router: Router;
  let meta: Meta;
  let title: Title;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: 'con-seo',
            title: 'Página con SEO — CalculaFácil',
            component: StubComponent,
            data: {
              description: 'Descripción específica de la página.',
              ogType: 'article',
            },
          },
          {
            path: 'og-propio',
            title: 'Título de ruta',
            component: StubComponent,
            data: {
              description: 'Desc base.',
              ogTitle: 'OG explícito',
              ogDescription: 'OG desc explícita',
            },
          },
          {
            path: 'sin-seo',
            title: 'Sin SEO — CalculaFácil',
            component: StubComponent,
          },
        ]),
      ],
    });

    service = TestBed.inject(SeoService);
    router = TestBed.inject(Router);
    meta = TestBed.inject(Meta);
    title = TestBed.inject(Title);
    service.init();
  });

  afterEach(() => {
    service.destroy();
  });

  function metaContent(selector: string): string | null {
    return meta.getTag(selector)?.content ?? null;
  }

  it('is created', () => {
    expect(service).toBeTruthy();
  });

  it('sets meta description from route data on navigation (Req 1.1, 1.3)', async () => {
    await router.navigateByUrl('/con-seo');

    expect(metaContent('name="description"')).toBe('Descripción específica de la página.');
  });

  it('keeps the route title working and derives og:title from it', async () => {
    await router.navigateByUrl('/con-seo');

    expect(title.getTitle()).toBe('Página con SEO — CalculaFácil');
    expect(metaContent('property="og:title"')).toBe('Página con SEO — CalculaFácil');
  });

  it('sets og:description, og:type and og:url on navigation', async () => {
    await router.navigateByUrl('/con-seo');

    expect(metaContent('property="og:description"')).toBe(
      'Descripción específica de la página.',
    );
    expect(metaContent('property="og:type"')).toBe('article');
    expect(metaContent('property="og:url"')).not.toBeNull();
  });

  it('prefers explicit ogTitle/ogDescription over derived values', async () => {
    await router.navigateByUrl('/og-propio');

    expect(metaContent('property="og:title"')).toBe('OG explícito');
    expect(metaContent('property="og:description"')).toBe('OG desc explícita');
  });

  it('falls back to the site defaults when a route declares no SEO data', async () => {
    await router.navigateByUrl('/sin-seo');

    expect(metaContent('name="description"')).toBe(DEFAULT_SEO_DESCRIPTION);
    expect(metaContent('property="og:description"')).toBe(DEFAULT_SEO_DESCRIPTION);
    expect(metaContent('property="og:type"')).toBe('website');
  });

  it('updates meta description again when navigating to another route', async () => {
    await router.navigateByUrl('/con-seo');
    expect(metaContent('name="description"')).toBe('Descripción específica de la página.');

    await router.navigateByUrl('/sin-seo');
    expect(metaContent('name="description"')).toBe(DEFAULT_SEO_DESCRIPTION);
  });

  it('is idempotent: calling init twice does not double-subscribe', async () => {
    const updateSpy = vi.spyOn(service, 'update');
    service.init(); // segunda llamada, no debe crear otra suscripción

    await router.navigateByUrl('/con-seo');

    // Una sola actualización por navegación (no dos).
    expect(updateSpy).toHaveBeenCalledTimes(1);
  });
});
