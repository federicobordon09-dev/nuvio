-- ============================================================
-- Hacer study_type nullable para clasificación automática
-- ============================================================
-- Antes: study_type NOT NULL con valor manual del usuario.
-- Ahora: study_type NULLABLE. El valor se resuelve automáticamente
-- mediante Gemini durante el análisis. NULL = sin analizar.

alter table public.studies
  alter column study_type drop not null;
