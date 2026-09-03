"use client";

import { useState } from "react";
import { createConversationWithContextAction } from "@/lib/actions/chat";
import { NewConversationStudyPicker } from "./NewConversationStudyPicker";
import type { SelectableStudy } from "@/lib/chat/schema";

interface NewConversationPanelProps {
  studies: SelectableStudy[];
}

/**
 * Panel del flujo "Nueva conversación": selección previa de estudio antes de
 * crear la conversación.
 *
 * Reutiliza `NewConversationStudyPicker` para el UI y
 * `createConversationWithContextAction` para la persistencia (resuelve el
 * título desde `studies.study_type` en el servidor y vincula el contexto).
 * No duplica lógica de creación de conversaciones.
 */
export function NewConversationPanel({ studies }: NewConversationPanelProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  async function handleContinue() {
    if (selectedIds.length === 0) return;

    const formData = new FormData();
    for (const id of selectedIds) formData.append("studyId", id);
    await createConversationWithContextAction(formData);
  }

  return (
    <NewConversationStudyPicker
      studies={studies}
      selectedIds={selectedIds}
      onToggle={(id, checked) =>
        setSelectedIds((prev) =>
          checked ? [...prev, id] : prev.filter((x) => x !== id)
        )
      }
      onContinue={handleContinue}
    />
  );
}
