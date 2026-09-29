"use client";

import Link from "next/link";
import { getStudyTypeLabelNullable } from "@/lib/studies-utils";
import { formatStudyDate } from "@/lib/chat/dates";
import type { SelectableStudy } from "@/lib/chat/schema";
import { Check } from "@/components/ui/icons";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface NewConversationStudyPickerProps {
  studies: SelectableStudy[];
  selectedIds: string[];
  onToggle: (studyId: string, checked: boolean) => void;
  onContinue: () => void;
  /** Nivel de encabezado: `h1` cuando abre la página, `h2` bajo el título del chat. */
  headingAs?: "h1" | "h2";
}

export function NewConversationStudyPicker({
  studies,
  selectedIds,
  onToggle,
  onContinue,
  headingAs = "h2",
}: NewConversationStudyPickerProps) {
  const hasSelection = selectedIds.length > 0;
  const Heading = headingAs;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col px-4 py-8 sm:px-6">
      <div className="mb-6">
        <Heading className="text-heading text-primary">
          ¿Sobre qué estudio querés hablar?
        </Heading>
        <p className="mt-2 text-body text-muted-foreground">
          Seleccioná un estudio para que Nuvio pueda ayudarte a entender tus
          resultados.
        </p>
      </div>

      {studies.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface px-6 py-10 text-center shadow-sm">
          <p className="text-subheading text-primary">
            No tenés estudios listos
          </p>
          <p className="mt-2 max-w-sm text-caption text-muted-foreground">
            Subí y analizá un estudio para poder consultarlo acá.
          </p>
          <Link
            href="/dashboard/subir"
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-body font-medium text-primary-foreground shadow-sm transition-all duration-150 hover:-translate-y-px hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lilac-glow focus-visible:ring-offset-2 active:translate-y-0"
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
                  className={`flex w-full items-start gap-3 rounded-xl border px-4 py-4 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lilac-glow focus-visible:ring-offset-2 ${
                    checked
                      ? "border-primary bg-primary-muted/50 ring-1 ring-primary/30"
                      : "border-border-strong bg-surface hover:border-lilac-glow hover:bg-primary-muted/30"
                  }`}
                  aria-pressed={checked}
                >
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                      checked
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-outline-variant"
                    }`}
                    aria-hidden="true"
                  >
                    {checked && <Check className="h-4 w-4" />}
                  </span>

                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-body font-medium text-foreground">
                      {study.file_name}
                    </span>
                    <span className="mt-0.5 block text-caption text-muted-foreground">
                      {date ? `${date} · ${typeLabel}` : typeLabel}
                    </span>
                    <Badge variant="success" size="sm" className="mt-2">
                      <Check className="h-3 w-3" />
                      Analizado por Nuvio
                    </Badge>
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
