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
* **Frontend:** React 19, TypeScript, Tailwind CSS v4
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

### Fase 4.5 — Procesamiento automático post-upload completo
- **Procesamiento automático del documento:** tras subir un estudio, `StudyPipelineController` inicia automáticamente la extracción PDF (MuPDF) y posterior análisis IA sin intervención del usuario
- **Flujo completo automatizado:** `uploaded` → `processing` (extracción) → `processed` → `analysis_status: processing` (Gemini) → `completed`
- **Idempotencia y concurrencia:**
  - `processStudy` retorna early si ya existe extracción y `status === "processed"`
  - `analyzeStudyWithDeps` usa claim atómico (`.neq("analysis_status", "processing")`) para evitar llamadas duplicadas a Gemini
  - `StudyPipelineController` usa `useRef` guard para evitar doble ejecución en React Strict Mode / re-renders
- **Retry manual preservado:** el botón "Procesar documento" (`StudyProcessButton`) y "Analizar con IA" (`AnalyzeStudyButton`) permanecen disponibles como mecanismo de recovery ante errores
- **Estados cubiertos por el pipeline automático:**
  - `uploaded` → inicia procesamiento
  - `processing` (doc) → continúa/esperar
  - `ocr_required` → procesamiento (fallará con error amigable)
  - `error` → reintenta procesamiento
  - `processed + analysis_status pending/processing` → analiza automáticamente
  - `completed + hasAnalysis` → no procesa (renderiza resultado)

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

### Fase 12 — Hardening de seguridad RLS
- Migración `20260906000000`: INSERT de `study_extractions` valida ownership del estudio referenciado
- Migración `20260906000001`: UPDATE de `study_extractions` y `study_analyses` valida ownership de fila + estudio (USING + WITH CHECK)
- Tests estáticos de policies SQL (`policy-hardening.test.ts`)

### Fase 13 — Explicación médica centrada en personas
- Campo `significance` opcional en `MeasurementSchema` (backwards compatible)
- Prompt Gemini instruye lenguaje humano, significado primero, sin diagnósticos
- `measurement-significance.ts`: fallbacks por status para significado legible
- `MeasurementsSection`: significado primero, datos secundarios
- `FindingRow`: explicación prominente, título como label
- `AnalysisResult`: títulos humanizados ("Qué encontramos", "Qué necesita atención", "Qué podés hacer", "Qué no pudimos determinar")
- `MeasurementDiffList`: diffs legibles primero ("Aumentó/Disminuyó/Se mantuvo similar")
- `ChatView`: auto-send desde CTA contextual con `requestAnimationFrame`

### Fase 14 — Validación de comprensión y refinamiento
- Auditoría completa de análisis, comparación, chat CTAs, warnings, limitations, disclaimer
- Sin problemas detectados — todo cumple jerarquía: significado → estado → dato → detalle técnico

### Fase 15 — Auditoría de seguridad
- Auditoría completa: Auth/RLS/Storage/Server Actions/Gemini/Frontend/Privacidad
- Sin vulnerabilidades CRÍTICAS ni ALTO
- Doble capa de protección: RLS + ownership checks en Server Actions
- API key solo server-side, bucket privado, zero XSS vectors

### Fase 16 — Release final
- Validación final: 680 tests, TypeScript, lint, build — todo PASS
- Commit y push a `main`

### Fase 8.4 — CTA contextual hacia Chat IA desde la pantalla de resultados
- **Objetivo:** permitir explorar un estudio desde el resultado sin re-seleccionarlo a mano en el Chat.
- **CTA principal del resultado:** "Preguntar sobre este estudio" (primario, visible tras el header) → crea una conversación con el `study_id` como contexto y redirige a `/dashboard/chat/[id]`.
- **CTA por hallazgo:** "Preguntar sobre este hallazgo" (compacto, en `FindingRow`) → mismo estudio como contexto + sugerencia inicial "Quiero entender mejor este hallazgo: <título>.".
- **CTA por medición:** "Preguntar sobre este valor" (compacto, en `MeasurementsSection`) → mismo estudio como contexto + sugerencia "Quiero entender mejor este valor: <nombre> = <valor> <unidad>.".
- Helper puro `buildStudyChatPrompt(focus)` que solo refleja datos existentes (sin interpretación médica, sin diagnóstico, sin normalidad/gravedad); no usa ni modifica `status`/`reference_range`.
- **Persistencia reutilizada:** `createConversationWithContextAction` verifica ownership + `study.stage === "ready"` server-side (`assertStudyReadyCore`); acepta `prompt` opcional y lo propaga como `?prompt=` a la URL de la conversación.
- **Chat:** `chat/[id]/page.tsx` lee `?prompt=` y lo pasa a `ChatView.initialPrompt`; se muestra como primera sugerencia en la fase guiada (`suggest`) sin reemplazar `useSuggestedQuestions` / `SuggestedQuestions`.
- No se crean tablas nuevas ni segundas estrategias de contexto; conversaciones multi-estudio, `?new=1`, `/dashboard/chat` y cleanup post-borrado permanecen intactos.

### Fase 9 — Comparación determinista de estudios

#### Fase 9.1 — Auditoría de comparación
- Revisión de la arquitectura existente (tipos de estudio, análisis persistido, contratos Zod) para definir cómo integrar una comparación de dos estudios sin usar IA.

#### Fase 9.2 — Motor determinista de comparación
- Nuevo módulo `src/lib/comparison/` (`types.ts`, `compare-studies.ts`, `url.ts`).
- `compareStudies()` devuelve `ComparisonResult`, una unión discriminada:
  - `{ comparable: false, incompatibility }` con kinds: `not_completed`, `missing_study_type`, `different_study_type`, `empty_analysis`.
  - `{ comparable: true, measurementDiffs, keyFindingDiffs, overall }` con mediciones comparables/nuevas/ausentes, hallazgos comparables/nuevos/ausentes, y resumen numérico (subidas, bajadas, estables, no comparables).
- Tests unitarios extensos en `src/lib/comparison/__tests__/compare-studies.test.ts`.

#### Fase 9.3 — Página `/dashboard/comparar`
- Página server-side que lee `?ids=ID_A,ID_B`, valida el parámetro con `parseCompareIds` (exactamente dos IDs, no duplicados, sin vacíos).
- Verifica autenticación y ownership de ambos estudios server-side, ejecuta el motor y muestra el resultado de comparación o la incompatibilidad.
- Helper de URL: `src/lib/comparison/url.ts`.

#### Fase 9.4 — UI de resultados de comparación
- Componentes de presentación en `src/components/comparison/`: `ComparisonContext`, `ComparisonSummary`, `MeasurementDiffList`, `KeyFindingsList`, `ComparisonDisclaimer`.
- `page.tsx` reescrito para componerlos; lógica de formato pura en `src/lib/comparison/presentation.ts` (con tests).
- Recap: mediciones con Anterior/Posterior, cambio, delta y porcentaje, rango de referencia, estado; hallazgos nuevos/ausentes/cambiados; disclaimer médico.

#### Fase 9.5 — Selección de estudios desde `/dashboard/estudios`
- `src/lib/comparison/selection.ts`: lógica pura de selección (add/remove/toggle/clear, `canCompare`, `getCompareUrl`, labels accesibles) con tests (`selection.test.ts`).
- `src/components/dashboard/StudySelection.tsx`: Client Component que envuelve cada `StudyCard` con un checkbox (reutilizando el componente existente), limita la selección a 2 y muestra barra de acción (sticky top en desktop, fija abajo en mobile).
- Orden de selección determinista: el primero seleccionado = **Anterior (A)**, el segundo = **Posterior (B)**; badges "Anterior"/"Posterior" en las tarjetas y número de orden en el checkbox.

#### Restricciones de la comparación actual

La comparación funciona de forma determinista y tiene estas restricciones:

- compara exactamente dos estudios
- requiere estudios procesados/analizados (`analysis_status = completed`)
- requiere que ambos estudios compartan el mismo `study_type`
- matching exacto por nombre de medición (`Map` claveado por nombre)
- matching exacto por título de hallazgo (`Map` claveado por título)
- no realiza fuzzy matching
- no realiza conversión de unidades
- no utiliza IA para comparar
- no realiza interpretación clínica
- no genera predicciones
- no genera alertas clínicas
- no utiliza gráficos
- no compara más de dos estudios

### Fase 10 — Evolución longitudinal de estudios

#### Fase 10.1 — Auditoría de evolución
- Revisión de la arquitectura y contratos (tipos de estudio, análisis persistido, Zod, historial, comparación) para definir cómo integrar la evolución de múltiples estudios del mismo tipo sin usar IA.

#### Fase 10.2 — Historial inteligente
- `src/lib/studies/history.ts`: agrupación de estudios por `study_type` en familias cronológicas (`groupStudiesByType`), `isEvolutionReady` (estudio con stage `ready`), `buildEvolutionUrl` y conteo de estudios listos por familia.
- Los estudios sin tipo se agrupan como "Pendiente de análisis" y no ofrecen "Ver evolución".

#### Fase 10.3 — Selección de serie longitudinal
- `src/lib/evolution/selection.ts`: lógica pura de selección de una serie (2–10 estudios del mismo tipo), validación server-side (`validateEvolutionSeries`), `getEvolutionUrl` y labels accesibles.
- Badges A–J siguen el orden de click; la serie final (URL) se ordena por `created_at ASC` (semántica temporal de la evolución).

#### Fase 10.4 — Motor determinista de evolución longitudinal
- `src/lib/evolution/build-series.ts`: `buildEvolutionSeries()` transforma una serie cronológica validada en `ParameterTrack[]` con puntos por parámetro y cambios consecutivos (`both_numeric`, `both_non_numeric`, `one_numeric`, `not_comparable`).
- Determinista, sin IA, sin conversión de unidades, sin interpretación clínica; resumen general (`EvolutionOverall`) con parámetros persistentes/transitorios y conteo de cambios.

#### Fase 10.5 — Página `/dashboard/evolucion`
- Página server-side que lee `?ids=...` (2–10 estudios), valida la forma (`parseEvolutionIds`), verifica ownership por estudio (`getStudy` filtra por `user_id`), valida la serie, ordena cronológico y ejecuta el motor.
- UI: `EvolutionSeriesContext`, `EvolutionOverview`, `EvolutionParameterTable` (tabla longitudinal con píldoras de cambio) y `EvolutionDisclaimer`.
- Flujo de errores accesible y genérico, sin exponer IDs ajenos ni detalles internos del motor.

#### Fase 10.6 — Primera visualización longitudinal (sparkline)
- `src/lib/evolution/sparkline.ts`: lógica pura de sparkline (≥3 puntos numéricos, segmentos por tramos conectables sin huecos ni unidades incompatibles, sin interpolación, sin división por cero, dirección objetiva ↑/↓/·).
- `src/components/evolution/ParameterSparkline.tsx`: SVG inline violeta, responsive (`viewBox` + `width 100%`), accesible (`role="img"`, `aria-label`, `<title>`, símbolo + texto, no solo color).
- Columna "Tendencia" en la tabla; la tabla sigue siendo la fuente primaria.

#### Fase 10.7 — Edge cases + QA final de evolución
- Corrección de edge cases: bug de `computeOverall` (parámetros persistentes derivados de `tracks[0]` en vez del conteo real de estudios); tiebreaker determinista por `id` para timestamps idénticos (`orderEvolutionStudiesAsc` + orden intra-grupo de `groupStudiesByType`); `<dl>` válido (`dt` antes que `dd`) en `EvolutionOverview`; empty-state para series sin parámetros comparables.
- Los tests del motor (`build-series.test.ts`), de selección (`selection.test.ts`) e historial (`history.test.ts`) pasan a correr dentro de `pnpm test`.
- La etapa funcional de evolución queda **cerrada**.

#### Restricciones de la evolución actual

La evolución funciona de forma determinista y tiene estas restricciones:

- permite series de 2 a 10 estudios del mismo tipo
- requiere estudios procesados/analizados (`analysis_status = completed`) y con tipo definido
- matching exacto por nombre de medición (`Map` claveado por nombre)
- no realiza fuzzy matching
- no realiza conversión de unidades
- no utiliza IA para evolucionar
- no realiza interpretación clínica
- no genera predicciones
- no genera alertas clínicas
- no reemplaza al médico

### Fase 11 — Rediseño UI/UX global (Design System Nuvio)

Rediseño visual completo de toda la aplicación, migrando de la paleta legacy Ocean/Ivory/Cream a la identidad oficial de Nuvio (#251836, #F3E0FE, #FAF8FC). Se mantiene la lógica de negocio intacta — solo cambia cómo se ve, no qué hace.

#### Fase 11.1 — Foundation (Design System)
- **`globals.css`**: paleta de tokens de marca: primary (#251836), muted (#756B7D), background (#FAF8FC), surface (#FFFFFF), foreground (#17131A), border (#E6DFE9), success (#3F8F68), warning (#C58A32), error (#C65353), violet evolution (#6D4BC4). Shadow tokens tinted to primary (sm/md/lg/xl). Tipografía Inter + IBM Plex Mono (mono solo para datos clínicos).
- **Iconos centralizados** (`src/components/ui/icons/index.tsx`): 30 iconos SVG custom con `strokeWidth={1.5}`, `className="h-5 w-5"`, `aria-hidden="true"`.
- **Primitivos UI** (`src/components/ui/`): Button (primary/secondary/ghost/danger, sm/md/lg con active:scale-[0.98]), Card (default/interactive/none, sm/md/lg), Badge (success/warning/error/info/neutral/muted, sm/md), Input (label+error pattern), Textarea (label+error pattern), Spinner.
- **Typography utilities** en CSS: `.text-display`, `.text-heading`, `.text-subheading`, `.text-body`, `.text-caption` con sizing/spacing/weight variables.
- **Surface utilities**: `.surface-canvas`, `.surface-base`, `.surface-raised`, `.surface-overlay`.
- **Status indicators**: `.status-dot-*` con colores semánticos, `.status-dot-processing` con pulse animation.
- **Animation system**: `fade-in`, `fade-in-up`, `fade-in-down`, `slide-in-right`, `slide-in-left`, `scale-in`, `pulse-subtle`, `float` con stagger delays (`.delay-0` a `.delay-600`). Respeto a `prefers-reduced-motion`.
- **Scrollbar styling** fino y consistente.
- **Navbar** (`src/components/Navbar.tsx`): `bg-surface/80 backdrop-blur-xl`, logo Nuvio, CTA con Button.
- **DashboardNav** (`src/components/dashboard/DashboardNav.tsx`): dividers, secciones, active state `bg-primary-muted shadow-sm`.
- **MobileNav** (`src/components/dashboard/MobileNav.tsx`): drawer con `backdrop-blur`, active `bg-primary-muted/40`.

#### Fase 11.2 — Dashboard y páginas core
- **`dashboard/page.tsx`**: editorial layout — greeting header con `text-heading`, stats grid, acciones como list items (no cards), estudios recientes en lista con `animate-fade-in-up`.
- **`dashboard/layout.tsx`**: sidebar con dividers, secciones, user section, `text-body`/`text-caption` tokens, `h-16` mobile header.
- **`dashboard/estudios/`**: StudyCard con `animate-fade-in-up`, hover `border-primary/20 bg-primary-muted/30`, group hover effects.
- **`dashboard/estudios/[id]/page.tsx`**: editorial metadata sidebar con `data-label` tokens, danger/info/warning states como tinted containers.

#### Fase 11.3 — Study Detail y Results
- **StudyResultHeader**: removed card wrapper, uses `.data-label` class, editorial spacing.
- **FindingsSection**: `.data-label` class for headings.
- **AnalysisSection**: `.data-label` class, `text-body` items, `animate-fade-in-up`.
- **FindingRow**: badges de status, botón "Ver más" expandible, CTA contextual al chat.
- **MeasurementsSection**: valores en `font-mono`, badges de status.
- **MedicalDisclaimer**: `bg-primary-muted/50` tinted container.
- **StudyExtraction**: `<pre>` colapsable con `font-mono text-caption`.
- **StudyPipelineController**: editorial error/processing states con tinted borders.

#### Fase 11.4 — Chat IA
- **ChatPageLayout**: `grid lg:grid-cols-[280px_1fr]`, sidebar `bg-muted/20`, mobile drawer con `backdrop-blur`.
- **ChatView**: editorial styling, `animate-fade-in` on welcome, `text-body`/`text-caption` tokens.
- **ConversationList**: "Nueva conversación" con `active:scale-[0.98]`, active state `bg-primary-muted shadow-sm`, delete con `active:scale-[0.95]`.
- **ChatWelcome**: `bg-primary-muted` icono, `animate-fade-in`, `text-heading` title.
- **ConversationList**: `animate-fade-in-up` on items.

#### Fase 11.5 — Comparación y Evolución
- **ComparisonContext**: editorial labels, `.data-label` class.
- **ComparisonSummary**: collapsible secondary tiles, `.data-label`, `animate-fade-in-up`.
- **MeasurementDiffList**: editorial diff cards con `.data-label`, `font-mono` values, `text-body`/`text-caption`.
- **`comparar/page.tsx`**: editorial states with tinted containers.
- **EvolutionOverview**: collapsible secondary tiles, `.data-label`, `animate-fade-in-up`.
- **EvolutionParameterTable**: `font-mono` values, `.data-label` headers, `text-body`/`text-caption`.
- **EvolutionDisclaimer**: editorial styling consistent with MedicalDisclaimer.
- **EvolutionSeriesContext**: editorial cards with `.data-label`.
- **`evolucion/page.tsx`**: editorial layout with tinted containers.

#### Fase 11.6 — Landing y Login
- **Hero**: dot pattern más sutil (32px, 3 colores), `data-label` subtitle, `text-display` title, `mt-10` CTAs.
- **HowItWorks**: `bg-muted/20`, `data-label` subtitle, `text-heading` title, steps con `rounded-xl`.
- **Security**: `data-label` subtitle, `text-heading` title, features con `rounded-xl`.
- **Disclaimer**: `bg-primary-muted/30`, `border-primary/20`, `text-body` content.
- **Navbar**: `text-caption` nav items, consistent with dashboard.
- **Footer**: `text-caption` content, `text-[11px]` copyright.
- **Login**: `text-heading` title, `text-body` subtitle, error `border-danger/20 bg-danger-tint/50`.

#### Assets oficiales

| Asset | Uso |
|-------|-----|
| `public/nuvio_logo_nuevo.png` | Logo principal (navbar, dashboard layout, login) |
| `public/nuvio_logo_circular_con_la_N.png` | Isotipo / favicon |

#### Design System — Tokens oficiales

| Token | Valor | Uso |
|-------|-------|-----|
| `--color-primary` | `#251836` | Brand principal |
| `--color-primary-muted` | `#F3E0FE` | Fondos suaves, badges, active states |
| `--color-background` | `#FAF8FC` | Fondo de página |
| `--color-surface` | `#FFFFFF` | Cards, paneles, superficies |
| `--color-foreground` | `#17131A` | Texto principal |
| `--color-muted-foreground` | `#756B7D` | Texto secundario, labels |
| `--color-border` | `#E6DFE9` | Bordes generales |
| `--color-success` | `#3F8F68` | Estados exitosos |
| `--color-warning` | `#C58A32` | Advertencias |
| `--color-danger` | `#C65353` | Errores |
| `--color-violet` | `#6D4BC4` | Evolution accent (exclusivo) |
| `--shadow-sm` | `0 1px 2px rgba(37,24,54,0.04)` | Sombras sutiles (tinted primary) |
| `--shadow-md` | `0 2px 8px rgba(37,24,54,0.06)` | Sombras medias |
| `--shadow-lg` | `0 4px 16px rgba(37,24,54,0.08)` | Sombras elevadas |
| `--shadow-xl` | `0 8px 32px rgba(37,24,54,0.12)` | Sombras máximas |

---

# Estado actual / Próxima sesión

## Estado actual

Nuvio se encuentra con:

- **autenticación funcional** (Google OAuth con PKCE)
- **dashboard funcional** (conteos reales por estado, estudios recientes, navegación)
- **upload de estudios funcional** (PDFs privados en Supabase Storage)
- **extracción PDF funcional** (MuPDF WASM, estado por documento)
- **análisis mediante IA funcional** (Gemini → Zod → `study_analyses`)
- **almacenamiento de análisis funcional** (JSONB, RLS, upsert idempotente)
- **procesamiento automático post-upload funcional** (subir → procesar → analizar → resultado)
- **chat contextual funcional** (conversaciones persistidas, contexto por estudio)
- **comparación determinista de dos estudios funcional** (`/dashboard/comparar`)
- **selección de estudios desde `/dashboard/estudios` funcional** (Fase 9.5)
- **historial inteligente de estudios por tipo funcional** (Fase 10.2)
- **selección de serie longitudinal funcional** (Fase 10.3)
- **motor determinista de evolución funcional** (Fase 10.4)
- **página de evolución funcional** (`/dashboard/evolucion`, Fase 10.5)
- **sparklines de tendencia funcionales** (Fase 10.6, SVG inline)
- **QA final de evolución cerrado** (Fase 10.7)
- **rediseño editorial completo** (Fases 11.1–11.6) — paleta Nuvio, tipografía editorial, animation system, surface/status tokens
- **Design System Nuvio consistente** (tokens de marca, sombras tinted, status indicators)
- **responsive/mobile navigation funcional**
- **tests, lint, TypeScript y build validados** (ver § Validaciones más abajo)

## Validaciones

| Validación | Resultado |
|---|---|
| Tests (`pnpm test`) | **680/680 PASS** |
| TypeScript (`pnpm exec tsc --noEmit`) | **PASS** |
| ESLint (`pnpm lint`) | **PASS** — 0 errores; 3 warnings pre-existentes en tests ajenos |
| Build (`pnpm build`) | **PASS** — todas las rutas compiladas |

> Nota: los tests de evolución (`build-series.test.ts`, `selection.test.ts`, `history.test.ts`, `sparkline.test.ts`, `parse-ids.test.ts`, `presentation.test.ts`) corren todos vía `pnpm test`. La suite completa desde la raíz del proyecto = 680 tests.

## Commits de rediseño

| Commit | Mensaje |
|---|---|
| `feat(ui)` | `establish Nuvio design system foundation` |
| `feat(ui)` | `redesign dashboard and core pages` |
| `fix(ui)` | `update Nuvio favicon asset` |
| `fix` | `add Nuvio logo assets and remove old logo` |
| `feat(ui)` | `redesign study detail and results` |
| `feat(ui)` | `redesign chat` |
| `feat(ui)` | `redesign comparison and evolution` |
| `feat(ui)` | `redesign landing and login` |
| `refactor(ui)` | `finalize Nuvio design system cleanup` |

## Commits de comparación

| Commit | Mensaje |
|---|---|
| `ee928a2` | `feat(comparison): add deterministic study comparison engine` |
| `5d08ac5` | `feat(comparison): add study comparison page` |
| `051b476` | `feat(comparison): improve comparison result UI` |
| `7fcf71e` | `feat(comparison): integrate study selection` |

## Commits de evolución

| Commit | Mensaje |
|---|---|
| `9cbd121` | `feat(10.2+10.3): historial inteligente + selección de serie longitudinal` |
| `d4ee6fa` | `feat(10.4): motor determinista de evolución longitudinal` |
| `fabf049` | `feat(evolution): Fase 10.5 — /dashboard/evolucion page` |
| (esta PR) | `feat(evolution): Fase 10.6+10.7 — sparklines y QA final de evolución` |

## Pendientes conocidos

1. **Mejorar la legibilidad y jerarquía visual de la pantalla de comparación.** Ver `Pendiente de UX — lectura de la comparación` más abajo.
2. **Fase 9.6 — PENDIENTE / NO INICIADA.** Continuar después de mejorar la UX de comparación.

## Pendiente de UX — lectura de la comparación

Confirmado manualmente (2026-09-06):

- La comparación **funciona**. Se probaron estudios reales con distintos tipos y el sistema detectó correctamente que **no eran comparables** cuando sus `study_type` eran diferentes (`different_study_type`).
- Problema detectado: **"El resultado de comparación es difícil de leer."**
- Queda documentado como **trabajo pendiente de UX/UI** (jerarquía visual, legibilidad). No solucionado.

## Mejoras futuras (no implementadas)

1. **Indicadores visuales adicionales de estado** — estados activos/inactivos más visibles en conversaciones.
2. **Refinamiento de la pantalla de comparación** — ver `Pendiente de UX — lectura de la comparación` (el comparador base ya está implementado en Fases 9.2–9.5).

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
│   │   ├── comparar/page.tsx       # Comparación de dos estudios
│   │   ├── evolucion/page.tsx      # Evolución longitudinal (2–10 estudios)
│   │   └── perfil/page.tsx         # Perfil del usuario
│   ├── (landing)/page.tsx          # Landing page pública
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
│   ├── comparison/
│   │   ├── types.ts                # Tipos de comparación (ComparisonResult, diffs)
│   │   ├── compare-studies.ts      # Motor determinista de comparación
│   │   ├── url.ts                  # Parseo/validación del parámetro ids
│   │   ├── presentation.ts         # Formato puro para la UI de resultados
│   │   ├── selection.ts            # Lógica pura de selección de estudios
│   │   └── __tests__/              # Tests del motor y la selección
│   ├── evolution/
│   │   ├── types.ts                # Tipos de evolución (ParameterTrack, PointValue…)
│   │   ├── build-series.ts         # Motor determinista de evolución (Fase 10.4)
│   │   ├── parse-ids.ts            # Parseo/validación del parámetro ids (2–10)
│   │   ├── presentation.ts         # Formato puro para la UI de resultados
│   │   ├── selection.ts            # Lógica pura de selección de serie (Fase 10.3)
│   │   ├── sparkline.ts            # Lógica pura del sparkline (Fase 10.6)
│   │   └── __tests__/              # Tests del motor, selección, sparkline y formatos
│   ├── studies-utils.ts            # Tipos, labels, constantes
│   └── auth/
│       └── callbacks.ts            # Helpers de auth
├── components/
│   ├── ui/                         # Componentes base (Button, Card, Badge, Input, Spinner, Icons)
│   ├── auth/                       # Componentes de autenticación
│   ├── dashboard/                  # Componentes del dashboard (nav, cards, selección)
│   ├── comparison/                 # Componentes de la UI de comparación
│   ├── evolution/                  # Componentes de la UI de evolución (Fase 10)
│   ├── studies/                    # Componentes de estudios (AnalysisResult, etc.)
│   ├── chat/                       # Componentes del Chat IA
│   │   ├── ChatPageLayout.tsx      # Marco de dos paneles (sidebar + conversación)
│   │   ├── ChatView.tsx            # Máquina de estados pick-study / suggest / chat
│   │   ├── ChatWelcome.tsx         # Pantalla inicial (server component)
│   │   ├── ConversationList.tsx    # Historial de conversaciones
│   │   ├── NewConversationStudyPicker.tsx
│   │   ├── SelectedStudyBanner.tsx
│   │   ├── SuggestedQuestions.tsx
│   │   └── ContextPicker.tsx       # Contexto de estudios (chips)
│   └── landing/                    # Componentes de la landing (Hero, HowItWorks, etc.)
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

# Tests (680 tests, node:test)
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

# Filosofía del proyecto

Nuvio debe ser una aplicación que reduzca la complejidad, no que la traslade al usuario.

Cada decisión de producto y desarrollo debe responder a una pregunta:

> **¿Esto hace que Nuvio sea más claro, seguro y útil para una persona que intenta entender su información médica?**

Si una funcionalidad agrega complejidad sin aportar valor significativo, reconsiderarla.

---

**Nuvio — Información médica compleja. Explicada de forma clara.**
