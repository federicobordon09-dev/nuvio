-- ============================================================
-- F4.1: Pipeline de procesamiento y extracción de estudios médicos
-- ============================================================

-- Columna para el código de error controlado del último procesamiento.
-- Solo almacena un código estable (p.ej. 'ocr_required'); nunca texto
-- técnico ni contenido del documento.
alter table public.studies
  add column if not exists processing_error text;

-- Tabla de extracciones (relación 1:1 con studies).
-- UNIQUE(study_id) garantiza idempotencia: no puede haber más de una
-- extracción por estudio, y el upsert permite re-procesado seguro.
create table if not exists public.study_extractions (
  id uuid primary key default gen_random_uuid(),
  study_id uuid not null references public.studies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  extracted_text text not null,
  page_count integer,
  method text not null default 'pdf_text',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (study_id)
);

-- Índices para consultas por usuario y por estudio
create index if not exists idx_study_extractions_user_id
  on public.study_extractions(user_id);

create index if not exists idx_study_extractions_study_id
  on public.study_extractions(study_id);

-- RLS habilitado
alter table public.study_extractions enable row level security;

-- Política: insertar propias
create policy "Users can insert own study extractions"
  on public.study_extractions for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Política: seleccionar propias
create policy "Users can select own study extractions"
  on public.study_extractions for select
  to authenticated
  using (auth.uid() = user_id);

-- Política: actualizar propias
create policy "Users can update own study extractions"
  on public.study_extractions for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Política: eliminar propias
create policy "Users can delete own study extractions"
  on public.study_extractions for delete
  to authenticated
  using (auth.uid() = user_id);

-- Trigger para updated_at (reutiliza la función definida en F3)
create trigger update_study_extractions_updated_at
  before update on public.study_extractions
  for each row
  execute function update_updated_at_column();