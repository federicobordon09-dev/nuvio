"use client";

import { useState } from "react";
import { getSignedUrl } from "@/lib/actions/studies";
import { Button } from "@/components/ui/Button";

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
      <Button
        onClick={handleDownload}
        disabled={loading}
      >
        {loading ? "Generando enlace…" : "Descargar"}
      </Button>
      {error && <p className="text-[12px] text-danger">{error}</p>}
    </div>
  );
}