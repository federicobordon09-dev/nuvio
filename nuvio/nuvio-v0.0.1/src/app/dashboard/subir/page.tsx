"use client";

import { useRef, useState } from "react";
import { uploadStudy } from "@/lib/actions/studies";
import { ALLOWED_STUDY_TYPES, MAX_FILE_SIZE, formatFileSize, getStudyTypeLabel, type StudyType } from "@/lib/studies-utils";

const MIME_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "image/jpeg": "JPEG",
  "image/png": "PNG",
  "image/webp": "WebP",
};

export default function SubirPage() {
  const [file, setFile] = useState<File | null>(null);
  const [studyType, setStudyType] = useState<StudyType>("blood_test");
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
    setStudyType("blood_test");
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
      <div className="mb-8">
        <h1 className="text-[24px] font-medium tracking-[-0.02em] text-foreground">
          Subir estudio
        </h1>
        <p className="mt-2 text-[14px] leading-[1.6] text-muted-foreground">
          Subí un documento médico para que Nuvio lo analice.
        </p>
      </div>

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
        <div className="rounded-xl border-2 border-dashed border-border bg-surface p-8">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-ocean-tint text-ocean">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
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
              className="mt-4 inline-flex cursor-pointer rounded-lg bg-primary-600 px-4 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
            >
              {file ? "Cambiar archivo" : "Seleccionar archivo"}
            </label>
          </div>
        </div>

        {/* Study type */}
        <div className="space-y-2">
          <label htmlFor="studyType" className="block text-[14px] font-medium text-foreground">
            Tipo de estudio
          </label>
          <select
            id="studyType"
            name="studyType"
            value={studyType}
            onChange={(e) => setStudyType(e.target.value as StudyType)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-[14px] text-foreground transition-colors focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean-tint"
          >
            {ALLOWED_STUDY_TYPES.map((type) => (
              <option key={type} value={type}>
                {getStudyTypeLabel(type)}
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!file}
            className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-6 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
          >
            Subir estudio
          </button>
          {file && (
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-lg px-4 py-2.5 text-[14px] font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}