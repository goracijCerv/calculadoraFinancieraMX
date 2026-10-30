import { IconName } from '../shared/design-system/icon';

/**
 * Destinos de navegación compartidos entre el encabezado editorial y la barra
 * inferior móvil (Req 1.2). Al centralizarlos aquí, `HeaderComponent` y
 * `BottomNavComponent` resuelven exactamente los mismos enlaces sin duplicar la
 * lógica de rutas: la conmutación entre ambos la decide una media query en CSS.
 */
export interface NavLink {
  /** Ruta de destino usada por `routerLink`. */
  readonly path: string;
  /** Etiqueta visible y accesible del enlace. */
  readonly label: string;
  /** Icono Lucide asociado (currentColor), útil en la barra inferior. */
  readonly icon: IconName;
  /** Si el enlace debe coincidir de forma exacta para marcarse activo. */
  readonly exact: boolean;
}

/**
 * Destinos principales: Inicio, Calculadoras y Ayuda (Req 1.2). Las rutas se
 * configuran en la tarea 6.2; aquí solo se referencian por su ruta final.
 */
export const NAV_LINKS: readonly NavLink[] = [
  { path: '/', label: 'Inicio', icon: 'home', exact: true },
  { path: '/calculadoras', label: 'Calculadoras', icon: 'calculator', exact: false },
  { path: '/ayuda', label: 'Ayuda', icon: 'help-circle', exact: false },
];
