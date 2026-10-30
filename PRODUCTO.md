# CalculaFácil — Definición de Producto

> Documento vivo. Nombre "CalculaFácil" es provisional y puede cambiar.
> Última actualización: 23 de octubre de 2026.

---

## 1. Resumen en una frase

Un sitio web gratuito de **calculadoras laborales y fiscales para México** (finiquito, liquidación, aguinaldo, ISR, sueldo neto/bruto, vacaciones, PTU, etc.), con una estética **editorial cálida y humana**, pensado para resolver dudas urgentes de dinero de forma clara, confiable y sin estrés.

---

## 2. Problema que resolvemos

Cuando a una persona en México la despiden, renuncia, o necesita entender cuánto le toca de aguinaldo o cuánto le retienen de impuestos, se enfrenta a fórmulas legales confusas (Ley Federal del Trabajo, tablas del SAT), calculadoras frías o llenas de jerga, y a la ansiedad propia de los temas de dinero. Resolvemos esto con calculadoras claras, instantáneas, gratuitas y amables, que explican el resultado en lenguaje simple.

---

## 3. Público objetivo

- **Primario:** trabajadores asalariados en México que acaban de ser despedidos, van a renunciar, o quieren verificar aguinaldo / ISR / finiquito.
- **Geografía:** México primero; después, otros países de habla hispana.
- **Perfil:** mayoría en móvil, llegan desde Google, quieren respuesta rápida sin registrarse.

---

## 4. Por qué este nicho (justificación con datos)

- Los nichos de **finanzas, seguros y legal** tienen el mayor valor por visita (CPC/RPM alto), muy por encima de utilidades genéricas.
- Las calculadoras fiscales de México son **específicas de la ley mexicana**: competimos contra sitios pequeños y fragmentados, no contra gigantes globales.
- Demanda validada: ya existen varios sitios pequeños de finiquito, ISR, Infonavit, etc.
- Ventaja diferenciadora: **México + español + experiencia editorial cálida + claridad**.

*Nota: los volúmenes de búsqueda exactos deben validarse con Google Keyword Planner antes de priorizar.*

---

## 5. Identidad visual (REDISEÑO 29 oct 2026)

**Concepto:** libreta contable de papelería mexicana. Papel verde-gris, tinta azul-negra, margen rojo a la izquierda de toda la hoja, renglones azules y marcatextos amarillo. Reemplaza la dirección anterior (vino + lavanda + Playfair/Inter), que se percibía genérica.

**Composición:**
- Títulos grandes alineados a la izquierda; el contenido arranca a la derecha del margen rojo.
- Índices como listas de calculadoras (nombre y descripción), sin numeración y sin tarjetas.
- El resultado es el protagonista: cifra sobre marcatextos con subrayado doble (el de los totales contables).
- Desglose con puntos guía hasta el importe, en columna de cifras.
- Campos como formato impreso: etiqueta arriba, línea de captura abajo.

**Paleta (tokens en `src/styles/_themes.scss`):**
| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| Papel | `#EDEFE4` | `#141B22` | Fondo |
| Tinta | `#1B2733` | `#E8EADF` | Texto, acción primaria |
| Tinta suave | `#4A5662` | `#A9B3BC` | Texto secundario |
| Rojo de margen | `#B3302A` | `#F09282` | Margen, errores, foco |
| Renglón | `#9FB3C8` | `#3A4C5E` | Líneas (nunca texto) |
| Marcatextos | `#F2D64B` | `#E8CB45` | Resalte del resultado y hover |

**Tipografía:** Schibsted Grotesk (títulos y texto) e IBM Plex Mono (solo cifras en columna).

**Tono de voz:** cercano, humano, tranquilizador. Ej: "Tus derechos también cuentan."

**Evitar (AI slop):** gradientes decorativos, glow, blobs, glassmorphism, 3D sin función, emojis, sombras, tarjetas flotantes, esquinas muy redondeadas, animaciones gratuitas, etiquetas en versales sobre cada título.

---

## 6. Requisitos de experiencia (UX)

- **Responsive**: escritorio, tablet y móvil.
- **Tema claro/oscuro** con toggle y preferencia persistida + respeto a `prefers-color-scheme`.
- **Sin registro ni instalación.**
- **Cálculo 100% en el navegador** (privacidad + costo casi nulo).
- Estructura por calculadora: entrada → resultado destacado → desglose en lista → explicación simple → aviso legal. Editable y recalculable.
- Accesibilidad: etiquetas visibles, contraste suficiente, navegable por teclado.

---

## 7. Monetización

- **Anuncios (Google AdSense)** en espacios reservados, activados con tráfico.
- **Donaciones** ("Invítame un café" / Ko-fi).
- **Futuro:** versión sin anuncios o funciones pro (exportar PDF del cálculo).

Expectativa honesta: los ingresos dependen del tráfico orgánico de Google, que tarda meses en crecer.

---

## 8. Aspectos legales

- Aviso visible en cada calculadora: "Resultado estimado con fines informativos. No constituye asesoría legal, fiscal ni contable oficial."
- Mantener actualizadas tablas del SAT, UMA y salario mínimo cada año fiscal.
- Fórmulas basadas en fuentes oficiales (LFT, SAT), verificadas, nunca inventadas.
- Política de privacidad (AdSense la exige).

---

## 9. Stack técnico

- **Framework:** Angular (componentes standalone).
- **Lógica de cálculo:** servicios con funciones puras en TypeScript (testeables).
- **Estilos:** SCSS + CSS custom properties para tokens y theming claro/oscuro.
- **Tipografía:** Schibsted Grotesk + IBM Plex Mono (fuentes web).
- **Sin backend:** todo client-side.
- **Despliegue:** Vercel / Netlify / Firebase Hosting (gratis).
- **SEO:** metadatos por ruta, URLs limpias, contenido explicativo, sitemap.

---

## 10. Alcance por fases

### Fase 1 — Base + primera calculadora
Sistema de diseño, arquitectura, inicio, navegación, búsqueda, tema claro/oscuro, estados (vacío/error/ayuda) + **calculadora de finiquito** verificada.

### Fase 2 — Calculadoras laborales
Liquidación (despido), aguinaldo, vacaciones y prima vacacional, días de vacaciones.

### Fase 3 — Fiscales y extras
ISR, sueldo neto/bruto, salario diario, PTU.

---

## 11. Próximos pasos

Ver `PLAN.md` para el desglose de tareas.
