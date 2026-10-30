// Prueba de ejemplo del EmptyStateComponent (Req 2.3, 12.3).
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmptyStateComponent } from './empty-state';

describe('EmptyStateComponent', () => {
  let fixture: ComponentFixture<EmptyStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyStateComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(EmptyStateComponent);
  });

  function messageEl(): HTMLElement {
    return fixture.nativeElement.querySelector('.empty-state__message') as HTMLElement;
  }

  function titleEl(): HTMLElement | null {
    return fixture.nativeElement.querySelector('.empty-state__title');
  }

  it('renderiza el mensaje descriptivo (Req 2.3, 12.3)', async () => {
    fixture.componentRef.setInput('message', 'No hay calculadoras que coincidan.');
    await fixture.whenStable();
    expect(messageEl().textContent?.trim()).toBe('No hay calculadoras que coincidan.');
  });

  it('omite el título cuando no se proporciona', async () => {
    fixture.componentRef.setInput('message', 'Sin resultados.');
    await fixture.whenStable();
    expect(titleEl()).toBeNull();
  });

  it('muestra el título opcional cuando se proporciona', async () => {
    fixture.componentRef.setInput('message', 'Sin resultados.');
    fixture.componentRef.setInput('title', 'Nada por aquí');
    await fixture.whenStable();
    expect(titleEl()?.textContent?.trim()).toBe('Nada por aquí');
  });

  it('expone el estado vacío a lectores de pantalla como status', async () => {
    fixture.componentRef.setInput('message', 'Sin resultados.');
    await fixture.whenStable();
    const section = fixture.nativeElement.querySelector('.empty-state') as HTMLElement;
    expect(section.getAttribute('role')).toBe('status');
    expect(section.getAttribute('aria-live')).toBe('polite');
  });
});
