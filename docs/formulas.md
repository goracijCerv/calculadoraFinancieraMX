# Fórmulas oficiales y fuentes — CalculaFácil (Fase 0)

> **Propósito.** Este documento verifica y cita la fuente oficial de cada fórmula laboral/fiscal que
> usan las calculadoras de CalculaFácil, y fija los valores del año fiscal vigente. Es el
> **prerrequisito obligatorio** de toda la lógica de cálculo (Fases 1–3). Ninguna calculadora debe
> inventar fórmulas ni valores: todo importe se toma del `Constants_Module` y toda fórmula cita aquí
> su ordenamiento (LFT o SAT/DOF), artículo o tabla y año fiscal (Req 5.1, 5.2).
>
> **Año fiscal de referencia: 2026.**
>
> **Convención de redondeo (Req 5.1):** todo importe monetario se redondea a 2 decimales (centavos).
>
> _Nota de cumplimiento: el contenido de las fuentes externas fue parafraseado y resumido para
> cumplir con las restricciones de licencia; se incluyen enlaces a las fuentes oficiales._

---

## 0. Resumen de constantes del año fiscal 2026 (`Constants_Module`)

Estos valores alimentan `fiscal-constants.2026.ts`. Si un valor cambia para otro año, solo se edita
el archivo de constantes de ese año (Req 5.4).

| Constante | Valor 2026 | Vigencia | Fuente |
|---|---|---|---|
| Salario mínimo general (SMG) | **$315.04 / día** | desde 1-ene-2026 | CONASAMI / DOF 09-dic-2025 |
| Salario mínimo Zona Libre Frontera Norte (ZLFN) | **$440.87 / día** | desde 1-ene-2026 | CONASAMI / DOF 09-dic-2025 |
| UMA diaria | **$117.31** | 1-feb-2026 a 31-ene-2027 | INEGI / DOF |
| UMA mensual | **$3,566.22** | 1-feb-2026 a 31-ene-2027 | INEGI / DOF |
| UMA anual | **$42,794.64** | 1-feb-2026 a 31-ene-2027 | INEGI / DOF |
| Tope salario para prima de antigüedad | **$630.08 / día** (2 × SMG) | 2026 | LFT Art. 485–486 |
| Subsidio al empleo mensual | **$535.65** (feb–dic) / **$536.22** (ene) | 2026 | Decreto DOF 31-dic-2025 |
| Tope de ingreso para subsidio al empleo | **$11,492.66 / mes** | 2026 | Decreto DOF 31-dic-2025 |

---

## 1. Salario mínimo general y de la Zona Libre de la Frontera Norte (2026)

- **Fuente oficial:** Comisión Nacional de los Salarios Mínimos (CONASAMI), resolución publicada en el
  Diario Oficial de la Federación (DOF) el 09-dic-2025, vigente desde el 1 de enero de 2026.
  [CONASAMI — incremento 2026](https://www.gob.mx/conasami/prensa/consejo-de-representantes-de-la-conasami-acuerda-incremento-de-13-al-salario-minimo-general-en-2026?idiom=es)
- **Regla:** monto mínimo que un patrón debe pagar por jornada diaria. Es la cota inferior de validación
  de salario en las calculadoras (Req 5.6): un salario diario capturado por debajo del SMG de su zona es
  entrada inválida.

| Zona | Salario mínimo diario 2026 | Salario mínimo diario 2025 |
|---|---|---|
| General (resto del país) | $315.04 | $278.80 |
| Zona Libre de la Frontera Norte (ZLFN) | $440.87 | $419.88 |

- **Caso de referencia (prueba de ejemplo):** para el año fiscal 2026, `minimumDailyWage` (zona general)
  debe ser exactamente `315.04`. Un salario diario de `300.00` en zona general es inválido; `315.04` es el
  límite exacto válido.

---

## 2. UMA — Unidad de Medida y Actualización (2026)

- **Fuente oficial:** Instituto Nacional de Estadística y Geografía (INEGI), publicada en el DOF; vigente
  del 1 de febrero de 2026 al 31 de enero de 2027. Incremento de 3.69 % respecto a 2025 (INPC de dic-2025).
  [El Universal — UMA 2026](https://www.eluniversal.com.mx/cartera/el-valor-diario-de-la-uma-sera-de-11731-pesos-durante-2026/)
- **Uso:** base de topes y exenciones (p. ej. tope de exención de ISR en indemnizaciones, prima de
  antigüedad). No sustituye al salario mínimo.

| Periodo | Valor 2026 | Valor 2025 |
|---|---|---|
| Diario | $117.31 | $113.14 |
| Mensual | $3,566.22 | $3,439.46 |
| Anual | $42,794.64 | $41,273.52 |

- **Caso de referencia:** para 2026, `uma.diaria = 117.31`. La UMA mensual oficial es `3,566.22` (no
  `117.31 × 30`), por lo que debe almacenarse como valor publicado, no recalcularse.

---

## 3. ISR mensual (tarifa Art. 96 LISR) y subsidio al empleo (2026)

- **Fuente oficial:** Tarifa mensual del ISR conforme al Artículo 96 de la Ley del ISR, Anexo 8 de la
  Resolución Miscelánea Fiscal publicada en el DOF el 28-dic-2025, vigente desde el 1 de enero de 2026.
  [elconta — Anexo 8 RMF 2026](https://elconta.mx/tablas-isr-sat-ejercicio-2026-anexo-8-rmf/)
- **Regla de cálculo (por tramo / bracket):**
  1. Ubicar el renglón cuyo rango `[límite inferior, límite superior]` contiene al ingreso gravable mensual.
  2. `excedente = ingreso − límite inferior del renglón`.
  3. `impuesto marginal = excedente × (% sobre excedente / 100)`.
  4. `ISR = cuota fija del renglón + impuesto marginal`.
  5. Restar el subsidio al empleo aplicable (ver abajo) cuando el ingreso no rebase el tope.
- El ISR nunca es negativo y es monótono no decreciente respecto al ingreso (valida Property 11).

### Tarifa mensual ISR 2026 (11 tramos)

| # | Límite inferior ($) | Límite superior ($) | Cuota fija ($) | % sobre excedente |
|---|---|---|---|---|
| 1 | 0.01 | 844.59 | 0.00 | 1.92 |
| 2 | 844.60 | 7,168.51 | 16.22 | 6.40 |
| 3 | 7,168.52 | 12,598.02 | 420.95 | 10.88 |
| 4 | 12,598.03 | 14,644.64 | 1,011.68 | 16.00 |
| 5 | 14,644.65 | 17,533.64 | 1,339.14 | 17.92 |
| 6 | 17,533.65 | 35,362.83 | 1,856.84 | 21.36 |
| 7 | 35,362.84 | 55,736.68 | 5,665.16 | 23.52 |
| 8 | 55,736.69 | 106,410.50 | 10,457.09 | 30.00 |
| 9 | 106,410.51 | 141,880.66 | 25,659.23 | 32.00 |
| 10 | 141,880.67 | 425,641.99 | 37,009.69 | 34.00 |
| 11 | 425,642.00 | En adelante | 133,488.54 | 35.00 |

### Subsidio al empleo 2026

Desde el decreto de finales de 2024, el subsidio al empleo es una **cantidad fija mensual** ligada a la
UMA (ya no una tabla de tramos), para trabajadores cuyo ingreso gravable no rebase un tope.

- **Fuente oficial:** Decreto del subsidio al empleo publicado en el DOF el 31-dic-2025; el porcentaje
  aplicable a la UMA mensual pasó a 15.02 %.
  [IDC — subsidio al empleo 2026](https://idconline.mx/fiscal-contable/2026/01/02/actualizacion-del-subsidio-al-empleo-para-2026)
- **Monto:** $535.65 mensuales (febrero a diciembre de 2026); $536.22 en enero de 2026.
- **Tope de ingreso:** aplica solo si el ingreso gravable mensual no excede **$11,492.66**.
- **Aplicación:** `ISR neto a retener = ISR de tarifa − subsidio aplicable` (acotado a no volverse ISR
  negativo a cargo; el excedente de subsidio se entrega conforme a las reglas del decreto).

### Casos de referencia (pruebas de ejemplo en los límites de tramo)

Validar la fórmula de tarifa (antes de subsidio) en fronteras de renglón, año 2026:

- Ingreso = **$844.59** (tope del tramo 1): ISR = `0.00 + (844.59 − 0.01) × 1.92% = 16.2160…` ⇒ **$16.22**
  (coincide con la cuota fija del tramo 2, confirmando continuidad).
- Ingreso = **$12,598.02** (tope del tramo 3): ISR = `420.95 + (12,598.02 − 7,168.52) × 10.88%`
  = `420.95 + 5,429.50 × 0.1088` = `420.95 + 590.73 = ` **$1,011.68** (coincide con cuota fija del tramo 4).
- Ingreso = **$30,000.00** (dentro del tramo 6): ISR = `1,856.84 + (30,000.00 − 17,533.65) × 21.36%`
  = `1,856.84 + 12,466.35 × 0.2136` = `1,856.84 + 2,662.81 = ` **$4,519.65** (verificar exacto en la prueba).

> Las pruebas de ejemplo deben recalcular con la utilidad de redondeo del proyecto y fallar si la tabla
> o la fórmula se desvían de estos valores.

---

## 4. Días de vacaciones — reforma 2023 "Vacaciones Dignas" (Art. 76 LFT)

- **Fuente oficial:** Artículo 76 de la Ley Federal del Trabajo, reformado por decreto en vigor desde el
  1 de enero de 2023 ("Vacaciones Dignas"). Complementa el Art. 78 (al menos 12 días continuos).
  [PROFEDET / LFT](https://www.gob.mx/profedet) · texto del Art. 76 reformado.
- **Regla:** el periodo de vacaciones aumenta con la antigüedad. Del año 1 al 5 crece 2 días por año;
  a partir del sexto año aumenta 2 días por cada 5 años de servicio. Esta tabla vive en el
  `Constants_Module` como `vacationDaysTable` y debe ser monótona no decreciente (valida Property 10).

| Años de servicio (completos) | Días de vacaciones |
|---|---|
| 1 | 12 |
| 2 | 14 |
| 3 | 16 |
| 4 | 18 |
| 5 | 20 |
| 6 a 10 | 22 |
| 11 a 15 | 24 |
| 16 a 20 | 26 |
| 21 a 25 | 28 |
| 26 a 30 | 30 |
| 31 a 35 | 32 |

> A partir del 6.º año se suman 2 días por cada quinquenio adicional de servicio. La tabla se extiende
> con la misma regla para antigüedades mayores.

- **Caso de referencia:** antigüedad = 1 año ⇒ 12 días; 5 años ⇒ 20 días; 6 años ⇒ 22 días; 11 años ⇒ 24 días.

---

## 5. Vacaciones y prima vacacional (Art. 76 y 80 LFT)

- **Fuente oficial:** Artículo 80 de la LFT — la prima vacacional es de **al menos 25 %** sobre los
  salarios que correspondan al periodo de vacaciones. Días de vacaciones según Art. 76 (sección 4).
- **Regla de cálculo:**
  - `díasVacaciones = tabla Art. 76 (según antigüedad)`.
  - `pagoVacaciones = salarioDiario × díasVacaciones`.
  - `primaVacacional = pagoVacaciones × 0.25` (mínimo legal; configurable si el patrón ofrece más).
- La relación `primaVacacional = 0.25 × pagoVacaciones` es la invariante de Property 9.

- **Caso de referencia:** salario diario `$500.00`, antigüedad 1 año (12 días):
  - `pagoVacaciones = 500.00 × 12 = $6,000.00`.
  - `primaVacacional = 6,000.00 × 0.25 = $1,500.00`.

---

## 6. Aguinaldo (Art. 87 LFT)

- **Fuente oficial:** Artículo 87 de la LFT — aguinaldo anual de **al menos 15 días** de salario, pagadero
  antes del 20 de diciembre. Quien no cumple el año tiene derecho a la parte proporcional.
- **Regla de cálculo:**
  - `aguinaldoCompleto = salarioDiario × 15` (mínimo legal; puede ser mayor por contrato).
  - `aguinaldoProporcional = salarioDiario × 15 × (díasTrabajadosEnElAñoCalendario / 365)`.
- Para un año completo trabajado, el aguinaldo nunca es menor que 15 días de salario (valida Property 8).

- **Caso de referencia:** salario diario `$400.00`, año completo:
  - `aguinaldo = 400.00 × 15 = $6,000.00`.
  - Medio año (182 días): `400.00 × 15 × (182/365) = $2,991.78` (redondeado a 2 decimales).

---

## 7. Finiquito — partes proporcionales (Art. 76, 80, 87 LFT)

El finiquito procede en cualquier terminación de la relación laboral (incluida la renuncia) y se compone
de las **partes proporcionales** devengadas y no pagadas. No incluye indemnización (eso es liquidación).

- **Fuente oficial:** LFT Art. 87 (aguinaldo proporcional), Art. 76 (vacaciones) y Art. 80 (prima
  vacacional), más días de salario pendientes del último periodo.
- **Conceptos del desglose (Req 6.1, 6.2):**
  1. **Días pendientes de salario** = `salarioDiario × díasTrabajadosNoPagados`.
  2. **Aguinaldo proporcional** = `salarioDiario × 15 × (díasTrabajadosEnElAñoCalendario / 365)`.
  3. **Vacaciones proporcionales** = `salarioDiario × díasVacaciones(añoDeServicioEnCurso) × (díasTrabajadosDesdeAniversario / 365)`,
     donde `añoDeServicioEnCurso = añosCumplidos + 1` (con menos de un año, el 1.º ⇒ 12 días). Si la terminación cae
     exactamente en un aniversario, se cierra ese año de servicio: `añoDeServicioEnCurso = añosCumplidos` y 365/365.
  4. **Prima vacacional proporcional** = `vacacionesProporcionales × 0.25`.
  - `total = suma de los conceptos anteriores` (valida Property 3 y Property 6).
- La prima de antigüedad **solo** entra en el finiquito por renuncia si la antigüedad es ≥ 15 años
  (Art. 162 fr. III); en despido entra siempre (ver sección 8).

- **Caso de referencia:** salario diario `$500.00`, ingreso 2025-01-01, terminación 2026-12-31
  (1 año cumplido; el 2.º año de servicio está en curso ⇒ 14 días de vacaciones), con todo el salario pagado y vacaciones del año en curso aún no gozadas:
  - Aguinaldo proporcional (del 1-ene al 31-dic de 2026 = 365 días) = `500 × 15 × (365/365) = $7,500.00`.
  - Vacaciones (14 días del 2.º año de servicio, 364 días del año de servicio 2026-01-01 → 2026-12-31) = `500 × 14 × (364/365) = $6,980.82`.
  - Prima vacacional = `6,980.82 × 0.25 = $1,745.21`.
  - Días pendientes = `$0.00` (salario al día).
  - **Total finiquito = $16,226.03.**

> Bases de prorrateo (año de 365 días), fijadas aquí para que la función pura sea determinista:
> el **aguinaldo** usa los días trabajados en el **año calendario** de la terminación (desde el 1 de enero,
> o desde el ingreso si fue ese año, hasta la fecha de fin inclusive, con tope de 365); las **vacaciones**
> y su prima usan los días del **año de servicio en curso** (desde el último aniversario) y los días de vacaciones de ese año de
> servicio (años cumplidos + 1; 12 días con menos de un año). Criterio de la práctica (el texto del Art. 76 no lo precisa).
> La prueba de ejemplo usa exactamente esta base.

---

## 8. Liquidación por despido injustificado (Art. 48, 50, 162 LFT)

- **Fuente oficial:** Artículo 48 (indemnización constitucional de 3 meses), Artículo 50 fr. II (20 días
  de salario por cada año de servicio) y Artículo 162 (prima de antigüedad), LFT.
  [PROFEDET — prima de antigüedad](https://www.gob.mx/profedet/prensa/como-se-paga-la-prima-de-antiguedad-en-mexico)
- **Conceptos del desglose (Req 7.1):**
  1. **Indemnización constitucional (3 meses)** = `salarioDiario × 90`.
  2. **20 días por año** = `salarioDiario × 20 × añosDeServicio`.
  3. **Prima de antigüedad** = `salarioTopado × 12 × añosDeServicio`, donde
     `salarioTopado = min(salarioDiario, 2 × salarioMínimoDeLaZona)` (Art. 485–486).
     - Tope 2026 zona general = `2 × 315.04 = $630.08 / día`.
  - Normalmente también se suman las partes proporcionales del finiquito (sección 7); la liquidación
    = indemnización + finiquito.
- `total = suma de los tres componentes` (valida Property 7 y Property 3).

- **Caso de referencia:** salario diario `$500.00`, antigüedad 5 años, zona general (tope $630.08, no
  aplica porque 500 < 630.08):
  - 3 meses = `500 × 90 = $45,000.00`.
  - 20 días/año = `500 × 20 × 5 = $50,000.00`.
  - Prima de antigüedad = `500 × 12 × 5 = $30,000.00` (salario sin topar, está por debajo del tope).
  - **Total indemnización = $125,000.00** (más las proporcionales del finiquito).

- **Caso de referencia con tope aplicado:** salario diario `$1,000.00`, antigüedad 3 años, zona general:
  - Prima de antigüedad = `min(1000, 630.08) × 12 × 3 = 630.08 × 36 = $22,682.88`.

---

## 9. PTU — Participación de los Trabajadores en las Utilidades (Art. 117–131 LFT)

- **Fuente oficial:** Artículos 117 a 131 de la LFT; reforma de 2021 que introdujo el tope por trabajador.
  El reparto global es el **10 % de la renta gravable** declarada ante el SAT por el patrón.
- **Regla de cálculo:**
  - El monto a repartir se divide en **dos mitades iguales**:
    - **Mitad A** se reparte por **días trabajados** por cada persona en el año.
    - **Mitad B** se reparte en proporción a los **salarios devengados** en el año.
  - **Tope individual (reforma 2021):** cada persona recibe, como máximo, el mayor de:
    (a) 3 meses de su salario, o (b) el promedio de la PTU recibida en los últimos 3 años.
- **Invariante:** la suma de las partes repartidas no excede el monto a repartir y cada parte es ≥ 0
  (valida Property 14).

- **Caso de referencia:** monto a repartir `$120,000.00`, un solo trabajador con 365 días y salario anual
  que representa el 100 % de la base:
  - Mitad A = `$60,000.00` (todos los días), Mitad B = `$60,000.00` (todo el salario) ⇒ reparto bruto
    `$120,000.00`, acotado por el tope individual (3 meses de salario o promedio trienal, el mayor).
  - Si el salario mensual es `$10,000.00`, tope por 3 meses = `$30,000.00`, por lo que la PTU final del
    trabajador = `$30,000.00` y el excedente queda conforme a las reglas del reparto.

---

## Trazabilidad con requerimientos y propiedades

| Sección | Fuente (ordenamiento · artículo/tabla · año) | Requisitos | Propiedades de diseño |
|---|---|---|---|
| 1. Salario mínimo | CONASAMI · DOF 09-dic-2025 · 2026 | 5.1, 5.3, 5.6 | Property 4 |
| 2. UMA | INEGI · DOF · 2026 | 5.1, 5.3 | — |
| 3. ISR + subsidio | SAT · Art. 96 LISR, Anexo 8 RMF / Decreto DOF 31-dic-2025 · 2026 | 5.1, 5.2, 8.1 | Property 11 |
| 4. Días de vacaciones | LFT · Art. 76 (reforma 2023) · 2026 | 5.3, 7.4 | Property 10 |
| 5. Vacaciones y prima | LFT · Art. 76, 80 · 2026 | 7.3 | Property 9 |
| 6. Aguinaldo | LFT · Art. 87 · 2026 | 7.2 | Property 8 |
| 7. Finiquito | LFT · Art. 76, 80, 87 · 2026 | 6.1, 6.2 | Property 3, 6 |
| 8. Liquidación | LFT · Art. 48, 50, 162, 485–486 · 2026 | 7.1 | Property 3, 7 |
| 9. PTU | LFT · Art. 117–131 (reforma 2021) · 2026 | 8.5 | Property 14 |

## Notas de verificación y pendientes

- Los valores anuales 2026 (salario mínimo, UMA, tarifa ISR y subsidio al empleo) están **publicados
  oficialmente** y confirmados en el DOF (fechas citadas por sección). No se usó ningún valor de
  respaldo de año anterior.
- La tabla del Art. 76 se extiende más allá de 35 años con la misma regla (2 días por quinquenio);
  `vacationDaysTable` debe cubrir el rango de antigüedades que la calculadora permita capturar.
- Las bases de proration del finiquito (año de 365 días) se fijan en este documento para garantizar la
  pureza y el determinismo de las funciones de cálculo (Req 5.5). Cada prueba de ejemplo recalcula con
  la utilidad de redondeo común del proyecto.
- Antes de cada ejercicio fiscal nuevo, revalidar todas las cifras contra el DOF y crear
  `fiscal-constants.<año>.ts` sin tocar la lógica de las calculadoras (Req 5.4).
