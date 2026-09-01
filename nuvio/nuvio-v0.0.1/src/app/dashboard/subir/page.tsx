"use client";

import { useState } from "react";
import { uploadStudy } from "@/lib/actions/studies";
import { ALLOWED_STUDY_TYPES, MAX_FILE_SIZE, formatFileSize, type StudyType } from "@/lib/studies-utils";

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
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    setError(null);
    setSuccess(false);
  }

  function handleCancel() {
    setFile(null);
    setError(null);
    setSuccess(false);
    setStudyType("blood_test");
  }

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);
    setUploading(true);
    try {
      await uploadStudy(formData);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setUploading(false);
    }
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

      {success && (
        <div className="mb-6 rounded-xl border border-cyan-500/40 bg-cyan-50 p-4 text-[14px] text-cyan-800">
          ¡Estudio subido correctamente! Redirigiendo…
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-xl border border-red-400/50 bg-red-50 p-4 text-[14px] text-red-800">
          {error}
        </div>
      )}

      <form action={handleSubmit} className="space-y-6">
        {/* File input */}
        <div className="rounded-xl border-2 border-dashed border-ink-700/20 bg-white p-8 shadow-[0_1px_2px_rgba(11,20,38,0.04)]">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-primary-600">
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
              disabled={uploading}
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
            className="w-full rounded-lg border border-ink-700/20 bg-white px-3 py-2.5 text-[14px] text-foreground transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            disabled={uploading}
          >
            {ALLOWED_STUDY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!file || uploading}
            className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-6 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
          >
            {uploading ? "Subiendo…" : "Subir estudio"}
          </button>
          {file && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={uploading}
              className="rounded-lg px-4 py-2.5 text-[14px] font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:opacity-50"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}