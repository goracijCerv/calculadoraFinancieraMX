# Chécalo

**Tus derechos también cuentan.** Calculadoras laborales y fiscales gratuitas para México: finiquito, liquidación, aguinaldo, vacaciones, ISR y más. El cálculo se ejecuta por completo en tu navegador, sin registro y sin enviar tus datos a ningún servidor.

## Características

- Calculadoras de finiquito, liquidación, aguinaldo, vacaciones, PTU, salario diario, sueldo neto/bruto e ISR mensual.
- 100% client-side: tus datos de entrada nunca salen de tu navegador.
- Búsqueda instantánea de calculadoras.
- Tema claro / oscuro.
- Accesible por teclado y con lectores de pantalla.
- Sin frameworks de CSS: diseño propio con tokens y SCSS.

## Tecnología

- [Angular](https://angular.dev/) 22 (standalone components, signals, lazy routes)
- SCSS con CSS custom properties
- [Vitest](https://vitest.dev/) para pruebas unitarias y de propiedades
- ESLint + Prettier

## Desarrollo

Requisitos: Node.js y npm.

```bash
npm install      # instalar dependencias
npm start        # servidor de desarrollo en http://localhost:4200/
npm test         # pruebas unitarias (Vitest)
npm run lint     # linter
npm run build    # build de producción en dist/calcula-facil/browser
```

## Despliegue

El proyecto genera un sitio estático (SPA). Está preparado para [Cloudflare Pages](https://pages.cloudflare.com/):

- **Build command:** `npm run build`
- **Output directory:** `dist/calcula-facil/browser`

El archivo `public/_redirects` reescribe todas las rutas a `index.html` para que el enrutado del lado del cliente funcione al recargar cualquier página.

## Apoyar el proyecto

Si Chécalo te resulta útil, puedes invitar un café en [Ko-fi](https://ko-fi.com/cervantiliap). Gracias por el apoyo.

## Aviso

Las calculadoras ofrecen estimaciones con fines informativos y no constituyen asesoría legal, laboral ni fiscal. Verifica siempre los cálculos con un profesional y con la normativa vigente.
