-- ============================================================
-- F3: Subida y gestión de estudios médicos
-- ============================================================

-- Tabla de estudios
create table if not exists public.studies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_size bigint not null,
  mime_type text not null,
  study_type text not null,
  status text not null default 'uploaded',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índice para consultas por usuario
create index if not exists idx_studies_user_id on public.studies(user_id);

-- RLS habilitado
alter table public.studies enable row level security;

-- Política: insertar propios
create policy "Users can insert own studies"
  on public.studies for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Política: seleccionar propios
create policy "Users can select own studies"
  on public.studies for select
  to authenticated
  using (auth.uid() = user_id);

-- Política: actualizar propios
create policy "Users can update own studies"
  on public.studies for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Política: eliminar propios
create policy "Users can delete own studies"
  on public.studies for delete
  to authenticated
  using (auth.uid() = user_id);

-- Trigger para updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_studies_updated_at
  before update on public.studies
  for each row
  execute function update_updated_at_column();

-- ============================================================
-- Storage: bucket privado medical-studies
-- ============================================================

insert into storage.buckets (id, name, public)
values ('medical-studies', 'medical-studies', false)
on conflict (id) do nothing;

-- Política: subir solo a su propia carpeta
create policy "Users can upload to own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'medical-studies'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Política: listar solo archivos propios
create policy "Users can list own files"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'medical-studies'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Política: eliminar solo archivos propios
create policy "Users can delete own files"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'medical-studies'
    and (storage.foldername(name))[1] = auth.uid()::text
  );