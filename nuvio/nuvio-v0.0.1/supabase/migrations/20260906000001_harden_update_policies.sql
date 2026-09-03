-- ============================================================
-- F2 — Harden UPDATE policies de study_extractions y study_analyses
-- ------------------------------------------------------------
-- Las policies UPDATE previas solo verificaban auth.uid() = user_id,
-- por lo que un usuario podía reasignar study_id de una fila propia
-- apuntándolo al estudio de OTRO usuario (o actualizar filas cuyo
-- estudio no le pertenece).
--
-- Se reemplazan por policies que verifican el ownership de la fila
-- Y el ownership del estudio referenciado, tanto en USING (filas
-- seleccionadas para update) como en WITH CHECK (filas resultantes).
-- ============================================================

-- ── study_extractions ─────────────────────────────────────────

drop policy if exists "Users can update own study extractions"
  on public.study_extractions;

create policy "Users can update own study extractions"
  on public.study_extractions for update
  to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.studies
      where studies.id = study_extractions.study_id
        and studies.user_id = auth.uid()
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.studies
      where studies.id = study_extractions.study_id
        and studies.user_id = auth.uid()
    )
  );

-- ── study_analyses ────────────────────────────────────────────

drop policy if exists "Users can update own study analyses"
  on public.study_analyses;

create policy "Users can update own study analyses"
  on public.study_analyses for update
  to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.studies
      where studies.id = study_analyses.study_id
        and studies.user_id = auth.uid()
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.studies
      where studies.id = study_analyses.study_id
        and studies.user_id = auth.uid()
    )
  );
