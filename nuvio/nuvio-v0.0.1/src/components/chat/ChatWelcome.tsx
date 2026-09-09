import Link from "next/link";
import { MessageCircle, Plus } from "@/components/ui/icons";

export function ChatWelcome() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center animate-fade-in">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-muted text-primary"
        aria-hidden="true"
      >
        <MessageCircle className="h-7 w-7" />
      </div>
      <h1 className="mt-5 text-heading font-medium text-foreground">
        Chat IA sobre tus estudios
      </h1>
      <p className="mt-2 max-w-sm text-body text-muted-foreground">
        Creá una conversación, seleccioná uno de tus estudios y hacé preguntas
        sobre tus resultados.
      </p>
      <Link
        href="/dashboard/chat?new=1"
        className="mt-7 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-body font-medium text-primary-foreground transition-all duration-150 hover:bg-primary/90 hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        aria-label="Crear nueva conversación"
      >
        <Plus className="h-5 w-5" />
        Nueva conversación
      </Link>
    </div>
  );
}
