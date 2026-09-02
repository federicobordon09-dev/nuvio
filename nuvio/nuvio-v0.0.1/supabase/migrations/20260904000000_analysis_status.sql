-- ============================================================
-- F4.3: Automatización del análisis de IA
-- ============================================================

-- Estado del análisis de IA para cada estudio.
-- Permite distinguuir: pendiente / en curso / completado / fallido.
-- Sin esto, un reload después de un fallo se ve idéntico a
-- "nunca iniciado", provocando reintentos en bucle y doble uso de Gemini.

alter table public.studies
  add column if not exists analysis_status text not null default 'pending';

alter table public.studies
  add constraint studies_analysis_status_check
    check (analysis_status in ('pending','processing','completed','failed'));

alter table public.studies
  add column if not exists analysis_error text;

comment on column public.studies.analysis_status is
  'Estado del análisis de IA: pending, processing, completed, failed.';
comment on column public.studies.analysis_error is
  'Código del último error de análisis (p.ej. gemini_timeout). Null si no hubo error.';
