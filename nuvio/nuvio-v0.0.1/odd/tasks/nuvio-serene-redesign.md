# Nuvio — Rediseño "Serene Clinical Editorial"

## Objetivo

Replicar visualmente el diseño generado en Stitch (`C:\Users\Usuario\Downloads\stitch_nuvio_visual_redesign`) sobre la app Nuvio, usando `serene_clinical_editorial\DESIGN.md` como fuente de verdad de tokens. **Cero funcionalidad nueva**: solo tokens, componentes visuales, tipografía, layout y copy de UI.

## Problema / por qué

La UI actual ya usa una paleta plum/ivory pero con tipografía Inter+IBM Plex, radios y sombras propios, y sin el sistema completo del DESIGN.md. El mockup de Stitch define un sistema clínico-editorial completo (paleta, tipografía Plus Jakarta Sans + Inter, radios, spacing, elevación, componentes) que debe reemplazar los valores actuales.

## Scope

**In scope:** `src/app/globals.css`, `src/app/layout.tsx`, `src/components/ui/*`, `src/components/**` (solo markup/clases/copy), `public/` (assets), `src/app/**/page.tsx` (solo markup/copy), metadata Open Graph.

**Fuera de scope:** rutas, server actions, contratos Zod, RLS/migraciones, lógica de `src/lib/**` (salvo strings de clases Tailwind en `presentation.ts` si cambia un token), tests de lógica, pipelines de Gemini/MuPDF.

## Restricciones no negociables (del brief)

1. **Solo diseño.** Si el mockup muestra una función que Nuvio no tiene, se adapta el layout, no se implementa la función.
2. **Datos del mockup = placeholders.** "Sofía Mendoza", "Dr. Fernando Ruiz", valores de laboratorio: nunca como contenido fijo. La UI sigue bindeada a datos reales del usuario autenticado.
3. **Sin claims de compliance.** Nada de HIPAA / GDPR Art. 9 / AES-256-GCM certificado / HL7 FHIR / ISO 27001 / SOC 2 / Passkeys / Zero-Training / DICOM. Nuvio sube PDF/imagen y no tiene certificaciones. Copy genérico y verdadero (ej. "Tus documentos se almacenan de forma privada y cifrada").
4. **Comparar y Evolución son deterministas, sin IA.** Mantener el estilo visual de las tarjetas del mockup pero cambiar copy que implique que un modelo generó la comparación.
5. **Sin métricas de marketing falsas.** No "+180.000 estudios", "98.4% precisión", "<45 seg": sin cifras reales verificadas → sin números.
6. **Nombres de doctores/pacientes de ejemplo** nunca fijos: datos dinámicos o placeholders neutros.

## Fuente de verdad de valores exactos

`C:\Users\Usuario\Downloads\stitch_nuvio_visual_redesign\serene_clinical_editorial\DESIGN.md` — no inventar ni aproximar tokens, tomarlos literal.

## Capturas de referencia (9)

En `C:\Users\Usuario\Downloads\stitch_nuvio_visual_redesign\<pantalla>\` (`code.html` + `screen.png`):

| Captura | Pantalla real |
|---|---|
| `landing_p_blica_nuvio` | `/` |
| `dashboard_principal_nuvio` | `/dashboard` |
| `mis_estudios_nuvio` | `/dashboard/estudios` |
| `subida_de_estudio_y_ocr_cl_nico_nuvio` | `/dashboard/subir` |
| `detalle_de_estudio_y_an_lisis_nuvio` | `/dashboard/estudios/[id]` |
| `chat_ia_contextual_nuvio` | `/dashboard/chat/[id]` |
| `comparaci_n_de_dos_estudios_nuvio` | `/dashboard/comparar` |
| `evoluci_n_longitudinal_y_tendencias_nuvio` | `/dashboard/evolucion` |
| `ajustes_de_perfil_y_privacidad_m_dica_nuvio` | `/dashboard/perfil` (solo identidad + cerrar sesión) |

Nota: la comparación evolutiva del mockup se divide en las dos pantallas reales; no fusionarlas.

## Estrategy de entrega

- Rama: `redesign/serene-clinical-editorial` (creada desde `main`).
- Commits work-unit convencionales, uno por fase, con paths explícitos (el repo git raíz es `Proyectos/`).
- Push / PR: decisión del usuario (no autorizada todavía).
- RDD (receipt-driven development): **off** → no corre review; validación funcional ordinaria.

## Validación por fase (obligatoria)

```
pnpm test
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

Baseline antes de empezar: `pnpm test` → **680 pass / 0 fail**.

## Riesgos conocidos

- Los tests fijan strings de clases Tailwind: `lib/evolution/presentation.test.ts` (`"bg-violet text-white"`, `"bg-violet-tint text-violet"`), `lib/comparison/presentation.test.ts` (`^(bg|text)-`). **Estrategia: conservar los NOMBRES de token y cambiar solo sus VALORES** en `globals.css`, para no romper tests ni tocar `src/lib`.
- `bg-muted` es clase muerta hoy (`--color-muted` no definida) → definirla en la retokenización.
- Doble gate de auth (middleware + `dashboard/layout.tsx`) y `revalidatePath` con rutas literales: no tocar.
- Accesibilidad existente a preservar: `aria-*`, `focus-visible`, `prefers-reduced-motion`, `touch-target` 44px.
- Formularios con `action={...}` nativo: no romper el patrón.

## Checklist de tareas

### Fase A — Fundamentos del design system
- [ ] A1. Fuentes: Plus Jakarta Sans (headings) + Inter (body) vía `next/font/google` en `layout.tsx`; mapear `--font-sans`/`--font-heading` en `@theme` de `globals.css`.
- [ ] A2. Retokenizar `globals.css` con valores literales del DESIGN.md (colores, status badges, radios, spacing, elevación/sombras 3 niveles, bordes hairline). Conservar nombres de token existentes; agregar `--color-muted` (clase muerta) y tokens de status.
- [ ] A3. Reestilizar primitivos: `Button` (primario `#251836`, hover `#35234E`, radio 12px, padding 12/24, focus ring `#C084FC`), `Card` (20px, hairline, sombra plum), `Badge` (pill 4/12, label-sm, 4 pares de status), `Input`/`Textarea` (12px, halo focus lila), `Spinner`.
- [ ] A4. Assets: favicon isotipo circular, logo horizontal en navbar + dashboard layout, `metadataBase` + `openGraph.images` + `twitter` en `layout.tsx`.
- [ ] A5. Validación de fase.

### Fase B — Landing pública + login
- [ ] B1. Landing: hero oscuro plum con radial lila, stats **sin cifras inventadas**, "Cómo funciona en 3 pasos", tipos de estudios (sin DICOM),Claridad médica sin ansiedad, Seguridad y Privacidad **sin claims de compliance**, CTA final, footer.
- [ ] B2. Login: mantener auth flow; aplicar estilo del sistema (logo sin `brightness-0 invert` si el logo ya es correcto), links `/terminos` `/privacidad` no existentes → resolver.
- [ ] B3. Validación de fase.

### Fase C — Shell dashboard + Inicio
- [ ] C1. `dashboard/layout.tsx`: sidebar fijo 260px desktop, header móvil, marca, footer de usuario; contenido máx. 1340px.
- [ ] C2. `/dashboard`: saludo, dropzone, KPI cards, estudios recientes, riel derecho (asistente de consultas con copy no-AI-inventado), tarjeta de tendencia.
- [ ] C3. Validación de fase.

### Fase D — Mis estudios + Subir
- [ ] D1. `/dashboard/estudios`: grilla de tarjetas, filtros/estados vacíos.
- [ ] D2. `/dashboard/subir`: dropzone con 3 fases del mockup (adaptadas al flujo real).
- [ ] D3. Validación de fase.

### Fase E — Detalle del estudio
- [ ] E1. `/dashboard/estudios/[id]`: header, secciones de análisis, badges de estado con pares muted, **barra de rango de biomarcador**, guía de consulta, CTA "Preguntar sobre este estudio" existente, disclaimer médico.
- [ ] E2. Validación de fase.

### Fase F — Chat
- [ ] F1. `/dashboard/chat/[id]`: sidebar de conversaciones, estudio en foco, burbujas, sugeridas.
- [ ] F2. Validación de fase.

### Fase G — Comparar + Evolución
- [ ] G1. `/dashboard/comparar`: estilo del mockup, copy **determinista** (sin "IA generó esto"), sin "Preguntar al Asistente IA" como si hubiera interpretado.
- [ ] G2. `/dashboard/evolucion`: serie longitudinal, sparklines, matriz de biomarcadores, copy determinista.
- [ ] G3. Validación de fase.

### Fase H — Perfil
- [ ] H1. `/dashboard/perfil`: solo bloques aplicables hoy (identidad, cerrar sesión). Sin médicos autorizados, biometría ni exportación HL7.
- [ ] H2. Validación de fase.

### Fase I — Cierre
- [ ] I1. Documentar la fase en `README.md` (raíz del repo) con detalle equivalente a las fases anteriores.
- [ ] I2. Validación final completa + revisión de que ningún claim falso quedó en la UI (grep por HIPAA/GDPR/ISO/SOC/DICOM/FHIR).
- [ ] I3. Reporte final.

## Progreso

| Fase | Estado | Commit | Checks |
|---|---|---|---|
| A | ✅ hecha | `04aebc3` | test 680/0, tsc clean, lint 0 err, build OK + verificador independiente PASS |
| B | ✅ hecha | `f83c57d` | test 680/0, tsc clean, lint 0 err, build OK + verificador independiente PASS (reglas 1-5 de contenido: 0 hits) |
| C | ✅ hecha | `1560596` | test 680/0, tsc clean, lint 0 err, build OK + verificador PASS (reglas 1-6: 0 blockers) |
| D | ✅ hecha | `16dbb87` | test 680/0, tsc clean, lint 0 err, build OK + verificador PASS (reglas 1-6: 0 blockers) + fixes inline (span block, pill oculta en 0) |
| E | ✅ hecha | `e4dba41` | test 680/0, tsc clean, lint 0 err, build OK + verificador PASS + fixes (mapa de estados DESIGN, focus-radius, tabular-nums) |
| F | ✅ hecha | `258579e` | test 680/0, tsc clean, lint 0 err, build OK + verificador PASS (reglas 1-7) |
| G | ✅ hecha | `d65fb56` | test 680/0, tsc clean, lint 0 err, build OK + verificador PASS (reglas 1-7, `src/lib` intacto) |
| H | ✅ hecha | `78e5148` | test 680/0, tsc clean, lint 0 err, build OK + verificador PASS (7/7) |
| I | ✅ hecha | README | barrido final de claims: 0 compliance/DICOM, 0 personas, 0 métricas inventadas |

**Siguiente paso:** Fase A1 (fuentes).
