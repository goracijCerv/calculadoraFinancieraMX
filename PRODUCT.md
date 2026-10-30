# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Trabajadores asalariados en México que acaban de ser despedidos, van a renunciar o quieren verificar su aguinaldo, ISR o finiquito. Llegan casi siempre desde Google en el celular, con una duda urgente de dinero y cierta ansiedad; quieren la respuesta rápido y sin registrarse.

## Product Purpose
Calculadoras laborales y fiscales gratuitas para México (finiquito, liquidación, aguinaldo, vacaciones y prima vacacional, días de vacaciones, ISR mensual, sueldo neto/bruto, salario diario, PTU). Resuelve fórmulas legales confusas (LFT, SAT) con un resultado claro, un desglose y una explicación en lenguaje simple. Éxito: la persona entiende cuánto le toca y confía en la cifra. Monetización futura: anuncios (AdSense, hoy solo espacio reservado) y donaciones.

## Positioning
Español de México, contenido específico de la ley mexicana, cálculo 100 % en el navegador (los datos nunca salen del equipo) y tono humano y tranquilizador, frente a calculadoras frías o llenas de jerga.

## Operating Context
Se consulta en el celular en un momento de tensión (despido, renuncia, revisión de nómina). Cada calculadora sigue el mismo flujo: entrada, resultado destacado, desglose, explicación y aviso legal, con posibilidad de editar y recalcular. Hay tema claro y oscuro, y la preferencia se recuerda.

## Capabilities and Constraints
- SPA Angular 22 con componentes standalone, SCSS puro y variables CSS; sin backend, sin Tailwind, sin Angular Material ni PrimeNG.
- Fórmulas puras verificadas contra fuentes oficiales (LFT, SAT) y citadas en el código; constantes fiscales por año en un solo módulo (hoy 2026).
- Aviso legal visible en cada calculadora: "Resultado estimado con fines informativos. No constituye asesoría legal, fiscal ni contable oficial."
- Rutas: inicio, índice con búsqueda, una pantalla por calculadora, ayuda, privacidad y 404.
- Responsive (móvil con barra inferior de navegación), sin desbordes horizontales.
- Fases futuras: SEO por ruta, política de privacidad para AdSense, despliegue.

## Brand Commitments
Nombre provisional "CalculaFácil". Lema: "Tus derechos también cuentan." Tono cercano, humano y tranquilizador. Paleta de marca original: vino `#782F40`, gris lavanda `#E8E1E8`, blanco, grafito `#302830`, gris `#706A70` y bordes `#E5E0E2`; para el rediseño del inicio el usuario pidió fondo crema cálido `#FAF8F5` con el vino como acento.

## Evidence on Hand
Sin testimonios, clientes ni métricas reales; no inventarlos. Hay cifras oficiales 2026 documentadas con fuente en `docs/formulas.md`.

## Product Principles
1. La cifra y su explicación van antes que cualquier adorno: el usuario viene a entender cuánto le toca.
2. Claridad y calma sobre jerga: cada resultado se explica en lenguaje simple.
3. Privacidad por diseño: nada sale del navegador y no hay registro.
4. Exactitud citada: ninguna fórmula o constante se inventa; todo sale de fuentes oficiales.
5. El móvil es la pantalla principal; el escritorio la amplía.

## Accessibility & Inclusion
Contraste AA (≥4.5:1) en ambos temas, foco visible, navegación completa por teclado, etiquetas siempre visibles y respeto a `prefers-reduced-motion`.
