// Prueba de ejemplo del NumberedIndexComponent (Req 1.3, 9.5).
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NumberedIndexComponent } from './numbered-index';

describe('NumberedIndexComponent', () => {
  let fixture: ComponentFixture<NumberedIndexComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NumberedIndexComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NumberedIndexComponent);
  });

  function renderedText(): string {
    const span = fixture.nativeElement.querySelector('.numbered-index') as HTMLElement;
    return span.textContent?.trim() ?? '';
  }

  it('renderiza el índice con relleno de cero para la primera posición', () => {
    fixture.componentRef.setInput('value', 1);
    fixture.detectChanges();
    expect(renderedText()).toBe('01');
  });

  it('se actualiza cuando cambia el valor de entrada', () => {
    fixture.componentRef.setInput('value', 7);
    fixture.detectChanges();
    expect(renderedText()).toBe('07');

    fixture.componentRef.setInput('value', 12);
    fixture.detectChanges();
    expect(renderedText()).toBe('12');
  });

  it('marca el índice como decorativo para lectores de pantalla', () => {
    fixture.componentRef.setInput('value', 3);
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('.numbered-index') as HTMLElement;
    expect(span.getAttribute('aria-hidden')).toBe('true');
  });
});
