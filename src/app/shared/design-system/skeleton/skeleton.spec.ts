// Pruebas del SkeletonComponent (marcador de carga alineado a la cuadrícula).
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SkeletonComponent } from './skeleton';

describe('SkeletonComponent', () => {
  let fixture: ComponentFixture<SkeletonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkeletonComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(SkeletonComponent);
  });

  function skeletonEl(): HTMLElement {
    return fixture.nativeElement.querySelector('.skeleton') as HTMLElement;
  }

  it('usa la variante de texto por defecto', async () => {
    await fixture.whenStable();
    expect(skeletonEl().classList).toContain('skeleton--text');
  });

  it('aplica la clase de la variante solicitada', async () => {
    fixture.componentRef.setInput('variant', 'amount');
    await fixture.whenStable();
    expect(skeletonEl().classList).toContain('skeleton--amount');
  });

  it('propaga el ancho al estilo en línea', async () => {
    fixture.componentRef.setInput('width', '12ch');
    await fixture.whenStable();
    expect(skeletonEl().style.width).toBe('12ch');
  });

  it('fija la altura sólo en la variante block', async () => {
    fixture.componentRef.setInput('variant', 'block');
    fixture.componentRef.setInput('height', '120px');
    await fixture.whenStable();
    expect(skeletonEl().style.height).toBe('120px');
  });

  it('queda oculto para tecnologías de asistencia', async () => {
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.getAttribute('aria-hidden')).toBe('true');
    expect(host.getAttribute('role')).toBe('presentation');
  });
});
