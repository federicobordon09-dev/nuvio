"use client";

import { useState } from "react";
import { getSignedUrl } from "@/lib/actions/studies";

export function StudyDownloadButton({ studyId }: { studyId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setLoading(true);
    setError(null);
    try {
      const url = await getSignedUrl(studyId);
      window.open(url, "_blank");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al generar enlace.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleDownload}
        disabled={loading}
        className="rounded-lg bg-primary-600 px-4 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
      >
        {loading ? "Generando enlace…" : "Descargar"}
      </button>
      {error && <p className="text-[12px] text-red-600">{error}</p>}
    </div>
  );
}