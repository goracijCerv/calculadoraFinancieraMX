import { DOCUMENT, Injectable, inject, signal } from '@angular/core';

/**
 * Theme_Manager (Req 10).
 *
 * Modo de tema de la aplicación. Solo existen dos superficies de marca
 * diferenciadas: claro y oscuro (Req 10.6).
 */
export type ThemeMode = 'light' | 'dark';

/** Clave bajo la que se persiste la preferencia de tema en localStorage. */
export const THEME_STORAGE_KEY = 'calcula-facil:theme';

/** Atributo del elemento raíz (`<html>`) que selecciona la paleta activa. */
const THEME_ATTRIBUTE = 'data-theme';

/**
 * `ThemeManagerService` (provisto en raíz) gestiona el tema claro/oscuro: su
 * estado reactivo (`mode`), la alternancia (`toggle`), la aplicación y
 * persistencia (`setMode`) y la resolución inicial (`resolveInitial`).
 *
 * El tema se aplica estableciendo el atributo `data-theme` en el elemento raíz
 * (`<html data-theme="light|dark">`); los tokens de superficie se redefinen por
 * atributo en SCSS, de modo que el modo oscuro usa superficies diferenciadas
 * derivadas de la marca y no una inversión (Req 10.2, 10.6).
 *
 * Diseñado para ser testeable: el acceso al DOM pasa por `DOCUMENT` y los
 * accesos a `localStorage` / `matchMedia` están guardados, de modo que las
 * pruebas de propiedad (tareas 4.2 y 4.3) pueden ejercitarlo de forma
 * determinista.
 */
@Injectable({ providedIn: 'root' })
export class ThemeManagerService {
  private readonly document = inject(DOCUMENT);

  /**
   * Modo de tema vigente como signal (Req 10.2). Se inicializa aplicando la
   * precedencia localStorage → `prefers-color-scheme` (Req 10.4, 10.5).
   */
  readonly mode = signal<ThemeMode>(this.resolveInitial());

  constructor() {
    // Aplica el modo resuelto al cargar la aplicación para que el atributo del
    // raíz refleje la preferencia almacenada o del sistema (Req 10.2, 10.4, 10.5).
    this.applyToRoot(this.mode());
  }

  /**
   * Alterna entre tema claro y oscuro (Req 10.1). Aplica el nuevo modo a toda
   * la aplicación y lo persiste (vía `setMode`).
   */
  toggle(): void {
    this.setMode(this.mode() === 'light' ? 'dark' : 'light');
  }

  /**
   * Fija el modo de tema: actualiza el estado, lo aplica al elemento raíz
   * (Req 10.2) y persiste la preferencia en localStorage (Req 10.3).
   */
  setMode(mode: ThemeMode): void {
    this.mode.set(mode);
    this.applyToRoot(mode);
    this.persist(mode);
  }

  /**
   * Resuelve el modo inicial con la precedencia exigida (Req 10.4, 10.5):
   * primero la preferencia almacenada en localStorage; en su ausencia, la
   * preferencia del sistema indicada por `prefers-color-scheme`; si ninguna
   * está disponible, se usa el tema claro por defecto.
   */
  resolveInitial(): ThemeMode {
    const stored = this.readStored();
    if (stored !== null) {
      return stored;
    }
    return this.systemPrefersDark() ? 'dark' : 'light';
  }

  /** Aplica el modo al elemento raíz mediante el atributo `data-theme`. */
  private applyToRoot(mode: ThemeMode): void {
    this.document.documentElement.setAttribute(THEME_ATTRIBUTE, mode);
  }

  /** Persiste la preferencia en localStorage de forma segura (Req 10.3). */
  private persist(mode: ThemeMode): void {
    try {
      this.getStorage()?.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // El almacenamiento puede no estar disponible (modo privado, cuotas);
      // la persistencia es best-effort y no debe romper la aplicación.
    }
  }

  /**
   * Lee la preferencia almacenada; devuelve `null` si no hay un valor válido
   * (ausente, corrupto o almacenamiento no disponible).
   */
  private readStored(): ThemeMode | null {
    let value: string | null;
    try {
      value = this.getStorage()?.getItem(THEME_STORAGE_KEY) ?? null;
    } catch {
      value = null;
    }
    return value === 'light' || value === 'dark' ? value : null;
  }

  /** Indica si el sistema prefiere el tema oscuro (Req 10.5). */
  private systemPrefersDark(): boolean {
    const mql = this.getMatchMedia()?.('(prefers-color-scheme: dark)');
    return mql?.matches ?? false;
  }

  /** Acceso guardado a `localStorage` del documento (puede no existir). */
  private getStorage(): Storage | null {
    const win = this.document.defaultView;
    return win?.localStorage ?? null;
  }

  /** Acceso guardado a `matchMedia` del documento (puede no existir). */
  private getMatchMedia(): Window['matchMedia'] | null {
    const win = this.document.defaultView;
    return win && typeof win.matchMedia === 'function'
      ? win.matchMedia.bind(win)
      : null;
  }
}
