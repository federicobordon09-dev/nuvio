"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StudyCard } from "./StudyCard";
import type { StudyForSelection } from "@/lib/comparison/selection";
import type { HistoryGroup } from "@/lib/studies/history";
import { isEvolutionReady } from "@/lib/studies/history";
import type { StudyType } from "@/lib/studies-utils";
import {
  EVOLUTION_MAX_STUDIES,
  initialEvolutionSeriesState,
  beginEvolutionSeries,
  toggleEvolutionStudy,
  clearEvolutionSeries,
  isEvolutionSeriesFull,
  getEvolutionBadgeLabel,
  canRunEvolution,
  getEvolutionUrl,
  getEvolutionCountLabel,
  getEvolutionCtaLabel,
} from "@/lib/evolution/selection";
import type { EvolutionSeriesState, EvolutionStudy } from "@/lib/evolution/selection";
import {
  initialSelectionState,
  addSelection,
  removeSelection,
  clearSelection,
  canCompare,
  getCompareUrl,
  getSelectionLabel,
  getCompareButtonLabel,
  isSelected,
  getSelectionIndex,
} from "@/lib/comparison/selection";

/** Props del componente de lista con selección. */
interface StudySelectionListProps {
  /**
   * Estudios agrupados por tipo (Fase 10.2 — Historial inteligente).
   * Cada grupo es una familia cronológica; la selección de comparación
   * funciona de forma transversal a los grupos.
   */
  groups: HistoryGroup[];
}

/**
 * Controlador de selección de hasta 2 estudios para comparar.
 * Envuelve el listado de tarjetas y muestra la barra de acción.
 *
 * Accesibilidad (Fase 9.6):
 * - El control de comparar es un <button disabled> real cuando no hay 2
 *   estudios: no enfocable ni operable por teclado. Solo se vuelve navegable
 *   (router.push) cuando la comparación está habilitada.
 * - El estado de selección es anunciado por lectores de pantalla (aria-live).
 */
export function StudySelectionList({ groups }: StudySelectionListProps) {
  const router = useRouter();
  const [selection, setSelection] = useState(initialSelectionState);
  /** Selección de serie longitudinal (Fase 10.3) — una familia activa a la vez. */
  const [series, setSeries] = useState<EvolutionSeriesState>(
    initialEvolutionSeriesState,
  );
  /** Notificación accesible no invasiva (aria-live polite) para límites/cambio de familia. */
  const [seriesNotification, setSeriesNotification] = useState<string>("");

  // Limpiar notificación tras 3s (no invasivo, solo accesible)
  useEffect(() => {
    if (seriesNotification) {
      const timer = setTimeout(() => setSeriesNotification(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [seriesNotification]);

  /** Vista plana de todos los estudios para resolver la selección activa. */
  const allStudies = groups.flatMap((group) => group.studies);

  const handleToggle = (id: string) => {
    const current = isSelected(selection, id);
    if (current) {
      setSelection(removeSelection(selection, id));
    } else {
      setSelection(addSelection(selection, id));
    }
  };

  const handleClear = () => {
    setSelection(clearSelection());
  };

  const isSelectable = selection.selectedIds.length < 2;
  const canCompareNow = canCompare(selection);
  const compareUrl = getCompareUrl(selection);
  const selectedStudies = selection.selectedIds
    .map((id) => allStudies.find((s) => s.id === id))
    .filter((s): s is StudyForSelection => Boolean(s));

  const handleCompare = () => {
    if (canCompareNow && compareUrl) {
      router.push(compareUrl);
    }
  };

  // ── Handlers de serie (Fase 10.3) ──────────────────────────

  /**
   * A qué familia pertenece el estudio (para iniciar/continuar serie).
   * Solo considera estudios aptos (ready y con study_type definido).
   */
  function getSeriesFamily(study: StudyForSelection): StudyType | null {
    if (study.study_type === null) return null;
    if (!isEvolutionReady(study.status, study.analysis_status)) return null;
    return study.study_type;
  }

  /** Convierte StudyForSelection → EvolutionStudy para la lógica pura. */
  function toEvolutionStudy(study: StudyForSelection): EvolutionStudy {
    return {
      id: study.id,
      study_type: study.study_type,
      status: study.status,
      analysis_status: study.analysis_status,
      created_at: study.created_at,
    };
  }

  const handleSeriesToggle = (study: StudyForSelection) => {
    const family = getSeriesFamily(study);
    if (family === null) return; // no apto para evolución

    setSeries((prev) => {
      // Si cambia la familia, se descarta la serie anterior y se inicia nueva
      const base =
        prev.studyType === family ? prev : beginEvolutionSeries(family);

      // Feedback: límite de 10 alcanzado
      if (prev.studyType === family && prev.selectedIds.length >= EVOLUTION_MAX_STUDIES && !prev.selectedIds.includes(study.id)) {
        setSeriesNotification(`Máximo de ${EVOLUTION_MAX_STUDIES} estudios alcanzado. Quita uno para añadir otro.`);
        return prev; // no agrega, mantiene la selección intacta
      }

      // Feedback: cambio de familia (explícito, no silencioso)
      if (prev.studyType !== family && prev.selectedIds.length > 0) {
        setSeriesNotification(`Familia cambiada: serie anterior descartada. Nueva serie iniciada con este estudio.`);
      }

      return toggleEvolutionStudy(base, toEvolutionStudy(study));
    });
  };

  const handleSeriesClear = () => {
    setSeries(clearEvolutionSeries());
  };

  const handleSeriesRun = () => {
    const url = getEvolutionUrl(series, allStudies);
    if (url) router.push(url);
  };

  /** Clases del botón principal de evolución (violet). */
  const seriesButtonClasses = (mobile: boolean) =>
    `inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors ${
      mobile ? "flex-1 px-4 py-3 text-[15px]" : "px-4 py-2.5 text-[14px]"
    } ${
      canRunEvolution(series, allStudies)
        ? "bg-violet text-white hover:bg-violet-dark"
        : "bg-muted text-muted-foreground cursor-not-allowed"
    }`;

  /** Clases compartidas del botón principal según el estado habilitado. */
  const compareButtonClasses = (mobile: boolean) =>
    `inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors ${
      mobile ? "flex-1 px-4 py-3 text-[15px]" : "px-4 py-2.5 text-[14px]"
    } ${
      canCompareNow
        ? "bg-ocean text-white hover:bg-ocean-dark"
        : "bg-muted text-muted-foreground cursor-not-allowed"
    }`;

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Notificación accesible no invasiva (límite 10, cambio familia) */}
      <div aria-live="polite" aria-atomic="true" className="sr-only" role="status">
        {seriesNotification}
      </div>
      {/* Header del modo selección (tablet y desktop: md+) */}
      <div className="hidden md:block sticky top-4 z-10 mb-4 rounded-xl border border-ocean/20 bg-ocean-tint/50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <svg
              className="h-5 w-5 text-ocean shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
              />
            </svg>
            <div className="min-w-0">
              <p
                className="text-[14px] font-medium text-foreground"
                aria-live="polite"
              >
                {getSelectionLabel(selection)}
              </p>
              {selectedStudies.length > 0 && (
                <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                  {selectedStudies.map((s) => s.file_name).join(" · ")}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              disabled={!canCompareNow}
              onClick={handleCompare}
              className={compareButtonClasses(false)}
            >
              {getCompareButtonLabel(selection)}
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-[14px] font-medium text-foreground transition-colors hover:bg-muted"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>

      {/* Listado agrupado por tipo de estudio (Fase 10.2+10.3 — Historial + serie) */}
      <div className="flex-1 space-y-6">
        {groups.map((group) => {
          const isActiveFamily = series.studyType === group.studyType;
          const familyStudies = group.studies.filter((s) =>
            isEvolutionReady(s.status, s.analysis_status) && s.study_type === group.studyType,
          );
          const familySelection = isActiveFamily
            ? { ...series, selectedIds: series.selectedIds }
            : initialEvolutionSeriesState;
          const canRunSeries = canRunEvolution(familySelection, familyStudies);
          const seriesUrl = canRunSeries
            ? getEvolutionUrl(familySelection, familyStudies)
            : null;

          return (
            <section key={group.studyType ?? "null"} className="space-y-4">
              {/* Cabecera del grupo */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-[16px] font-medium tracking-[-0.01em] text-foreground">
                    {group.label}
                  </h2>
                  <p className="mt-0.5 text-[13px] text-muted-foreground">
                    {group.studies.length} estudio{group.studies.length !== 1 ? "s" : ""}
                    {group.readyCount > 0 && (
                      <>
                        <span aria-hidden="true"> · </span>
                        {group.readyCount} listo{group.readyCount !== 1 ? "s" : ""} para evolución
                      </>
                    )}
                  </p>
                </div>
                {/* Controles de serie (Fase 10.3) — solo para familia apta */}
                {group.studyType !== null && group.readyCount >= 2 && (
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Contador de serie cuando está activa */}
                    {isActiveFamily && (
                      <span className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-violet/30 bg-violet-tint/50 px-3 py-1.5 text-[13px] font-medium text-violet">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3v18m-4.5-9h18" />
                        </svg>
                        {getEvolutionCountLabel(familySelection)}
                      </span>
                    )}
                    {/* Botón principal de serie */}
                    {isActiveFamily && seriesUrl ? (
                      <button
                        type="button"
                        onClick={handleSeriesRun}
                        className={seriesButtonClasses(false)}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                        </svg>
                        Ver evolución
                      </button>
                    ) : isActiveFamily ? (
                      <button
                        type="button"
                        disabled
                        className={seriesButtonClasses(false)}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                        </svg>
                        {getEvolutionCtaLabel(familySelection, familyStudies)}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSeries(beginEvolutionSeries(group.studyType!))}
                        className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-violet/30 bg-violet-tint/50 px-3 py-1.5 text-[13px] font-medium text-violet transition-colors hover:bg-violet-tint/80"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3v18m-4.5-9h18" />
                        </svg>
                        Seleccionar serie
                      </button>
                    )}
                    {/* Cancelar serie */}
                    {isActiveFamily && (
                      <button
                        type="button"
                        onClick={handleSeriesClear}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-1.5 text-[13px] font-medium text-foreground transition-colors hover:bg-muted"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                )}
              </div>

            {/* Estudios del grupo en orden cronológico */}
            <div className="space-y-4">
              {group.studies.map((study) => {
                const seriesBadgeLabel = isActiveFamily
                  ? getEvolutionBadgeLabel(familySelection, study.id)
                  : null;
                const seriesIsSelected = isActiveFamily && seriesBadgeLabel !== null;
                const canAddToSeries =
                  isActiveFamily &&
                  seriesBadgeLabel === null &&
                  isEvolutionReady(study.status, study.analysis_status) &&
                  study.study_type === group.studyType &&
                  !isEvolutionSeriesFull(familySelection);

                return (
                  <StudyCardWithCheckbox
                    key={study.id}
                    study={study}
                    selected={isSelected(selection, study.id)}
                    index={getSelectionIndex(selection, study.id)}
                    disabled={!isSelectable && !isSelected(selection, study.id)}
                    onToggle={() => handleToggle(study.id)}
                    // Serie
                    seriesSelected={seriesIsSelected}
                    seriesBadge={seriesBadgeLabel}
                    seriesDisabled={!canAddToSeries}
                    onSeriesToggle={() => handleSeriesToggle(study)}
                  />
                );
              })}
            </div>
          </section>
      );
    })}
      </div>

      {/* Barra de acción fija en mobile (<md) */}
      <div className="md:hidden sticky bottom-0 z-20 mt-4 border-t border-border bg-surface/95 backdrop-blur-sm p-4">
        <div className="flex flex-col gap-3">
          {/* Estado de serie longitudinal (si hay familia activa) */}
          {series.studyType !== null && (
            <div className="rounded-lg border border-violet/20 bg-violet-tint/40 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[12px] font-medium text-violet">
                  Serie de evolución
                </p>
                <span className="shrink-0 rounded-full bg-violet-tint px-2 py-0.5 text-[11px] font-medium text-violet tabular-nums">
                  {getEvolutionCountLabel(series)}
                </span>
              </div>
              <div className="mt-2 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  disabled={!canRunEvolution(series, allStudies)}
                  onClick={handleSeriesRun}
                  className={seriesButtonClasses(true)}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                  </svg>
                  {getEvolutionCtaLabel(series, allStudies)}
                </button>
                <button
                  type="button"
                  onClick={handleSeriesClear}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 text-[15px] font-medium text-violet transition-colors hover:bg-violet-tint"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p
                className="text-[13px] font-medium text-foreground"
                aria-live="polite"
              >
                Selección de estudios
              </p>
              <p className="truncate text-[12px] text-muted-foreground">
                {selectedStudies.length > 0
                  ? selectedStudies.map((s) => s.file_name).join(" · ")
                  : "Sin selección todavía"}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground tabular-nums">
              {selection.selectedIds.length}/2
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              disabled={!canCompareNow}
              onClick={handleCompare}
              className={compareButtonClasses(true)}
            >
              {getCompareButtonLabel(selection)}
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 text-[15px] font-medium text-foreground transition-colors hover:bg-muted"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Tarjeta de estudio con checkbox de comparación + badge de serie longitudinal.
 * - Derecha: checkbox azul para comparación A↔B (Fase 9.5).
 * - Izquierda: badge violeta A–J para serie de evolución (Fase 10.3).
 * Ambos coexisten sin interferir con el Link del StudyCard.
 */
function StudyCardWithCheckbox({
  study,
  selected,
  index,
  disabled,
  onToggle,
  // Serie longitudinal (Fase 10.3)
  seriesSelected = false,
  seriesBadge = null,
  seriesDisabled = false,
  onSeriesToggle = () => {},
}: {
  study: StudyForSelection;
  selected: boolean;
  index: 0 | 1 | -1;
  disabled: boolean;
  onToggle: () => void;
  seriesSelected?: boolean;
  seriesBadge?: string | null;
  seriesDisabled?: boolean;
  onSeriesToggle?: () => void;
}) {
  const badgeLabel = index === 0 ? "Anterior" : index === 1 ? "Posterior" : "";

  return (
    <div className={`relative rounded-xl transition-all ${
      selected
        ? "ring-2 ring-ocean/20 bg-ocean-tint/30"
        : seriesSelected
          ? "ring-2 ring-violet/20 bg-violet-tint/30"
          : ""
    }`}>
      {/* Checkbox de COMPARACIÓN — superpuesto DERECHA (azul) */}
      <div className="absolute top-5 right-5 z-10">
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggle}
            disabled={disabled}
            className="sr-only peer"
            aria-label={selected ? `Deseleccionar ${study.file_name}` : `Seleccionar ${study.file_name} para comparar`}
          />
          <span
            className={`inline-flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
              selected
                ? "bg-ocean border-ocean text-white"
                : disabled
                ? "border-muted text-muted-foreground bg-muted"
                : "border-border text-foreground hover:border-ocean"
            }`}
          >
            {selected ? (
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            ) : index >= 0 ? (
              <span className="text-[13px] font-bold">{index + 1}</span>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0-13.5L16.5 12M21 7.5H7.5" />
              </svg>
            )}
          </span>
        </label>
      </div>

      {/* Badge de SERIE — superpuesto IZQUIERDA (violeta) */}
      {seriesSelected && seriesBadge && (
        <div className="absolute top-5 left-5 z-10">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-violet text-white text-[13px] font-bold">
            {seriesBadge}
          </span>
        </div>
      )}

      {/* Selector de serie — overlay clickeable IZQUIERDA (cuando la familia está activa) */}
      {seriesBadge !== null && !seriesSelected && !seriesDisabled && (
        <div className="absolute top-5 left-5 z-10">
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={false}
              onChange={onSeriesToggle}
              className="sr-only peer"
              aria-label={seriesSelected ? `Quitar ${study.file_name} de la serie` : `Añadir ${study.file_name} a la serie`}
            />
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-violet/50 text-violet transition-colors hover:bg-violet-tint">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3v18m-4.5-9h18" />
              </svg>
            </span>
          </label>
        </div>
      )}

      {/* StudyCard existente */}
      <div className="pr-12 pl-12">
        <StudyCard study={study} showDelete={false} />
      </div>

      {/* Badge de orden */}
      {badgeLabel && (
        <div className="absolute bottom-4 right-4 z-10">
          <span className="inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide bg-ocean text-white">
            {badgeLabel}
          </span>
        </div>
      )}
    </div>
  );
}