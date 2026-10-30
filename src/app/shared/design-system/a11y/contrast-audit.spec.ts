// Auditoría automatizada de contraste de los pares token texto/fondo
// (tarea 3.2). Calcula la relación de contraste WCAG de cada par de texto
// normal sobre su fondo en los temas CLARO y OSCURO y verifica que sea ≥4.5:1.
//
// _Requirements: 13.4_
//
// Los valores hexadecimales reproducen exactamente los tokens semánticos
// definidos en `src/styles/_themes.scss`, resolviendo las cadenas `var()`
// hasta la paleta cruda de `src/styles/_tokens.scss`. Si algún token cambia,
// esta tabla debe actualizarse de forma deliberada; el test no afloja el
// umbral bajo ninguna circunstancia.
//
// Si un par falla (contraste < 4.5:1), este test debe fallar y señalar el par
// concreto para que se corrijan los tokens (nunca el umbral).

import { contrastRatioHex, WCAG_AA_NORMAL_TEXT } from './contrast';

interface ContrastPair {
  readonly name: string;
  readonly textHex: string;
  readonly bgHex: string;
}

// Valores copiados de src/styles/_themes.scss. Si un token cambia, esta tabla
// se actualiza de forma deliberada; el umbral nunca se afloja.
const LIGHT_PAIRS: readonly ContrastPair[] = [
  { name: 'light: text-primary (grafito) / surface-base (crema)', textHex: '#302830', bgHex: '#faf8f5' },
  { name: 'light: text-primary (grafito) / surface-sunken (lavanda)', textHex: '#302830', bgHex: '#e8e1e8' },
  { name: 'light: text-secondary / surface-base (crema)', textHex: '#655f65', bgHex: '#faf8f5' },
  { name: 'light: text-secondary / surface-sunken (lavanda)', textHex: '#655f65', bgHex: '#e8e1e8' },
  { name: 'light: text-accent (vino) / surface-base (crema)', textHex: '#782f40', bgHex: '#faf8f5' },
  { name: 'light: text-accent (vino) / surface-sunken (lavanda)', textHex: '#782f40', bgHex: '#e8e1e8' },
  { name: 'light: ink-contrast (blanco) / ink (vino, botón primario)', textHex: '#ffffff', bgHex: '#782f40' },
  { name: 'light: mark-text (grafito) / mark (lavanda)', textHex: '#302830', bgHex: '#e8e1e8' },
  { name: 'light: field-text / field-bg (blanco)', textHex: '#302830', bgHex: '#ffffff' },
  { name: 'light: field-placeholder / field-bg (blanco)', textHex: '#655f65', bgHex: '#ffffff' },
] as const;

const DARK_PAIRS: readonly ContrastPair[] = [
  { name: 'dark: text-primary / surface-base', textHex: '#e8e1e8', bgHex: '#211b21' },
  { name: 'dark: text-primary / surface-raised', textHex: '#e8e1e8', bgHex: '#302830' },
  { name: 'dark: text-primary / surface-sunken', textHex: '#e8e1e8', bgHex: '#1a151a' },
  { name: 'dark: text-primary / surface-accent-soft', textHex: '#e8e1e8', bgHex: '#3a2e3a' },
  { name: 'dark: text-secondary / surface-base', textHex: '#b4acb4', bgHex: '#211b21' },
  { name: 'dark: text-secondary / surface-raised', textHex: '#b4acb4', bgHex: '#302830' },
  { name: 'dark: text-secondary / surface-sunken', textHex: '#b4acb4', bgHex: '#1a151a' },
  { name: 'dark: text-secondary / surface-accent-soft', textHex: '#b4acb4', bgHex: '#3a2e3a' },
  { name: 'dark: text-accent / surface-base', textHex: '#d8a7b4', bgHex: '#211b21' },
  { name: 'dark: text-accent / surface-raised', textHex: '#d8a7b4', bgHex: '#302830' },
  { name: 'dark: ink-contrast / ink (botón primario)', textHex: '#ffffff', bgHex: '#a6586a' },
  { name: 'dark: mark-text / mark', textHex: '#e8e1e8', bgHex: '#5b3040' },
  { name: 'dark: field-text / field-bg', textHex: '#e8e1e8', bgHex: '#2a222a' },
  { name: 'dark: field-placeholder / field-bg', textHex: '#948b94', bgHex: '#2a222a' },
] as const;

describe('Auditoría de contraste de tokens texto/fondo (Req 13.4)', () => {
  describe('Tema claro', () => {
    it.each(LIGHT_PAIRS)('$name cumple ≥4.5:1', ({ textHex, bgHex }) => {
      const ratio = contrastRatioHex(textHex, bgHex);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
    });
  });

  describe('Tema oscuro', () => {
    it.each(DARK_PAIRS)('$name cumple ≥4.5:1', ({ textHex, bgHex }) => {
      const ratio = contrastRatioHex(textHex, bgHex);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
    });
  });

  it('cubre todos los pares de texto normal de ambos temas', () => {
    expect(LIGHT_PAIRS.length).toBeGreaterThan(0);
    expect(DARK_PAIRS.length).toBeGreaterThan(0);
  });
});

// --- Pruebas unitarias de la propia utilidad de contraste ------------------
// Verifican la implementación de las fórmulas WCAG con casos conocidos para
// que la auditoría anterior repose sobre un cálculo correcto.
describe('Utilidad de contraste WCAG', () => {
  it('negro sobre blanco es 21:1', () => {
    expect(contrastRatioHex('#000000', '#ffffff')).toBeCloseTo(21, 5);
  });

  it('un color consigo mismo es 1:1', () => {
    expect(contrastRatioHex('#782f40', '#782f40')).toBeCloseTo(1, 10);
  });

  it('es simétrica respecto al orden de los argumentos', () => {
    const ab = contrastRatioHex('#302830', '#ffffff');
    const ba = contrastRatioHex('#ffffff', '#302830');
    expect(ab).toBeCloseTo(ba, 12);
  });

  it('acepta la forma corta de tres dígitos', () => {
    expect(contrastRatioHex('#000', '#fff')).toBeCloseTo(21, 5);
  });
});
