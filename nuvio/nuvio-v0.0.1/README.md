# Nuvio

> Plataforma web de inteligencia artificial para comprender información médica compleja en lenguaje claro.

## Descripción

**Nuvio** es una plataforma web que busca eliminar la barrera del vocabulario médico.

El usuario puede subir documentos médicos, como análisis de sangre, resonancias, tomografías, epicrisis, electrocardiogramas y otros estudios, para que la inteligencia artificial los analice y transforme su contenido técnico en una explicación clara, estructurada y fácil de comprender.

El objetivo no es reemplazar al médico ni realizar diagnósticos, sino ayudar al usuario a comprender mejor la información que aparece en sus propios estudios y llegar a una consulta médica con mayor contexto y mejores preguntas.

### Propuesta de valor

> **Nuvio convierte información médica compleja en información que las personas pueden entender.**

La plataforma debe ayudar a responder preguntas como:

* ¿Qué significa este valor?
* ¿Está dentro del rango esperado?
* ¿Qué valores aparecen fuera de rango?
* ¿Qué significa el resultado en términos simples?
* ¿Qué debería preguntarle a mi médico?
* ¿Hay información del documento que debería prestar especial atención?

---

# Stack tecnológico

* **Framework:** Next.js 16.3.3 (App Router, src directory)
* **Frontend:** React, TypeScript, Tailwind CSS
* **Backend:** Server Actions, Route Handlers
* **Auth:** Supabase Auth (Google OAuth + PKCE)
* **Base de datos:** Supabase (PostgreSQL + RLS)
* **Storage:** Supabase Storage (archivos PDF)
* **Extracción de texto:** MuPDF WASM (`mupdf@1.28.0`)
* **IA:** Google Gemini (`gemini-3-flash-preview` via `@google/genai@2.20.0`)
* **Validación:** Zod (`zod@4.5.4`)
* **Testing:** Node.js built-in test runner (`node:test`)
* **Linting:** ESLint
* **Package manager:** pnpm 11.24.0
* **Node:** 24.20.0
* **Despliegue:** Vercel (auto-despliegue desde `main`)

---

# Estado actual del proyecto

## Fases completadas

### Fase 1 — Autenticación
- Google OAuth con PKCE via Supabase Auth
- Middleware que valida sesión en cada petición
- Login, callback, logout funcionales

### Fase 2 — Upload y Storage
- Subida de PDFs a Supabase Storage (`study-pdfs`)
- Validación de MIME type, extensión y tamaño (máx. 50 MB)
- Registro en tabla `studies` con estado inicial `uploaded`

### Fase 3 — Procesamiento y extracción de texto
- Server action `processStudyAction()` que orquesta el flujo
- Extracción de texto con **MuPDF WASM** (lazy-load, timeout 8s, cleanup en try/finally)
- Almacenamiento en tabla `study_extractions` (extracted_text, page_count, method)
- Estados del estudio: `uploaded → processing → processed` (o `error` / `ocr_required`)

### Fase 4.1 — Visualización del contenido extraído
- Página `/dashboard/estudios/[id]` muestra el texto extraído
- Estados manejados: uploaded, processing, processed, error, ocr_required

### Fase 4.2.1 — Contrato estructurado Zod
- `src/lib/analysis/schema.ts`: `StudyAnalysisSchema`, `KeyFindingSchema`, `FindingStatusSchema`
- Tipos: `StudyAnalysis`, `KeyFinding`, `FindingStatus`
- Helpers: `parseStudyAnalysis()`, `safeParseStudyAnalysis()`
- 14 tests unitarios

### Fase 4.2.2 — Integración con Gemini
- `src/lib/analysis/gemini.ts`: `analyzeStudyText(extractedText)`
- Modelo: `gemini-3-flash-preview`
- System prompt de Nuvio (explicación médica, sin diagnósticos)
- Respuesta estructurada con `responseJsonSchema`
- Timeout 30s, validación de entrada y salida
- Prueba real verificada en Vercel

### Fase 4.2.3 — Persistencia del análisis
- Tabla `study_analyses` (1:1 con `studies`, JSONB)
- RLS con policies de INSERT, SELECT, UPDATE, DELETE por usuario
- `getStudyAnalysis()` y `upsertStudyAnalysis()` en server actions
- Idempotente (upsert con `onConflict: study_id`)

### Fase 4.2.4 — Pipeline de análisis IA
- `src/lib/analysis/analyze-study.ts`: función `analyzeStudy(studyId)`
- Flujo: `extracted_text → Gemini → JSON → Zod → study_analyses`
- Autenticación + ownership verification
- Validación de estado del estudio (`processed` solamente)
- `AnalysisError` con codes: `unauthenticated`, `study_not_found`, `study_not_ready`, `extraction_missing`, `extraction_empty`, `gemini_failed`, `persist_failed`
- 11 tests unitarios adicionales
- Prueba real en Vercel verificada (12.5s, 8 findings, Zod validó)

## Fases pendientes

- **Fase 4.3** — UI de resultados del análisis (mostrar findings, warnings, etc.)
- **Fase 4.4** — Automatizar análisis después del upload
- **Fase 5** — Dashboard y navegación
- **Fase 6** — Pulido visual, responsive, accesibilidad
- **Fase 7** — Producción y optimización

---

# Arquitectura

```text
src/
├── app/
│   ├── auth/
│   │   ├── login/page.tsx          # Login con Google OAuth
│   │   └── callback/route.ts       # Intercambia code por sesión (PKCE)
│   ├── dashboard/
│   │   ├── page.tsx                # Dashboard principal
│   │   ├── subir/page.tsx          # Subida de documentos
│   │   ├── estudios/
│   │   │   ├── page.tsx            # Lista de estudios
│   │   │   └── [id]/page.tsx       # Detalle del estudio + texto extraído
│   │   ├── chat/page.tsx           # Chat (futuro)
│   │   ├── comparar/page.tsx       # Comparar estudios (futuro)
│   │   └── perfil/page.tsx         # Perfil del usuario
│   └── layout.tsx                  # Layout raíz
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Cliente server-side
│   │   └── server.ts               # Helpers de servidor
│   ├── actions/
│   │   ├── auth.ts                 # Acciones de autenticación
│   │   └── studies.ts              # Server actions de estudios
│   ├── extraction/
│   │   └── pdf.ts                  # Extracción con MuPDF WASM
│   ├── analysis/
│   │   ├── schema.ts               # Contrato Zod (StudyAnalysis)
│   │   ├── gemini.ts               # Cliente Gemini + analyzeStudyText()
│   │   ├── analyze-study.ts        # Pipeline: extracted_text → Gemini → Zod → DB
│   │   └── __tests__/              # Tests unitarios
│   ├── studies/
│   │   └── processing.ts           # Pipeline de procesamiento
│   ├── studies-utils.ts            # Tipos, labels, constantes
│   └── auth/
│       └── callbacks.ts            # Helpers de auth
├── components/
│   ├── ui/                         # Componentes base (shadcn/ui)
│   ├── auth/                       # Componentes de autenticación
│   └── dashboard/                  # Componentes del dashboard
├── middleware.ts                    # Proxy/middleware de auth
└── types/
    └── database.ts                 # Tipos de Supabase
```

---

# Base de datos (Supabase)

## Tablas

### `studies`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid PK | UUID único del estudio |
| user_id | uuid FK | Propietario (→ auth.users) |
| file_name | text | Nombre del archivo |
| file_size | integer | Tamaño en bytes |
| mime_type | text | Tipo MIME |
| storage_path | text | Ruta en Supabase Storage |
| status | text | uploaded / processing / processed / error / ocr_required |
| created_at | timestamptz | Fecha de creación |
| updated_at | timestamptz | Última actualización (trigger) |

### `study_extractions`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid PK | UUID único |
| study_id | uuid FK UNIQUE | 1:1 con studies (CASCADE) |
| user_id | uuid FK | Propietario |
| extracted_text | text | Texto extraído del PDF |
| page_count | integer | Cantidad de páginas |
| method | text | Método de extracción (mupdf) |
| created_at | timestamptz | Fecha de creación |
| updated_at | timestamptz | Última actualización (trigger) |

### `study_analyses`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid PK | UUID único |
| study_id | uuid FK UNIQUE | 1:1 con studies (CASCADE) |
| user_id | uuid FK | Propietario |
| analysis | jsonb | Objeto StudyAnalysis completo |
| created_at | timestamptz | Fecha de creación |
| updated_at | timestamptz | Última actualización (trigger) |

## Seguridad (RLS)

- Cada tabla tiene RLS habilitado
- Policies por usuario autenticado (`auth.uid()`)
- INSERT verifica ownership del estudio asociado
- SELECT, UPDATE, DELETE filtrados por `user_id`
- No se usa `service_role` en la aplicación

---

# Pipeline de análisis IA

```text
study_extractions.extracted_text
      ↓
analyzeStudy(studyId)
      ├── Autenticar usuario (Supabase Auth)
      ├── Obtener estudio → verificar ownership + status = "processed"
      ├── Obtener extracted_text → verificar que no esté vacío
      ├── analyzeStudyText(extractedText)  →  Gemini API
      │     ├── validateInput() → trim + check empty
      │     ├── genai.models.generateContent() con responseJsonSchema
      │     ├── JSON.parse(response.text)
      │     └── parseStudyAnalysis(parsed) → Zod validation
      ├── upsertStudyAnalysis(studyId, analysis)  →  Supabase
      │     └── onConflict: study_id (idempotente)
      └── Return StudyAnalysis
```

---

# Variables de entorno

```env
NEXT_PUBLIC_SUPABASE_URL=<url-del-proyecto-Supabase>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<clave-pública-Supabase>
GEMINI_API_KEY=<clave-de-API-de-Google-Gemini>
```

El archivo `.env.example` contiene los placeholders sin valores reales.

---

# Comandos

```bash
# Desarrollo local
pnpm dev

# Build de producción
pnpm build

# Lint
pnpm lint

# Tests
pnpm test

# Deploy (automático tras push a main)
git push
```

---

# Despliegue

- **Repositorio:** https://github.com/federicobordon09-dev/nuvio.git
- **Producción:** https://nuvio-lemon-six.vercel.app
- **Local:** http://localhost:3000
- **Pipeline:** cada cambio se hace con `commit` + `push` a `main`; **Vercel redesplega automáticamente** tras el push.

---

# Comandos de desarrollo

Para iniciar el proyecto:

```bash
pnpm dev
```

Por defecto, la aplicación estará disponible en:

```text
http://localhost:3000
```

---

# Filosofía del proyecto

Nuvio debe ser una aplicación que reduzca la complejidad, no que la traslade al usuario.

Cada decisión de producto y desarrollo debe responder a una pregunta:

> **¿Esto hace que Nuvio sea más claro, seguro y útil para una persona que intenta entender su información médica?**

Si una funcionalidad agrega complejidad sin aportar valor significativo, reconsiderarla.

---

**Nuvio — Información médica compleja. Explicada de forma clara.**
