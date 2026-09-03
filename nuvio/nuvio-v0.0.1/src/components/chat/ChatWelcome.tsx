import { createConversationAction } from "@/lib/actions/chat";

/**
 * Estado 1 — Bienvenida del Chat IA (sin conversación activa).
 *
 * Centra claramente la propuesta de valor y deja el CTA "Nueva conversación"
 * como elemento principal. No acepta entrada ni exige saber qué hacer después;
 * el onboarding continúa al crear la conversación. Lenguaje humano y guiado.
 *
 * Server component: la acción es una server action (sin estado cliente).
 */
export function ChatWelcome() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
      <div
        className="flex h-12 w-12 items-center justify-center rounded-xl bg-ocean-tint text-ocean"
        aria-hidden="true"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
          />
        </svg>
      </div>
      <h1 className="mt-4 text-[22px] font-medium leading-tight text-foreground">
        Chat IA sobre tus estudios
      </h1>
      <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-muted-foreground">
        Creá una conversación, seleccioná uno de tus estudios y hacé preguntas
        sobre tus resultados.
      </p>
      <form action={createConversationAction} className="mt-7">
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-3 text-[15px] font-medium text-white transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
          aria-label="Crear nueva conversación"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Nueva conversación
        </button>
      </form>
    </div>
  );
}