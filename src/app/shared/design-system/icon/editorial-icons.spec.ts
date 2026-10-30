// Pruebas de ejemplo de los SVG editoriales propios (Req 9.2, 9.6, 13.x).
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditorialRuleComponent } from './editorial-rule.component';
import { EditorialSignatureComponent } from './editorial-signature.component';
import { ReceiptClipComponent } from './receipt-clip.component';

describe('EditorialRuleComponent', () => {
  let fixture: ComponentFixture<EditorialRuleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditorialRuleComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(EditorialRuleComponent);
  });

  function svg(): SVGSVGElement {
    return fixture.nativeElement.querySelector('svg.app-editorial-rule') as SVGSVGElement;
  }

  it('es decorativo y usa currentColor', () => {
    fixture.detectChanges();
    expect(svg().getAttribute('aria-hidden')).toBe('true');
    expect(svg().getAttribute('stroke')).toBe('currentColor');
  });

  it('respeta la longitud y el grosor configurados', () => {
    fixture.componentRef.setInput('length', 64);
    fixture.componentRef.setInput('weight', 2);
    fixture.detectChanges();
    expect(svg().getAttribute('width')).toBe('64');
    expect(svg().getAttribute('height')).toBe('2');
    expect(svg().getAttribute('stroke-width')).toBe('2');
  });
});

describe('EditorialSignatureComponent', () => {
  let fixture: ComponentFixture<EditorialSignatureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditorialSignatureComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(EditorialSignatureComponent);
  });

  function svg(): SVGSVGElement {
    return fixture.nativeElement.querySelector('svg.app-editorial-signature') as SVGSVGElement;
  }

  it('es decorativo por defecto y mantiene la proporción 3:1', () => {
    fixture.componentRef.setInput('width', 120);
    fixture.detectChanges();
    expect(svg().getAttribute('aria-hidden')).toBe('true');
    expect(svg().getAttribute('width')).toBe('120');
    expect(svg().getAttribute('height')).toBe('40');
    expect(svg().getAttribute('stroke')).toBe('currentColor');
  });

  it('se vuelve informativo cuando se pasa label', () => {
    fixture.componentRef.setInput('label', 'Firma');
    fixture.detectChanges();
    expect(svg().getAttribute('role')).toBe('img');
    expect(svg().getAttribute('aria-label')).toBe('Firma');
    expect(svg().getAttribute('aria-hidden')).toBeNull();
  });
});

describe('ReceiptClipComponent', () => {
  let fixture: ComponentFixture<ReceiptClipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReceiptClipComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(ReceiptClipComponent);
  });

  function svg(): SVGSVGElement {
    return fixture.nativeElement.querySelector('svg.app-receipt-clip') as SVGSVGElement;
  }

  it('es decorativo por defecto y usa currentColor', () => {
    fixture.detectChanges();
    expect(svg().getAttribute('aria-hidden')).toBe('true');
    expect(svg().getAttribute('stroke')).toBe('currentColor');
  });

  it('se vuelve informativo cuando se pasa label', () => {
    fixture.componentRef.setInput('label', 'Recibo');
    fixture.detectChanges();
    expect(svg().getAttribute('role')).toBe('img');
    expect(svg().getAttribute('aria-label')).toBe('Recibo');
  });
});
