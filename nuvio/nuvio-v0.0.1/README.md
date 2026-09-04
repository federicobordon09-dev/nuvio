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
* **Frontend:** React 19, TypeScript, Tailwind CSS
* **Backend:** Server Actions, Route Handlers
* **Auth:** Supabase Auth (Google OAuth + PKCE)
* **Base de datos:** Supabase (PostgreSQL + RLS)
* **Storage:** Supabase Storage (archivos PDF privados)
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

### Fase 4.2.2 — Integración con Gemini
- `src/lib/analysis/gemini.ts`: `analyzeStudyText(extractedText)`
- Modelo: `gemini-3-flash-preview`
- System prompt de Nuvio (explicación médica, sin diagnósticos)
- Respuesta estructurada con `responseJsonSchema`
- Timeout 30s, validación de entrada y salida

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

### Fase 4.2.5 — Automatización del análisis
- Análisis automático tras procesar un estudio
- `analysis_status` en estudios: `pending`, `processing`, `completed`, `failed`
- Pipeline automático con claim de estado y reintentos seguros (sin bucles infinitos)

### Fase 4.2.6 — Análisis manual desde el detalle del estudio
- Botón "Analizar" que dispara el análisis bajo demanda
- Reanálisis manual permitido sobre estudios ya completados

### Fase 4.3 — UI de resultados del análisis
- Vista de resultados: resumen, hallazgos, observaciones, advertencias, recomendaciones, limitaciones y disclaimer
- Hallazgos con badge de estado (Normal / Elevado / Bajo) y valores en `font-mono`
- Explicaciones largas expandibles individualmente
- Vista en panel de 2 columnas (desktop) con metadata, acciones y contenido extraído colapsable

### Fase 4.4 — Automatización del análisis post-upload
- El análisis se dispara automáticamente cuando un estudio queda procesado
- Reintentos y manejo de errores sin afectar la disponibilidad del estudio

### Fase 5 — Dashboard y navegación
- Navegación compartida (DashboardNav / MobileNav)
- Conteos reales por estado (listos, en proceso, pendientes, con errores)
- Lista de estudios con acciones (ver, analizar, eliminar con confirmación)
- Gestión de estudios: `delete`, conteo y estados combinados

### Fase 6 — Rediseño visual Ocean / Ivory / Cream
- Lenguaje visual completo según spec de marca: paleta Ocean / Ivory / Cream (cálida, no clínico-fría)
- Tipografía Inter (UI) + IBM Plex Mono (datos clínicos)
- Vista de estudio tipo panel de resultados en 2 columnas (desktop) y 1 columna (mobile)
- Status semánticos (success / warning / danger / info) para badges y hallazgos
- Cards/paneles con radio unificado, sin sombras grises genéricas

### Fase 7 — Chat IA persistente
- Conversaciones, mensajes y contexto de estudios persistidos en Supabase
- Tablas `chat_conversations`, `chat_messages`, `chat_contexts` con RLS por usuario
- `chat-service` con Gemini y ventana de historial acotada
- Validación server-side de entrada (Zod) y ownership en cada operación
- Acciones: `createConversationAction`, `sendMessageAction`, `setContextAction`, `deleteConversationAction`, `renameConversationAction`
- Núcleo de datos testable con dependencias inyectadas (`chat-db.ts`, `study-context.ts`)

### Fase 7.1 — UX guiada y accesible del Chat IA
- Experiencia guiada para usuarios mayores / sin experiencia técnica
- Máquina de estados derivada del contenido: `pick-study → suggest → chat`
- Pantalla de bienvenida con CTA "Nueva conversación"
- Selector de estudios con tarjetas grandes accesibles (`NewConversationStudyPicker`)
- Banner "Estudio seleccionado" + preguntas sugeridas determinísticas por tipo de estudio
- Preguntas sugeridas en versión grande (grid) y compacta (chips)
- Accesibilidad: botones reales, `aria-pressed`, `aria-label`, focus-visible rings

### Fase 7.2 — Correcciones de routing y scroll del Chat IA
- **Routing persistente:** `/dashboard/chat` consulta las conversaciones persistidas en la base de datos: 0 conversaciones → pantalla inicial (Welcome); ≥1 → abre la más reciente viajando a `/dashboard/chat/[id]`
- **Fuente de verdad:** la URL (`/dashboard/chat/[id]`) queda como fuente de verdad; un refresh (F5) mantiene abierta la misma conversación, recargando conversación, mensajes y contexto desde Supabase
- **Historial de conversaciones:** sidebar con lista, resaltado de la activa, crear/eliminar/renombrar
- **Scroll de mensajes largos:** el área de mensajes es el único contenedor con scroll vertical; header y composer quedan fijos en desktop, tablet y mobile
- Helper puro `pickActiveConversationId` (derivado de la BD) que cubre 0/1/N conversaciones e IDs válidos/inválidos sin confiar en IDs de cliente

### Fase 7.3 — Título de conversación desde el tipo de estudio
- Al crear una conversación con contexto, el título se resuelve server-side desde `studies.study_type` del estudio seleccionado (`getConversationTitleFromStudyCore` + `getStudyTypeLabel`), nunca desde el cliente
- Mantiene consistencia con la clasificación del estudio (hemograma, resonancia, epicrisis, etc.)
- Fallback controlado a "Nueva conversación" cuando el estudio no tiene `study_type` o no pertenece al usuario

### Fase 7.4 — Preguntas sugeridas rotativas por tipo de estudio
- Pool ampliado a 8–10 preguntas reales por tipo (`blood_test`, `MRI`, `CT`, `ECG`, `epicrisis`, `medical_report` + fallback genérico)
- Hook `useSuggestedQuestions(studyType, messages)`: mantiene 4 preguntas visibles, dedup por preguntas ya usadas (reconstruido al refresh desde mensajes existentes), reemplaza automáticamente al consumir una sugerencia
- Integración sin duplicar lógica: `SuggestedQuestions` consume `questions={visible}`; el componente es stateless

### Fase 8.1 — Nuevo contrato estructurado de resultados médicos
- Reemplazo del contrato legacy de resultados por un schema Zod estricto en `src/lib/analysis/schema.ts`
- Separación explícita de `key_findings` (hallazgos cualitativos / por sistema) y `measurements` (parámetros cuantitativos con `value`, `unit`, `reference_range`, `status`)
- Capas `AnalysisSection` / `MedicalDisclaimer` y normalización legacy compatible con persistencia existente en `study_analyses`
- Inventarios `observations`, `warnings`, `recommendations`, `limitations` tipados y validados

### Fase 8.2 — Rediseño modular de la pantalla de resultados
- Componentes desacoplados: `StudyResultHeader`, `FindingsSection`, `FindingRow`, `MeasurementsSection`, `AnalysisSection`, `MedicalDisclaimer`, `AnalysisResult`
- `AnalysisResult` como orquestador que compone las secciones sin lógica médica duplicada
- Jerarquía visual consistente con Fase 6 (ocean / ivory / cream), tipografía y estados semánticos
- Estados vacíos vacíos controlados por sección (no se renderizan secciones sin contenido por tipo de estudio + datos reales)

### Fase 8.3 — Adaptación de presentación según tipo de estudio
- Capa central de presentación `src/lib/analysis/result-presentation.ts`: orden de secciones, sección primaria y labels contextuales por `study_type`
- 7 tipos cubiertos (`blood_test`, `MRI`, `CT`, `ECG`, `epicrisis`, `medical_report`, `other`) + fallback genérico para `null/undefined/desconocido`
- Ejemplo: analítico con `measurements` primario ("Valores de tu estudio"), MRI/CT con `findings` primario, ECG con `measurements` → "Parámetros" sin primaria forzada, epicrisis con `recommendations` en posición prioritaria
- Helpers `hasResultSectionContent()` / `getVisibleResultSections()` para filtrar secciones vacías sin crear componentes paralelos

### Fase 8.4 — CTA contextual hacia Chat IA desde la pantalla de resultados
- **Objetivo:** permitir explorar un estudio desde el resultado sin re-seleccionarlo a mano en el Chat.
- **CTA principal del resultado:** "Preguntar sobre este estudio" (primario, visible tras el header) → crea una conversación con el `study_id` como contexto y redirige a `/dashboard/chat/[id]`.
- **CTA por hallazgo:** "Preguntar sobre este hallazgo" (compacto, en `FindingRow`) → mismo estudio como contexto + sugerencia inicial "Quiero entender mejor este hallazgo: <título>.".
- **CTA por medición:** "Preguntar sobre este valor" (compacto, en `MeasurementsSection`) → mismo estudio como contexto + sugerencia "Quiero entender mejor este valor: <nombre> = <valor> <unidad>.".
- Helper puro `buildStudyChatPrompt(focus)` que solo refleja datos existentes (sin interpretación médica, sin diagnóstico, sin normalidad/gravedad); no usa ni modifica `status`/`reference_range`.
- **Persistencia reutilizada:** `createConversationWithContextAction` verifica ownership + `study.stage === "ready"` server-side (`assertStudyReadyCore`); acepta `prompt` opcional y lo propaga como `?prompt=` a la URL de la conversación.
- **Chat:** `chat/[id]/page.tsx` lee `?prompt=` y lo pasa a `ChatView.initialPrompt`; se muestra como primera sugerencia en la fase guiada (`suggest`) sin reemplazar `useSuggestedQuestions` / `SuggestedQuestions`.
- No se crean tablas nuevas ni segundas estrategias de contexto; conversaciones multi-estudio, `?new=1`, `/dashboard/chat` y cleanup post-borrado permanecen intactos.

## Mejoras futuras (no implementadas)

1. **Indicadores visuales adicionales de estado** — estados activos/inactivos más visibles en conversaciones.
2. **Comparador de estudios visual** — potenciar `/dashboard/comparar` más allá de contexto textual.

---

# Arquitectura

```text
src/
├── app/
│   ├── auth/
│   │   ├── login/page.tsx          # Login con Google OAuth
│   │   └── callback/route.ts       # Intercambia code por sesión (PKCE)
│   ├── dashboard/
│   │   ├── page.tsx                # Dashboard principal (resumen por estado)
│   │   ├── subir/page.tsx          # Subida de documentos
│   │   ├── estudios/
│   │   │   ├── page.tsx            # Lista de estudios
│   │   │   └── [id]/page.tsx       # Detalle + resultados del análisis
│   │   ├── chat/page.tsx           # Raíz del Chat IA (Welcome / redirige a la reciente)
│   │   ├── chat/[id]/page.tsx      # Conversación activa (mensajes + contexto)
│   │   ├── comparar/page.tsx       # Comparar estudios (futuro)
│   │   └── perfil/page.tsx         # Perfil del usuario
│   └── layout.tsx                  # Layout raíz
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Cliente server-side
│   │   └── server.ts               # Helpers de servidor
│   ├── actions/
│   │   ├── auth.ts                 # Acciones de autenticación
│   │   ├── studies.ts              # Server actions de estudios
│   │   └── chat.ts                 # Server actions del Chat IA
│   ├── extraction/
│   │   └── pdf.ts                  # Extracción con MuPDF WASM
│   ├── analysis/
│   │   ├── schema.ts               # Contrato Zod (StudyAnalysis)
│   │   ├── gemini.ts               # Cliente Gemini + analyzeStudyText()
│   │   ├── analyze-study.ts        # Pipeline: extracted_text → Gemini → Zod → DB
│   │   └── __tests__/              # Tests unitarios
│   ├── studies/
│   │   └── processing.ts           # Pipeline de procesamiento
│   ├── chat/
│   │   ├── schema.ts               # Contrato de datos del chat (Zod + tipos)
│   │   ├── chat-db.ts              # Acceso a datos testable (conversaciones, mensajes, contexto)
│   │   ├── chat-service.ts         # Generación de respuesta con Gemini
│   │   ├── study-context.ts        # Carga de estudios de contexto seleccionables
│   │   ├── active-conversation.ts  # Resolución de la conversación activa (routing)
│   │   ├── suggested-questions.ts  # Preguntas sugeridas determinísticas por tipo
│   │   ├── dates.ts                # Formato de fechas (es-AR)
│   │   ├── errors.ts               # Mensajes de error del chat
│   │   └── __tests__/              # Tests unitarios del chat
│   ├── studies-utils.ts            # Tipos, labels, constantes
│   └── auth/
│       └── callbacks.ts            # Helpers de auth
├── components/
│   ├── ui/                         # Componentes base (shadcn/ui)
│   ├── auth/                       # Componentes de autenticación
│   ├── dashboard/                  # Componentes del dashboard (nav, cards)
│   ├── studies/                    # Componentes de estudios (AnalysisResult, etc.)
│   └── chat/                       # Componentes del Chat IA
│       ├── ChatPageLayout.tsx      # Marco de dos paneles (sidebar + conversación)
│       ├── ChatView.tsx            # Máquina de estados pick-study / suggest / chat
│       ├── ChatWelcome.tsx         # Pantalla inicial (server component)
│       ├── ConversationList.tsx    # Historial de conversaciones
│       ├── NewConversationStudyPicker.tsx
│       ├── SelectedStudyBanner.tsx
│       ├── SuggestedQuestions.tsx
│       └── ContextPicker.tsx       # Contexto de estudios (chips)
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
| analysis_status | text | pending / processing / completed / failed |
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

### `chat_conversations`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid PK | UUID único |
| user_id | uuid FK | Propietario (→ auth.users) |
| title | text | Título de la conversación |
| created_at | timestamptz | Fecha de creación |
| updated_at | timestamptz | Última actividad (trigger) |

### `chat_messages`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid PK | UUID único |
| conversation_id | uuid FK | Conversación (CASCADE) |
| user_id | uuid FK | Propietario |
| role | text | user / assistant |
| content | text | Contenido del mensaje |
| created_at | timestamptz | Fecha de creación |

### `chat_contexts`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid PK | UUID único |
| conversation_id | uuid FK | Conversación (CASCADE) |
| study_id | uuid FK | Estudio usado como contexto |
| user_id | uuid FK | Propietario |
| created_at | timestamptz | Fecha de creación |

## Seguridad (RLS)

- Cada tabla tiene RLS habilitado
- Policies por usuario autenticado (`auth.uid()`)
- INSERT verifica ownership del estudio/conversación asociado
- SELECT, UPDATE, DELETE filtrados por `user_id`
- No se usa `service_role` en la aplicación
- **Chat:** nunca se confía en los IDs recibidos del cliente (conversación, estudio, contexto) para autorizar; cada query filtra por `user_id` del usuario autenticado y verifica ownership server-side antes de operar

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

# Chat IA

## Flujo guiado

```text
/dashboard/chat
  0 conversaciones  ──►  Welcome (Chat IA sobre tus estudios)
  1+ conversaciones ──►  redirige a /dashboard/chat/[id] (la más reciente)

Nueva conversación ──► pick-study ──► suggest ──► chat
```

- **`pick-study`** — selector de estudios con tarjetas grandes (estado vacío enlaza a "Subir un estudio").
- **`suggest`** — banner "Estudio seleccionado" + preguntas sugeridas determinísticas según tipo de estudio.
- **`chat`** — mensajes con contexto (chips), sugerencias compactas e input.

## Persistencia y routing

- Las conversaciones, mensajes y contextos se persisten en Supabase.
- La conversación activa se determina por la ruta `/dashboard/chat/[id]`, que carga conversación, mensajes, contexto e historial desde la base de datos.
- Al refrescar (F5) se mantiene la conversación abierta; no depende de estado local.
- `/dashboard/chat` consulta la base de datos: si hay conversaciones, abre la más reciente.

## Scroll de mensajes

- El área de mensajes es el único contenedor con scroll vertical (`min-h-0 flex-1 overflow-y-auto`).
- Header y composer (input + enviar) permanecen fijos.
- Funciona en desktop, tablet y mobile con respuestas cortas y largas.

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

# Tests (186 tests, node:test)
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
