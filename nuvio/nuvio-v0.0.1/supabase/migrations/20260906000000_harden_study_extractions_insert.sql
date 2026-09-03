-- ============================================================
-- F1 — Harden INSERT policy de study_extractions
-- ------------------------------------------------------------
-- La policy previa solo verificaba auth.uid() = user_id, por lo que
-- un usuario autenticado podía insertar una extracción asociada al
-- study_id de OTRO usuario (p.ej. cruzando datos entre usuarios).
--
-- Se reemplaza por una policy que además valida que el estudio
-- referenciado pertenezca al usuario autenticado.
-- ============================================================

drop policy if exists "Users can insert own study extractions"
  on public.study_extractions;

create policy "Users can insert own study extractions"
  on public.study_extractions for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.studies
      where studies.id = study_extractions.study_id
        and studies.user_id = auth.uid()
    )
  );
