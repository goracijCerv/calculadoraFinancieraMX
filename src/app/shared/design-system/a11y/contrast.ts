// Utilidades de contraste WCAG 2.x (implementación propia, sin dependencias de
// runtime). Se usan en la auditoría de contraste de los pares token texto/fondo
// (tarea 3.2) para verificar la relación ≥4.5:1 exigida por el Requirement 13.4.
//
// Fórmulas (WCAG 2.1):
//   - Luminancia relativa: https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
//   - Relación de contraste: https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
//
// Estas funciones son puras y deterministas: no leen el DOM ni dependen del
// entorno, por lo que pueden ejecutarse igual en pruebas unitarias y de
// propiedades.

/** Canales de color sRGB enteros en el rango [0, 255]. */
export interface Rgb {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

/**
 * Convierte un color hexadecimal (`#rgb`, `#rrggbb`, con o sin `#`) a sus
 * canales sRGB. Lanza si el formato no es válido para evitar auditar valores
 * silenciosamente incorrectos.
 */
export function parseHexColor(hex: string): Rgb {
  const normalized = hex.trim().replace(/^#/, '').toLowerCase();

  let full: string;
  if (/^[0-9a-f]{3}$/.test(normalized)) {
    // Forma corta #rgb → #rrggbb.
    full = normalized
      .split('')
      .map((c) => c + c)
      .join('');
  } else if (/^[0-9a-f]{6}$/.test(normalized)) {
    full = normalized;
  } else {
    throw new Error(`Color hexadecimal no válido: "${hex}"`);
  }

  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

/**
 * Linealiza un canal sRGB (0..255) según la fórmula de WCAG, devolviendo un
 * valor en [0, 1].
 */
function linearizeChannel(channel8bit: number): number {
  const c = channel8bit / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Luminancia relativa de un color sRGB según WCAG 2.1 (valor en [0, 1]).
 */
export function relativeLuminance(color: Rgb): number {
  const r = linearizeChannel(color.r);
  const g = linearizeChannel(color.g);
  const b = linearizeChannel(color.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Relación de contraste WCAG entre dos colores sRGB. Resultado en [1, 21].
 * El orden de los argumentos es indiferente.
 */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Igual que {@link contrastRatio} pero acepta colores hexadecimales. */
export function contrastRatioHex(aHex: string, bHex: string): number {
  return contrastRatio(parseHexColor(aHex), parseHexColor(bHex));
}

/** Umbral mínimo WCAG AA para texto normal (Requirement 13.4). */
export const WCAG_AA_NORMAL_TEXT = 4.5;
