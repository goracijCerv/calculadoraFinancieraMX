# Plan de Trabajo — CalculaFácil

> Plan de implementación por tareas. Ver `PRODUCTO.md` para la definición de producto.
> Stack: Angular (standalone) + SCSS + CSS custom properties. Sin backend. Cálculo client-side.
> Última actualización: 23 de octubre de 2026.

---

## Convenciones

- `[ ]` pendiente · `[~]` en progreso · `[x]` hecho y verificado.
- Cada fase termina con: lint + build + tests en verde antes de avanzar.
- Las fórmulas fiscales/laborales se verifican con fuentes oficiales (LFT, SAT) ANTES de implementarlas y se citan en el código.

---

## FASE 0 — Investigación y fundamentos (antes de codear lógica)

- [ ] **0.1** Verificar y documentar fórmulas y valores oficiales 2026:
  - [ ] Salario mínimo y UMA vigentes.
  - [ ] Finiquito: partes proporcionales de aguinaldo, vacaciones, prima vacacional, días pendientes.
  - [ ] Tabla de días de vacaciones (reforma 2023 "Vacaciones Dignas").
  - [ ] Tabla ISR mensual (SAT) y subsidio al empleo si aplica.
  - [ ] Aguinaldo (mínimo 15 días LFT).
  - [ ] Liquidación por despido (3 meses + 20 días/año + prima antigüedad).
  - Entregable: documento `docs/formulas.md` con fuentes citadas.
- [ ] **0.2** Confirmar decisiones de marca pendientes: nombre y dominio (provisional: CalculaFácil).

---

## FASE 1 — Base del proyecto + sistema de diseño

### Scaffolding
- [ ] **1.1** Crear proyecto Angular (standalone, routing, SCSS).
- [ ] **1.2** Configurar estructura de carpetas (core, shared, features, styles, assets).
- [ ] **1.3** Integrar fuentes Playfair Display + Inter (self-host o Google Fonts con display=swap).

### Sistema de diseño (tokens y theming)
- [ ] **1.4** Definir tokens de color como CSS custom properties (paleta obligatoria).
- [ ] **1.5** Definir escala tipográfica (Playfair para títulos, Inter para UI), espaciados, filetes, divisores.
- [ ] **1.6** Implementar theming claro/oscuro con superficies diferenciadas (no inversión) + toggle + persistencia (localStorage) + `prefers-color-scheme`.
- [ ] **1.7** Componentes base compartidos:
  - [ ] Botón (primario vino, secundario, texto).
  - [ ] Campo de formulario (label visible, input, ayuda, error) accesible.
  - [ ] Toggle de tema.
  - [ ] Divisor / filete editorial.
  - [ ] Bloque de "índice numerado" (01, 02…).
  - [ ] Aviso legal reutilizable.

### Layout y navegación
- [ ] **1.8** Shell de la app: header editorial con navegación (Inicio, Calculadoras, Ayuda) + toggle de tema.
- [ ] **1.9** Footer con aviso legal y enlace de donación.
- [ ] **1.10** Navegación responsive (escritorio/tablet/móvil, con barra inferior en móvil como en la referencia).

### Páginas de estructura
- [ ] **1.11** Página de **Inicio** editorial: título héroe ("Tus derechos también cuentan."), índice numerado de calculadoras principales, sección de herramientas adicionales, detalles tipo documento.
- [ ] **1.12** Página de **listado de calculadoras** (índice completo numerado, dos columnas en desktop).
- [ ] **1.13** **Búsqueda** de calculadoras (filtrado en cliente).
- [ ] **1.14** Página de **Ayuda** (preguntas frecuentes + guías/recursos).
- [ ] **1.15** Estados: **vacío**, **error**, **404**.

### Primera calculadora
- [ ] **1.16** Servicio de cálculo de **finiquito** (función pura, con las fórmulas verificadas en 0.1).
- [ ] **1.17** Pantalla de **finiquito**: formulario (salario, fechas, vacaciones pendientes, aguinaldo proporcional) + resultado destacado (cifra héroe + filete vino) + desglose en lista con divisores + aviso legal + editar/recalcular.
- [ ] **1.18** Tests unitarios del servicio de finiquito (casos representativos).
- [ ] **1.19** Validaciones de formulario (fechas coherentes, montos positivos) con mensajes claros.

### Cierre de fase
- [ ] **1.20** Responsive QA (desktop/tablet/móvil) + claro/oscuro sin desbordes.
- [ ] **1.21** Lint + build + tests en verde.
- [ ] **1.22** Documentar: README del proyecto (cómo correr, estructura, sistema de diseño).

---

## FASE 2 — Calculadoras laborales

- [ ] **2.1** Liquidación por despido injustificado (servicio + tests).
- [ ] **2.2** Pantalla de liquidación.
- [ ] **2.3** Aguinaldo (servicio + tests).
- [ ] **2.4** Pantalla de aguinaldo.
- [ ] **2.5** Vacaciones y prima vacacional (servicio + tests).
- [ ] **2.6** Pantalla de vacaciones/prima.
- [ ] **2.7** Días de vacaciones (según antigüedad, reforma 2023).
- [ ] **2.8** Lint + build + tests en verde. Actualizar docs.

---

## FASE 3 — Calculadoras fiscales y extras

- [ ] **3.1** ISR mensual (servicio + tests con tabla SAT).
- [ ] **3.2** Pantalla de ISR.
- [ ] **3.3** Sueldo neto ↔ bruto (servicio + tests).
- [ ] **3.4** Pantalla de sueldo neto/bruto.
- [ ] **3.5** Salario diario (conversor).
- [ ] **3.6** PTU (reparto de utilidades).
- [ ] **3.7** Lint + build + tests en verde. Actualizar docs.

---

## FASE 4 — Pulido y lanzamiento

- [ ] **4.1** SEO por ruta (títulos, meta description, Open Graph), sitemap, robots.
- [ ] **4.2** Accesibilidad: auditoría de contraste, foco, lectores de pantalla.
- [ ] **4.3** Rendimiento: lazy loading de rutas, optimización de fuentes e imágenes.
- [ ] **4.4** Política de privacidad + preparación para AdSense.
- [ ] **4.5** Despliegue (Vercel/Netlify/Firebase) + dominio.

---

## Riesgos y notas

- **Exactitud fiscal:** el mayor riesgo. Cada fórmula debe verificarse y citarse; incluir aviso legal siempre.
- **Actualización anual:** tablas SAT/UMA/salario mínimo cambian cada año; centralizarlas en un solo archivo de constantes para fácil mantenimiento.
- **Alcance:** no implementar lógica de cálculo sin haber verificado la fórmula en Fase 0.
