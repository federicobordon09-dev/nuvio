"use client";

import { useState } from "react";
import Link from "next/link";
import { StudyCard } from "./StudyCard";
import type { StudyForSelection } from "@/lib/comparison/selection";
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
  studies: StudyForSelection[];
}

/**
 * Controlador de selección de hasta 2 estudios para comparar.
 * Envuelve el listado de tarjetas y muestra la barra de acción.
 */
export function StudySelectionList({ studies }: StudySelectionListProps) {
  const [selection, setSelection] = useState(initialSelectionState);

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

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Header del modo selección (desktop: sticky top) */}
      <div className="hidden lg:block sticky top-4 z-10 mb-4 rounded-xl border border-ocean/20 bg-ocean-tint/50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
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
            <p className="text-[14px] font-medium text-foreground">{getSelectionLabel(selection)}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href={compareUrl ?? "#"}
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[14px] font-medium transition-colors ${
                canCompareNow
                  ? "bg-ocean text-white hover:bg-ocean-dark"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
              aria-disabled={!canCompareNow}
            >
              {getCompareButtonLabel(selection)}
            </Link>
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

      {/* Listado de tarjetas con checkbox */}
      <div className="flex-1 space-y-4">
        {studies.map((study) => (
          <StudyCardWithCheckbox
            key={study.id}
            study={study}
            selected={isSelected(selection, study.id)}
            index={getSelectionIndex(selection, study.id)}
            disabled={!isSelectable && !isSelected(selection, study.id)}
            onToggle={() => handleToggle(study.id)}
          />
        ))}
      </div>

      {/* Barra de acción fija en mobile */}
      <div className="lg:hidden sticky bottom-0 z-20 mt-4 border-t border-border bg-surface/95 backdrop-blur-sm p-4">
        <div className="flex flex-col gap-3">
          <p className="text-[13px] text-muted-foreground text-center">{getSelectionLabel(selection)}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={compareUrl ?? "#"}
              className={`flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-[15px] font-medium ${
                canCompareNow
                  ? "bg-ocean text-white hover:bg-ocean-dark"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
              aria-disabled={!canCompareNow}
            >
              {getCompareButtonLabel(selection)}
            </Link>
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
 * Tarjeta de estudio con checkbox de selección integrado.
 * Envuelve el StudyCard existente preservando sus acciones (eliminar, detalle).
 * El checkbox es un control superpuesto que no interfiere con el Link.
 */
function StudyCardWithCheckbox({
  study,
  selected,
  index,
  disabled,
  onToggle,
}: {
  study: StudyForSelection;
  selected: boolean;
  index: 0 | 1 | -1;
  disabled: boolean;
  onToggle: () => void;
}) {
  const badgeLabel = index === 0 ? "Anterior" : index === 1 ? "Posterior" : "";

  return (
    <div className={`relative rounded-xl transition-all ${
      selected
        ? "ring-2 ring-ocean/20 bg-ocean-tint/30"
        : ""
    }`}>
      {/* Checkbox de selección — superpuesto */}
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
            )}
          </span>
        </label>
      </div>

      {/* StudyCard existente */}
      <div className="pr-12">
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