// Pruebas de ejemplo del FiscalYearBannerComponent (Req 17.1, 17.2, 17.3).
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FISCAL_CONSTANTS } from '../../../core/constants/fiscal-constants.token';
import type { FiscalConstants } from '../../../core/constants/fiscal-constants.types';
import {
  FiscalYearBannerComponent,
  STALENESS_WARNING_TEXT,
} from './fiscal-year-banner';

/** Constantes fiscales mínimas para las pruebas (año fiscal 2026). */
const TEST_CONSTANTS: FiscalConstants = {
  fiscalYear: 2026,
  effectiveFrom: '2026-01-01',
  lastVerified: '2026-01-01',
  minimumDailyWage: 100,
  uma: 108,
  isrMonthlyTable: [],
  vacationDaysTable: [{ yearsOfService: 1, days: 12 }],
  sourceRefs: {},
};

// Host para controlar los inputs del banner de forma declarativa.
@Component({
  imports: [FiscalYearBannerComponent],
  template: `
    <app-fiscal-year-banner
      [currentYear]="currentYear"
      [showWarningOnly]="showWarningOnly"
    />
  `,
})
class HostComponent {
  currentYear = 2026;
  showWarningOnly = false;
}

describe('FiscalYearBannerComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [{ provide: FISCAL_CONSTANTS, useValue: TEST_CONSTANTS }],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
  });

  function yearEl(): HTMLElement | null {
    return fixture.nativeElement.querySelector('.fiscal-year-banner__year');
  }

  function warningEl(): HTMLElement | null {
    return fixture.nativeElement.querySelector('.fiscal-year-banner__warning');
  }

  it('muestra de forma visible el año fiscal vigente de las constantes (Req 17.1)', () => {
    fixture.detectChanges();
    const text = yearEl()?.textContent ?? '';
    expect(text).toContain('2026');
  });

  it('no muestra el aviso cuando el año actual coincide con el fiscal (Req 17.2)', () => {
    host.currentYear = 2026;
    fixture.detectChanges();
    expect(warningEl()).toBeNull();
  });

  it('no muestra el aviso cuando el año actual es anterior al fiscal (Req 17.2)', () => {
    host.currentYear = 2025;
    fixture.detectChanges();
    expect(warningEl()).toBeNull();
  });

  it('muestra el aviso de desactualización cuando hay desfase (Req 17.2, 17.3)', () => {
    host.currentYear = 2027;
    fixture.detectChanges();
    expect(warningEl()).not.toBeNull();
    expect(warningEl()?.textContent?.trim()).toBe(STALENESS_WARNING_TEXT);
  });

  it('en modo "sólo aviso" oculta el año y muestra únicamente el desfase (Req 17.3)', () => {
    host.showWarningOnly = true;
    host.currentYear = 2027;
    fixture.detectChanges();
    expect(yearEl()).toBeNull();
    expect(warningEl()).not.toBeNull();
  });

  it('en modo "sólo aviso" sin desfase no renderiza nada', () => {
    host.showWarningOnly = true;
    host.currentYear = 2026;
    fixture.detectChanges();
    expect(yearEl()).toBeNull();
    expect(warningEl()).toBeNull();
  });
});
