-- ============================================================
-- F4.2.3: Persistencia del análisis de IA
-- ============================================================

-- Tabla de análisis (relación 1:1 con studies).
-- UNIQUE(study_id) garantiza que un estudio tenga como máximo un análisis.
-- El objeto StudyAnalysis se almacena completo como JSONB.
create table if not exists public.study_analyses (
  id uuid primary key default gen_random_uuid(),
  study_id uuid not null references public.studies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  analysis jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (study_id)
);

-- Índice para consultas por usuario
create index if not exists idx_study_analyses_user_id
  on public.study_analyses(user_id);

-- RLS habilitado
alter table public.study_analyses enable row level security;

-- Política: insertar propias (verifica que el estudio pertenezca al usuario)
create policy "Users can insert own study analyses"
  on public.study_analyses for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.studies
      where studies.id = study_analyses.study_id
        and studies.user_id = auth.uid()
    )
  );

-- Política: seleccionar propias
create policy "Users can select own study analyses"
  on public.study_analyses for select
  to authenticated
  using (auth.uid() = user_id);

-- Política: actualizar propias
create policy "Users can update own study analyses"
  on public.study_analyses for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Política: eliminar propias
create policy "Users can delete own study analyses"
  on public.study_analyses for delete
  to authenticated
  using (auth.uid() = user_id);

-- Trigger para updated_at (reutiliza la función definida en F3)
create trigger update_study_analyses_updated_at
  before update on public.study_analyses
  for each row
  execute function update_updated_at_column();
