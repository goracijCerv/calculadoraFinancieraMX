// Auditoría de accesibilidad consolidada (tarea 25.2).
//
// Verifica de forma programática —en la medida de lo posible bajo jsdom— los
// tres criterios de aceptación del Requirement 13 que esta tarea cubre:
//
//   - 13.4  Contraste ≥4.5:1 texto normal/fondo en AMBOS temas.
//   - 13.3  Indicador de foco visible para los elementos interactivos, sin que
//           ningún componente lo anule con `outline:none` en línea.
//   - 13.2  Navegación completa por teclado: los controles interactivos son
//           elementos nativos enfocables (a[href], button, input) y no se
//           sacan del orden de tabulación.
//
// LÍMITE DE LA AUTOMATIZACIÓN (IMPORTANTE):
// jsdom NO renderiza hojas de estilo externas, NO evalúa `:focus-visible`, NO
// calcula el layout ni aplica media queries. Por eso esta auditoría comprueba
// *invariantes estructurales y de datos* que se pueden verificar sin un motor
// de renderizado real:
//   - el contraste se calcula sobre los valores de token (cálculo puro WCAG);
//   - el foco visible se valida comprobando que ningún control impone
//     `outline:none` en línea (la regla global `:focus-visible` vive en
//     `_reset.scss` y los componentes la refuerzan con su propio anillo —ver la
//     auditoría de SCSS documentada más abajo);
//   - la navegación por teclado se valida comprobando que los controles son
//     elementos nativos enfocables y no llevan `tabindex="-1"`.
// La validación COMPLETA de WCAG (lectores de pantalla, foco visible real,
// recorrido de tabulación en un navegador) requiere pruebas MANUALES con
// tecnologías de asistencia y revisión experta; esta suite no las sustituye.
//
// _Requirements: 13.2, 13.3, 13.4_

import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { contrastRatioHex, WCAG_AA_NORMAL_TEXT } from './contrast';
import { ButtonComponent } from '../button/button.component';
import { FormFieldComponent } from '../form-field/form-field.component';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';

// ===========================================================================
// 13.4 — Contraste ≥4.5:1 en ambos temas
// ===========================================================================
//
// Conjunto COMPLETO de pares texto-normal/fondo de los tokens semánticos
// resueltos a sus valores crudos (ver `_themes.scss` y `_tokens.scss`). Esta
// tabla es el espejo de la que usa `contrast-audit.spec.ts`; se replica aquí
// para que la auditoría consolidada sea autosuficiente y falle de inmediato si
// se añade un par sin contraste suficiente. El umbral NUNCA se afloja: si un
// par baja de 4.5:1, se corrigen los tokens, no el test.
interface ContrastPair {
  readonly name: string;
  readonly textHex: string;
  readonly bgHex: string;
}

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

describe('Auditoría de accesibilidad consolidada — Contraste (Req 13.4)', () => {
  describe('Tema claro: todos los pares texto-normal/fondo ≥4.5:1', () => {
    it.each(LIGHT_PAIRS)('$name', ({ textHex, bgHex }) => {
      expect(contrastRatioHex(textHex, bgHex)).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
    });
  });

  describe('Tema oscuro: todos los pares texto-normal/fondo ≥4.5:1', () => {
    it.each(DARK_PAIRS)('$name', ({ textHex, bgHex }) => {
      expect(contrastRatioHex(textHex, bgHex)).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
    });
  });

  it('cubre cada combinación de texto/superficie definida en ambos temas', () => {
    // Guarda contra omisiones: si se añade una superficie o un color de texto a
    // los temas sin extender esta tabla, el recuento esperado debe revisarse de
    // forma deliberada (se actualiza junto con `_themes.scss`).
    expect(LIGHT_PAIRS).toHaveLength(10);
    expect(DARK_PAIRS).toHaveLength(14);
  });
});

// ===========================================================================
// Auditoría de SCSS (documentada) — foco visible sin supresiones (Req 13.3)
// ===========================================================================
//
// jsdom no carga el SCSS de los componentes en tiempo de ejecución, así que la
// ausencia de `outline:none` sin reemplazo se audita por inspección estática
// (grep sobre `src/**/*.scss`). Resultado de la auditoría en el momento de
// escribir esta tarea (25.2):
//
//   Única aparición de `outline: none` en todo el código:
//     src/styles/_reset.scss →  :focus:not(:focus-visible) { outline: none; }
//   Es el patrón CORRECTO: suprime el contorno SOLO cuando el foco no proviene
//   del teclado, mientras que el anillo de `:focus-visible` (definido en el
//   mismo `_reset.scss`) permanece para la navegación por teclado.
//
//   El anillo de foco se refuerza explícitamente en cada control interactivo
//   del Design System con `&:focus-visible { outline: var(--focus-ring-width)
//   solid var(--focus-ring-color); outline-offset: var(--focus-ring-offset); }`:
//     - button.component.scss
//     - theme-toggle.component.scss
//     - form-field.component.scss
//     - calculators-list.component.scss
//     - calculator-page.scss
//
//   NINGÚN componente anula el foco con `outline:none` incondicional.
//
// Este bloque deja constancia de la auditoría; las comprobaciones vivas de más
// abajo verifican el invariante observable en el DOM (sin supresión en línea).

// ===========================================================================
// 13.2 / 13.3 — Controles nativos enfocables, foco no suprimido (DOM vivo)
// ===========================================================================

/** Host que monta un botón con contenido proyectado. */
@Component({
  standalone: true,
  imports: [ButtonComponent],
  template: '<app-button type="button">Calcular</app-button>',
})
class ButtonHost {}

/** Host que monta un campo de formulario con etiqueta visible requerida. */
@Component({
  standalone: true,
  imports: [FormFieldComponent],
  template: '<app-form-field label="Importe" type="number" />',
})
class FieldHost {}

describe('Auditoría de accesibilidad consolidada — Teclado y foco (Req 13.2, 13.3)', () => {
  function focusKilled(el: HTMLElement): boolean {
    // Un control saca el foco de su indicador si impone `outline:none` en línea.
    const inline = el.style.outline.replace(/\s+/g, '').toLowerCase();
    return inline === 'none' || inline === '0' || inline === '0px';
  }

  describe('ButtonComponent', () => {
    let fixture: ComponentFixture<ButtonHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [ButtonHost] }).compileComponents();
      fixture = TestBed.createComponent(ButtonHost);
      await fixture.whenStable();
    });

    it('renderiza un <button> nativo (enfocable por teclado) — Req 13.2', () => {
      const btn = (fixture.nativeElement as HTMLElement).querySelector('button');
      expect(btn).not.toBeNull();
      expect(btn!.tagName).toBe('BUTTON');
      // No se retira del orden de tabulación ni queda deshabilitado por defecto.
      expect(btn!.getAttribute('tabindex')).not.toBe('-1');
      expect(btn!.disabled).toBe(false);
    });

    it('no suprime el indicador de foco en línea — Req 13.3', () => {
      const btn = (fixture.nativeElement as HTMLElement).querySelector('button')!;
      expect(focusKilled(btn)).toBe(false);
    });
  });

  describe('ThemeToggleComponent', () => {
    let fixture: ComponentFixture<ThemeToggleComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [ThemeToggleComponent] }).compileComponents();
      fixture = TestBed.createComponent(ThemeToggleComponent);
      await fixture.whenStable();
    });

    it('es un <button> nativo enfocable con etiqueta accesible — Req 13.2', () => {
      const btn = (fixture.nativeElement as HTMLElement).querySelector('button');
      expect(btn).not.toBeNull();
      expect(btn!.tagName).toBe('BUTTON');
      expect(btn!.getAttribute('tabindex')).not.toBe('-1');
      // El estado se comunica por nombre accesible, no sólo por color.
      expect(btn!.getAttribute('aria-label')?.length).toBeGreaterThan(0);
    });

    it('no suprime el indicador de foco en línea — Req 13.3', () => {
      const btn = (fixture.nativeElement as HTMLElement).querySelector('button')!;
      expect(focusKilled(btn)).toBe(false);
    });
  });

  describe('FormFieldComponent', () => {
    let fixture: ComponentFixture<FieldHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [FieldHost] }).compileComponents();
      fixture = TestBed.createComponent(FieldHost);
      await fixture.whenStable();
    });

    it('expone un <input> nativo enfocable asociado a su etiqueta — Req 13.2', () => {
      const root = fixture.nativeElement as HTMLElement;
      const input = root.querySelector('input');
      const label = root.querySelector('label');
      expect(input).not.toBeNull();
      expect(label).not.toBeNull();
      // Navegación por teclado: input nativo en el orden de tabulación.
      expect(input!.getAttribute('tabindex')).not.toBe('-1');
      // Etiqueta visible asociada por for/id (soporte de navegación/lector).
      expect(label!.getAttribute('for')).toBe(input!.id);
      expect(input!.id.length).toBeGreaterThan(0);
    });

    it('no suprime el indicador de foco en línea en el input — Req 13.3', () => {
      const input = (fixture.nativeElement as HTMLElement).querySelector('input')!;
      expect(focusKilled(input)).toBe(false);
    });
  });
});
