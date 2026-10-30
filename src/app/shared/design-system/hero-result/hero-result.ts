import { formatCurrency, formatNumber, getCurrencySymbol } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
} from '@angular/core';

/**
 * `HeroResultComponent` — monto héroe del resultado (Req 3.2, 9.3).
 *
 * Presenta el total de una calculadora como el elemento tipográfico de mayor
 * tamaño de la pantalla, usando el token `--font-size-hero` (3rem), que la
 * escala tipográfica define como ≥1.5× el siguiente nivel `--font-size-2xl`
 * (2rem) para cumplir Req 9.3. Lo acompaña un filete de acento vino
 * (`--rule-accent-color`).
 *
 * El importe se formatea como moneda con `CurrencyPipe`; la moneda y la
 * configuración de dígitos son configurables por entradas para no acoplar el
 * componente a una divisa concreta (MXN por defecto).
 *
 * Solo tokens aprobados; SCSS puro, sin emojis ni efectos excluidos (Req 9.6).
 *
 * Requirements: 3.2, 9.3
 */
@Component({
  selector: 'app-hero-result',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hero-result.html',
  styleUrl: './hero-result.scss',
})
export class HeroResultComponent {
  /** Monto héroe a destacar; redondeado a 2 decimales por el cálculo (Req 3.2). */
  readonly amount = input.required<number>();

  /** Etiqueta editorial del resultado (p. ej. "Finiquito estimado"). */
  readonly label = input<string>('Total');

  /** Unidad del monto: pesos (por defecto) o días (sin símbolo ni decimales, con el sufijo "días"). */
  readonly unit = input<'currency' | 'days'>('currency');

  /** Código ISO de la moneda (MXN por defecto). */
  readonly currencyCode = input<string>('MXN');

  /** Símbolo/forma a mostrar: 'symbol' | 'code' | 'symbol-narrow'. */
  readonly currencyDisplay = input<'symbol' | 'code' | 'symbol-narrow'>('symbol');

  /** Formato de dígitos del `CurrencyPipe` (2 decimales por defecto). */
  readonly digitsInfo = input<string>('1.2-2');

  /**
   * Locale de formateo. Por defecto `undefined`, de modo que `CurrencyPipe`
   * use el `LOCALE_ID` de la aplicación y no exija registrar datos de locale
   * adicionales. Puede fijarse explícitamente si se registran esos datos.
   */
  readonly locale = input<string | undefined>(undefined);

  /** `aria-label` accesible que combina etiqueta y monto formateado. */
  protected readonly ariaLabel = computed(() =>
    this.unit() === 'days'
      ? `${this.label()}: ${this.amount()} ${this.amount() === 1 ? 'día' : 'días'}`
      : `${this.label()}: ${this.amount()}`,
  );

  private readonly defaultLocale = inject(LOCALE_ID);

  /** Locale efectivo (el fijado por input o el `LOCALE_ID` de la app). */
  private readonly effectiveLocale = computed(() => this.locale() ?? this.defaultLocale);

  /**
   * Monto formateado y descompuesto en tres partes visuales: símbolo de divisa,
   * parte entera (peso mayor) y los centavos (menor tamaño/opacidad). No altera
   * la lógica de entrada; deriva todo del mismo valor y configuración existentes.
   */
  protected readonly parts = computed(() => {
    const locale = this.effectiveLocale();
    if (this.unit() === 'days') {
      const days = this.amount();
      return {
        currency: '',
        integer: formatNumber(days, locale, '1.0-0'),
        fraction: '',
        suffix: days === 1 ? 'día' : 'días',
      };
    }
    const symbol = getCurrencySymbol(
      this.currencyCode(),
      this.currencyDisplay() === 'code' ? 'wide' : 'narrow',
      locale,
    );
    const display = this.currencyDisplay() === 'code' ? this.currencyCode() : symbol;

    // Formatea sin símbolo para separar limpiamente las partes numéricas.
    const numeric = formatCurrency(
      this.amount(),
      locale,
      '',
      this.currencyCode(),
      this.digitsInfo(),
    ).trim();

    // Separa la fracción decimal del resto respetando el separador del locale.
    const match = numeric.match(/^(.*?)([.,]\d+)?$/);
    const integer = match?.[1] ?? numeric;
    const fraction = match?.[2] ?? '';

    return { currency: display, integer, fraction, suffix: '' };
  });
}
