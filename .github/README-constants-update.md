# Constants_Update_Workflow — actualización asistida de constantes fiscales (Req 16)

El workflow [`update-fiscal-constants.yml`](./workflows/update-fiscal-constants.yml)
mantiene vigentes las constantes fiscales del `Constants_Module` sin teclear
valores a mano. Se dispara de forma programada (cron mensual, Req 16.1), ejecuta
`scripts/update-fiscal-constants.ts` (tarea 27.1) para consultar ≥2 fuentes
oficiales, reconciliar, validar la sanidad y generar un `fiscal-constants.<año>.ts`
propuesto, y abre un Pull Request con el diff y los enlaces a la fuente oficial
(Req 16.2–16.7). Todo ocurre dentro del repositorio y de CI, sin backend en
runtime ni dependencias externas al repo (Req 16.11).

## Configuración obligatoria fuera del workflow (ajustes del repositorio)

Las exigencias de **no auto-merge**, **aprobación humana** y **checks
requeridos** (Req 16.9, 16.10) NO se pueden expresar en el YAML del workflow: se
configuran una sola vez en la **protección de rama** de `main`
(Settings → Branches → Branch protection rules):

1. **Require a pull request before merging** → Require approvals: ≥ 1.
   Esto obliga a revisión y aprobación humana antes de integrar (Req 16.10).
2. **Require status checks to pass before merging**, marcando como requeridos:
   - `Puertas de calidad del PR (pruebas de ejemplo)` — ejecuta las pruebas de
     ejemplo contra fuentes oficiales (`docs/formulas.md`) sobre los valores
     propuestos (Req 16.8). Si fallan, bloquean el merge (Req 16.9).
   - `Gate de sanidad (bloquea si falla)` — falla cuando alguna validación de
     sanidad no pasa, dejando el PR bloqueado (Req 16.6).
3. **No** habilitar auto-merge para esta rama (Req 16.10).

## Qué pasa al aprobar

El workflow **no** cambia el provider del año vigente. Un humano, tras revisar y
aprobar el PR, actualiza manualmente `src/app/app.config.ts` para apuntar al
nuevo `fiscal-constants.<año>.ts` y poner en vigor el año fiscal (Req 16.10).

## Estado bloqueado

Si una validación de sanidad falla, el PR se abre en **borrador** con el label
`blocked`, el detalle del error en la descripción y el check requerido
`Gate de sanidad` en fallo (Req 16.6). Si las fuentes difieren en algún valor,
el PR lleva además el label `requiere-revision-manual` y se conserva el valor
del año anterior para ese dato (Req 16.4).

## Fuentes oficiales (punto de extensión)

El runner de CI importa los `SourceFetcher` reales desde
`scripts/sources/official-fetchers.ts` (que debe exportar `OFFICIAL_FETCHERS` con
al menos dos fuentes y `SOURCE_URLS_BY_KEY` con los enlaces por valor). Mientras
ese módulo no exista, el workflow falla de forma explícita para no abrir un PR
con datos inventados (Req 16.2).
