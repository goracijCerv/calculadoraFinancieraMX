import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OtherToolsComponent } from './other-tools';

describe('OtherToolsComponent', () => {
  let fixture: ComponentFixture<OtherToolsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OtherToolsComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(OtherToolsComponent);
    await fixture.whenStable();
  });

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('creates', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('muestra un enlace externo seguro a la herramienta por defecto (RapUPic)', () => {
    const link = el().querySelector<HTMLAnchorElement>('.other-tools__card');
    expect(link).not.toBeNull();
    expect(link?.getAttribute('href')).toBe('https://rapupic.pages.dev/heic-to-jpg/');
    expect(link?.getAttribute('target')).toBe('_blank');
    expect(link?.getAttribute('rel')).toContain('noopener');
    expect(link?.getAttribute('rel')).toContain('noreferrer');
  });

  it('no inyecta scripts ni iframes de terceros', () => {
    expect(el().querySelector('iframe')).toBeNull();
    expect(el().querySelector('script')).toBeNull();
  });

  it('permite personalizar nombre, descripción y destino', async () => {
    fixture.componentRef.setInput('toolName', 'Otra app');
    fixture.componentRef.setInput('toolDescription', 'Descripción personalizada');
    fixture.componentRef.setInput('toolHref', 'https://example.com/');
    await fixture.whenStable();

    expect(el().querySelector('.other-tools__name')?.textContent?.trim()).toBe('Otra app');
    expect(el().querySelector('.other-tools__description')?.textContent?.trim()).toBe(
      'Descripción personalizada',
    );
    expect(el().querySelector<HTMLAnchorElement>('.other-tools__card')?.getAttribute('href')).toBe(
      'https://example.com/',
    );
  });
});
