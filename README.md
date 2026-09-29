# Nuvio

> Información médica compleja, explicada en lenguaje claro.

**Nuvio** es una plataforma web que ayuda a entender los propios estudios médicos: análisis de sangre, resonancias, tomografías, epicrisis y otros documentos clínicos.

Subes el PDF de tu estudio y la inteligencia artificial lo analiza para explicarte, en lenguaje simple, qué significa cada valor, qué está fuera de rango y qué preguntas conviene hacerle al médico.

Todo queda guardado en tu cuenta: puedes chatear con cada documento, comparar estudios del mismo tipo y ver la evolución de tus valores en el tiempo.

**No reemplaza al médico ni hace diagnósticos.** El objetivo es que llegues a la consulta con más contexto y mejores preguntas.

**Proyecto en producción:** [nuvio-lemon-six.vercel.app](https://nuvio-lemon-six.vercel.app)

---

## Rediseño visual — Serene Clinical Editorial

Cambio **solo de diseño** en la rama `redesign/serene-clinical-editorial`. Cero funcionalidad nueva: no se agregaron rutas, acciones de servidor, campos de Supabase, dependencias ni lógica. Toda la copia, los colores y la tipografía se reemplazaron por los valores del sistema de diseño; los datos en pantalla siguen siendo los mismos, leídos de los mismos payloads reales.

Fuente de diseño: `stitch_nuvio_visual_redesign/serene_clinical_editorial/DESIGN.md`, con nueve pantallas de referencia (landing, dashboard, mis estudios, subida, detalle, chat, comparar, evolución, perfil).

### Sistema de diseño

- **Fondo** `#FAF8FC` · **plum** `#251836` · **lilac** `#C084FC` / `#F3E0FE`
- **Estados médicos** (siempre acompañados de texto, nunca solo color):
  | Estado | Tint | Fuerte |
  |---|---|---|
  | Normal / en rango | `#EDF7EE` | `#236437` |
  | Elevado / atención | `#FEF3E8` | `#9A4B13` |
  | Bajo / bajo referencia | `#EEF2FE` | `#2C489C` |
  | Bandera clínica | `#FDF0F0` | `#A52A2A` |
- **Hairline** `rgba(37,24,54,0.08)` · **radio** 12px en controles, 20px en tarjetas
- **Tipografía**: Plus Jakarta Sans (títulos), Inter (texto), IBM Plex Mono (valores). Todos los valores numéricos usan `tabular-nums`.
- Los **nombres de los tokens se conservaron**; solo cambiaron sus valores. Así los tests que afirman clases exactas (`bg-violet text-white`, `bg-violet-tint text-violet`, `bg|text-*`) siguen verdes sin tocar `src/lib`.

### Fases

| # | Fase | Commit | Validación |
|---|---|---|---|
| A | Fundamentos: tokens, tipografía, primitivas (`Button`, `Card`, `Badge`, `Input`, `Textarea`, `Spinner`), OG y favicon | `04aebc3` | 680 tests, tsc, lint, build + verificador |
| B | Landing y login: `TrustBand`, `StudyTypes`, `ClarityComparison`, `FinalCta` | `f83c57d` | ídem + greps de términos prohibidos = 0 |
| C | Shell del dashboard e inicio: `StudyStatsGrid`, `DashboardRail` | `1560596` | ídem |
| D | Biblioteca de estudios y subida | `16dbb87` | ídem + fixes inline (contenido del `span`, píldora de conteo) |
| E | Detalle del estudio y análisis: `SectionAccordion`, `BiomarkerScale` | `e4dba41` | ídem + mapa de estados alineado a DESIGN, focus-radius, `tabular-nums` |
| F | Chat IA: layout de dos paneles, burbujas, chips de preguntas, compositor | `258579e` | ídem + verificador (reglas 1–7) PASS |
| G | Comparar y Evolución: cabeceras editoriales, matriz de parámetros | `d65fb56` | ídem + verificador PASS |
| H | Perfil: tarjetas de cuenta y sesión | `78e5148` | ídem + verificador PASS |
| I | Documentación y barrido final de claims | este commit | ver abajo |

Cada fase cerró con los cuatro checks en verde — `pnpm test` (**680 pass / 0 fail**), `pnpm exec tsc --noEmit`, `pnpm lint` (0 errores, 4 warnings preexistentes en archivos no tocados) y `pnpm build` (9/9 páginas) — más una verificación independiente de solo lectura que revisa integridad funcional, accesibilidad y claims.

### Decisiones deliberadas

Cosas que **no** se reprodujeron de las pantallas de referencia, a propósito:

1. **Datos de maqueta.** Nombres de pacientes, médicos y laboratorios de las referencias no existen en la app; todo lo que se ve se lee de la sesión real o de las filas de la base.
2. **Claims de cumplimiento.** HIPAA, GDPR/RGPD, AES-256, ISO 27001, SOC 2, FHIR/HL7, Passkeys y "Zero-Training" no aparecen en ninguna parte del código: no los podemos afirmar. Tampoco se menciona DICOM (el formato real es PDF).
3. **Comparar y Evolución siguen deterministas.** Se conservó el estilo, pero la copia describe lo que el código calcula de verdad; el disclaimer de comparación ya no dice que el resultado fue "generado por inteligencia artificial".
4. **Sin métricas inventadas.** No hay "+180.000", "98.4%" ni "<45 seg": los KPI del dashboard derivan de `getStudyStats` y `listStudies`.
5. **Elementos de maqueta sin dato de respaldo.** Gráfico LDL/HDL, tabs de categoría, buscador del sidebar del chat y badge de modelo no se implementaron: requerirían lógica nueva o afirmarían cosas falsas.

### Barrido final de claims

Verificado sobre `src/` (`.ts`, `.tsx`, `.css`):

- `HIPAA | GDPR | RGPD | AES-256 | ISO 27001 | SOC 2 | FHIR | HL7 | DICOM | Passkey | Zero-Training | certificad` → **0 coincidencias**
- Personas inventadas (`Sofía Mendoza`, `Fernando Ruiz`, `Valeria Gómez`, `Laboratorio Rossi`, …) → **0 coincidencias** (única falsa positiva: el comentario "misma filosofía que MRI" en `lib/analysis/result-presentation.ts`)
- Métricas de marketing → **0 coincidencias**

---

Creado con la ayuda de Claude y OpenCode.
