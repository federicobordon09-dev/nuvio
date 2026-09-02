"use client";

import { useState } from "react";
import { deleteStudyAction } from "@/lib/actions/studies";

export function StudyDeleteButton({
  studyId,
  studyName,
}: {
  studyId: string;
  studyName?: string;
}) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="rounded-lg px-4 py-2.5 text-[14px] font-medium text-red-700 transition-colors hover:bg-red-50"
      >
        Eliminar
      </button>

      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowConfirm(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Confirmar eliminación"
        >
          <div
            className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[15px] font-medium text-foreground">
              Eliminar estudio
            </h3>
            <p className="mt-2 text-[14px] text-muted-foreground">
              {studyName ? (
                <>
                  ¿Seguro que querés eliminar{" "}
                  <strong className="text-foreground">{studyName}</strong>?
                </>
              ) : (
                <>¿Seguro que querés eliminar este estudio?</>
              )}
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Esta acción es irreversible. El archivo y su análisis se eliminarán
              definitivamente.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="rounded-lg px-4 py-2 text-[14px] font-medium text-foreground transition-colors hover:bg-muted"
              >
                Cancelar
              </button>
              <form action={deleteStudyAction}>
                <input type="hidden" name="studyId" value={studyId} />
                <button
                  type="submit"
                  className="rounded-lg bg-red-600 px-4 py-2 text-[14px] font-medium text-white transition-colors hover:bg-red-700"
                >
                  Eliminar
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
