"use client";

import Link from "next/link";
import { getStudyTypeLabelNullable } from "@/lib/studies-utils";
import { formatStudyDate } from "@/lib/chat/dates";
import type { SelectableStudy } from "@/lib/chat/schema";

interface NewConversationStudyPickerProps {
  /** Estudios del usuario listos para usar como contexto. */
  studies: SelectableStudy[];
  /** IDs seleccionados (controlado por ChatView). */
  selectedIds: string[];
  /** Cambia la selección; se llama por cada toggle del usuario. */
  onToggle: (studyId: string, checked: boolean) => void;
  /** El usuario pulsa "Continuar" después de seleccionar al menos un estudio. */
  onContinue: () => void;
}

/**
 * Estado 2 — Seleccionar un estudio antes de empezar a conversar.
 *
 * Presenta las opciones de forma clara y amplia para que una persona mayor
 * o sin experiencia pueda identificar fácilmente que cada bloque es
 * seleccionable. No infantiliza: muestra nombre, tipo y fecha de forma clara,
 * y deja la continuación (Start) evidente solo cuando hay una selección.
 */
export function NewConversationStudyPicker({
  studies,
  selectedIds,
  onToggle,
  onContinue,
}: NewConversationStudyPickerProps) {
  const hasSelection = selectedIds.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col px-4 py-8">
      <div className="mb-6">
        <h2 className="text-[20px] font-medium leading-snug text-foreground">
          ¿Sobre qué estudio querés hablar?
        </h2>
        <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">
          Seleccioná un estudio para que Nuvio pueda ayudarte a entender tus
          resultados.
        </p>
      </div>

      {studies.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface px-5 py-8 text-center">
          <p className="text-[15px] font-medium text-foreground">
            No tenés estudios listos
          </p>
          <p className="mt-1 max-w-sm text-[13px] text-muted-foreground">
            Subí y analizá un estudio para poder consultarlo acá.
          </p>
          <Link
            href="/dashboard/subir"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-primary-700"
          >
            Subir un estudio
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3" role="list">
          {studies.map((study) => {
            const checked = selectedIds.includes(study.id);
            const date = formatStudyDate(study.created_at ?? undefined);
            const typeLabel = getStudyTypeLabelNullable(
              study.study_type
            );

            return (
              <li key={study.id}>
                <button
                  type="button"
                  onClick={() => onToggle(study.id, !checked)}
                  className={`flex w-full items-start gap-3 rounded-xl border px-4 py-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean ${
                    checked
                      ? "border-ocean bg-ocean-tint/70 ring-1 ring-ocean"
                      : "border-border bg-surface hover:border-ocean/40 hover:bg-ocean-tint/40"
                  }`}
                  aria-pressed={checked}
                >
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                      checked
                        ? "border-ocean bg-ocean text-white"
                        : "border-muted-foreground/40"
                    }`}
                    aria-hidden="true"
                  >
                    {checked && (
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75 6 15l6-6L19.5 6"
                        />
                      </svg>
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium text-foreground">
                      {study.file_name}
                    </span>
                    <span className="mt-0.5 block text-[13px] text-muted-foreground">
                      {date ? `${date} · ${typeLabel}` : typeLabel}
                    </span>
                    <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-success-tint px-2 py-0.5 text-[11px] font-medium text-success-strong">
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75 6 15l6-6L19.5 6"
                        />
                      </svg>
                      Analizado por Nuvio
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {studies.length > 0 && (
        <button
          type="button"
          disabled={!hasSelection}
          onClick={onContinue}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-3 text-[15px] font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
          aria-label={
            hasSelection
              ? "Continuar con el estudio seleccionado"
              : "Elegí al menos un estudio para continuar"
          }
        >
          Continuar
        </button>
      )}
    </div>
  );
}