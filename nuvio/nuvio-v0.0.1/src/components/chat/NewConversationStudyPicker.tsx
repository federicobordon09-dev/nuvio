"use client";

import Link from "next/link";
import { getStudyTypeLabelNullable } from "@/lib/studies-utils";
import { formatStudyDate } from "@/lib/chat/dates";
import type { SelectableStudy } from "@/lib/chat/schema";
import { Check } from "@/components/ui/icons";
import { Button } from "@/components/ui/Button";

interface NewConversationStudyPickerProps {
  studies: SelectableStudy[];
  selectedIds: string[];
  onToggle: (studyId: string, checked: boolean) => void;
  onContinue: () => void;
}

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
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary-700"
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
                  className={`flex w-full items-start gap-3 rounded-xl border px-4 py-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    checked
                      ? "border-primary bg-primary-muted/70 ring-1 ring-primary"
                      : "border-border bg-surface hover:border-primary/40 hover:bg-primary-muted/40"
                  }`}
                  aria-pressed={checked}
                >
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                      checked
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/40"
                    }`}
                    aria-hidden="true"
                  >
                    {checked && <Check className="h-4 w-4" />}
                  </span>

                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium text-foreground">
                      {study.file_name}
                    </span>
                    <span className="mt-0.5 block text-[13px] text-muted-foreground">
                      {date ? `${date} · ${typeLabel}` : typeLabel}
                    </span>
                    <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-success-tint px-2 py-0.5 text-[11px] font-medium text-success-strong">
                      <Check className="h-3 w-3" />
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
        <Button
          disabled={!hasSelection}
          onClick={onContinue}
          className="mt-6 w-full"
          size="lg"
          aria-label={
            hasSelection
              ? "Continuar con el estudio seleccionado"
              : "Elegí al menos un estudio para continuar"
          }
        >
          Continuar
        </Button>
      )}
    </div>
  );
}