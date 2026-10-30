/**
 * Catálogo mínimo de iconos Lucide necesarios, como SVG inline (Req 9.2, 9.6, 13.x).
 *
 * Sólo se incluyen los iconos realmente usados por la aplicación. Cada entrada
 * contiene el *inner markup* del SVG de Lucide (líneas, círculos y paths con
 * `currentColor`), sin el elemento `<svg>` contenedor: ese contenedor lo aporta
 * `IconComponent`, que fija `viewBox`, `stroke="currentColor"` y la
 * accesibilidad. De esta forma el icono hereda el color del token vigente del
 * tema claro/oscuro y nunca introduce color de marca propio.
 *
 * Los trazos provienen del set Lucide (licencia ISC), transcritos verbatim para
 * no añadir una dependencia de runtime. Todos comparten el lienzo 24×24 y el
 * trazo fino editorial definido en `IconComponent`.
 *
 * Reglas de la identidad visual (Req 9.6): sin emojis, sin gradientes, glow,
 * blobs ni glassmorphism. Los iconos son monocromáticos (`currentColor`).
 */

/** Nombres de icono Lucide disponibles en la aplicación. */
export type IconName =
  | 'search'
  | 'sun'
  | 'moon'
  | 'menu'
  | 'home'
  | 'calculator'
  | 'help-circle'
  | 'chevron-right'
  | 'chevron-down'
  | 'arrow-left'
  | 'x'
  | 'alert-triangle'
  | 'info'
  | 'heart'
  | 'file-text';

/**
 * Markup interno (hijos del `<svg>`) de cada icono Lucide, 24×24, trazo fino.
 * El contenedor `<svg>` y los atributos de accesibilidad los aporta
 * `IconComponent`; aquí sólo vive la geometría.
 */
export const ICON_PATHS: Readonly<Record<IconName, string>> = {
  // https://lucide.dev/icons/search
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',

  // https://lucide.dev/icons/sun
  sun:
    '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/>' +
    '<path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/>' +
    '<path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/>' +
    '<path d="m19.07 4.93-1.41 1.41"/>',

  // https://lucide.dev/icons/moon
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',

  // https://lucide.dev/icons/menu
  menu: '<path d="M4 12h16"/><path d="M4 6h16"/><path d="M4 18h16"/>',

  // https://lucide.dev/icons/house
  home:
    '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/>' +
    '<path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',

  // https://lucide.dev/icons/calculator
  calculator:
    '<rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/>' +
    '<line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/>' +
    '<path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/>' +
    '<path d="M8 18h.01"/>',

  // https://lucide.dev/icons/circle-help
  'help-circle':
    '<circle cx="12" cy="12" r="10"/>' +
    '<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',

  // https://lucide.dev/icons/chevron-right
  'chevron-right': '<path d="m9 18 6-6-6-6"/>',

  // https://lucide.dev/icons/chevron-down
  'chevron-down': '<path d="m6 9 6 6 6-6"/>',

  // https://lucide.dev/icons/arrow-left
  'arrow-left': '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',

  // https://lucide.dev/icons/x
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',

  // https://lucide.dev/icons/triangle-alert
  'alert-triangle':
    '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/>' +
    '<path d="M12 9v4"/><path d="M12 17h.01"/>',

  // https://lucide.dev/icons/info
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',

  // https://lucide.dev/icons/heart
  heart:
    '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/>',

  // https://lucide.dev/icons/file-text
  'file-text':
    '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>' +
    '<path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
};
