"use client";

import { useRef, useState } from "react";
import { uploadStudy } from "@/lib/actions/studies";
import { MAX_FILE_SIZE, formatFileSize } from "@/lib/studies-utils";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Upload } from "@/components/ui/icons";

const MIME_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "image/jpeg": "JPEG",
  "image/png": "PNG",
  "image/webp": "WebP",
};

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
        <div className="mb-6 rounded-xl border border-danger/30 bg-danger-tint p-4 text-[14px] text-danger-strong">
          {error}
        </div>
      )}

      <form
        ref={formRef}
        action={uploadStudy}
        onSubmit={handlePreSubmit}
        className="space-y-6"
      >
        {/* File input */}
        <Card padding="lg">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-muted text-primary">
              <Upload className="h-7 w-7" />
            </div>

            {file ? (
              <div className="space-y-1">
                <p className="text-[15px] font-medium text-foreground">{file.name}</p>
                <p className="text-[13px] text-muted-foreground">
                  {MIME_LABELS[file.type] ?? file.type} · {formatFileSize(file.size)}
                </p>
              </div>
            ) : (
              <>
                <h3 className="text-[15px] font-medium text-foreground">
                  Arrastrá tu archivo aquí
                </h3>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  o hacé clic para seleccionar
                </p>
                <p className="mt-3 text-[12px] text-muted-foreground/70">
                  PDF o imagen — máximo {MAX_FILE_SIZE / (1024 * 1024)} MB
                </p>
              </>
            )}

            <input
              type="file"
              name="file"
              accept=".pdf,image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="mt-4 hidden"
              id="file-input"
            />
            <label
              htmlFor="file-input"
              className="mt-4 inline-flex cursor-pointer rounded-lg bg-primary px-4 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {file ? "Cambiar archivo" : "Seleccionar archivo"}
            </label>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={!file}>
            Subir estudio
          </Button>
          {file && (
            <Button type="button" variant="ghost" onClick={handleCancel}>
              Cancelar
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
