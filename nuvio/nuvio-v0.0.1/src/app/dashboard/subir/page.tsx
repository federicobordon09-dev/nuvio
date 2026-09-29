"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { uploadStudy } from "@/lib/actions/studies";
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  formatFileSize,
} from "@/lib/studies-utils";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Check, Upload } from "@/components/ui/icons";

const MIME_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "image/jpeg": "JPEG",
  "image/png": "PNG",
  "image/webp": "WebP",
};

/** Etiquetas de formato derivadas de los MIME realmente aceptados por `uploadStudy`. */
const FORMAT_LABELS = ALLOWED_MIME_TYPES.map((mime) => MIME_LABELS[mime] ?? mime);

/** Pasos del flujo, alineados con los estados reales: uploaded → processing → processed. */
const STEPS = ["Elegir archivo", "Subir y procesar", "Ver resultados"];

function stepState(index: number, hasFile: boolean): "done" | "active" | "pending" {
  if (index === 0) return hasFile ? "done" : "active";
  if (index === 1) return hasFile ? "active" : "pending";
  return "pending";
}

function StepList({ hasFile }: { hasFile: boolean }) {
  return (
    <ol
      aria-label="Pasos para subir tu estudio"
      className="grid grid-cols-1 gap-4 rounded-[20px] border border-border bg-surface px-5 py-4 sm:grid-cols-3 sm:gap-6"
    >
      {STEPS.map((label, index) => {
        const state = stepState(index, hasFile);
        return (
          <li
            key={label}
            className="flex items-center gap-3"
            aria-current={state === "active" ? "step" : undefined}
          >
            <span
              aria-hidden="true"
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-caption font-semibold ${
                state === "done"
                  ? "bg-primary text-primary-foreground"
                  : state === "active"
                    ? "bg-primary-muted text-primary"
                    : "bg-surface-container-highest text-muted-foreground"
              }`}
            >
              {state === "done" ? <Check className="h-4 w-4" /> : index + 1}
            </span>
            <span
              className={`text-caption font-medium ${
                state === "active"
                  ? "text-primary"
                  : state === "done"
                    ? "text-foreground"
                    : "text-muted-foreground"
              }`}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Botón de envío con feedback de estado (`pending` durante el upload). */
function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={disabled} loading={pending}>
      {pending ? "Subiendo…" : "Subir estudio"}
    </Button>
  );
}

export default function SubirPage() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    setError(null);
  }

  function handleCancel() {
    setFile(null);
    setError(null);
    if (formRef.current) formRef.current.reset();
  }

  function handlePreSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!file) {
      e.preventDefault();
      setError("Debés seleccionar un archivo.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      e.preventDefault();
      setError(`El archivo supera el tamaño máximo de ${MAX_FILE_SIZE / (1024 * 1024)} MB.`);
      return;
    }
    setError(null);
  }

  return (
    <div>
      <PageHeader
        title="Subir estudio"
        description="Subí un documento médico para que Nuvio lo analice y clasifique automáticamente."
      />

      {error && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-danger/30 bg-danger-tint p-4 text-[14px] text-danger-strong"
        >
          {error}
        </div>
      )}

      <form
        ref={formRef}
        action={uploadStudy}
        onSubmit={handlePreSubmit}
        className="space-y-6"
      >
        <StepList hasFile={file !== null} />

        {/* File input — el <input> es hermano previo del label para que
            `peer-focus-visible` pueda dibujar el focus ring sobre el dropzone
            sin ocultarlo con display:none (sigue siendo enfocable por teclado). */}
        <Card padding="lg">
          <div className="flex flex-col items-center justify-center text-center">
            <input
              type="file"
              name="file"
              id="file-input"
              accept=".pdf,image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              aria-label="Archivo del estudio médico"
              aria-describedby="upload-formats"
              className="peer sr-only"
            />

            <label
              htmlFor="file-input"
              className="flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border-strong bg-background px-6 py-10 transition-colors hover:border-primary/40 hover:bg-primary-muted/30 peer-focus-visible:ring-2 peer-focus-visible:ring-lilac-glow peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface"
            >
              <span
                aria-hidden="true"
                className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-muted text-primary"
              >
                <Upload className="h-7 w-7" />
              </span>

              {file ? (
                <span className="block space-y-1">
                  <span className="block text-body font-medium text-foreground">
                    {file.name}
                  </span>
                  <span className="block text-caption text-muted-foreground">
                    {MIME_LABELS[file.type] ?? file.type} · {formatFileSize(file.size)}
                  </span>
                </span>
              ) : (
                <>
                  <span className="block text-body font-medium text-foreground">
                    Elegí tu archivo médico
                  </span>
                  <span className="mt-1 block text-caption text-muted-foreground">
                    Tocá acá para seleccionarlo desde tu dispositivo
                  </span>
                </>
              )}

              <span
                id="upload-formats"
                className="mt-4 flex flex-wrap items-center justify-center gap-2"
              >
                {FORMAT_LABELS.map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 text-caption font-medium text-muted-foreground"
                  >
                    {label}
                  </span>
                ))}
                <span className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 text-caption font-medium text-muted-foreground tabular-nums">
                  Hasta {MAX_FILE_SIZE / (1024 * 1024)} MB
                </span>
              </span>
            </label>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <label
                htmlFor="file-input"
                className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-body font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover peer-focus-visible:ring-2 peer-focus-visible:ring-lilac-glow peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface"
              >
                {file ? "Cambiar archivo" : "Seleccionar archivo"}
              </label>
              {file && (
                <Button type="button" variant="ghost" onClick={handleCancel}>
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <SubmitButton disabled={!file} />
        </div>
      </form>
    </div>
  );
}
