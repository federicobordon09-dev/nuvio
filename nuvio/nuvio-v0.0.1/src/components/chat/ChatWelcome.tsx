import Link from "next/link";
import { MessageCircle, Plus } from "@/components/ui/icons";

export function ChatWelcome() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center animate-fade-in">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-muted text-primary shadow-sm"
        aria-hidden="true"
      >
        <MessageCircle className="h-7 w-7" />
      </div>
      <h1 className="mt-5 text-heading text-primary">
        Chat IA sobre tus estudios
      </h1>
      <p className="mt-2 max-w-sm text-body text-muted-foreground">
        Creá una conversación, seleccioná uno de tus estudios y hacé preguntas
        sobre tus resultados.
      </p>
      <Link
        href="/dashboard/chat?new=1"
        className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-6 py-3 text-body font-medium text-primary-foreground shadow-sm transition-all duration-150 hover:-translate-y-px hover:bg-primary-hover hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lilac-glow focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-0"
        aria-label="Crear nueva conversación"
      >
        <Plus className="h-5 w-5" />
        Nueva conversación
      </Link>
    </div>
  );
}
