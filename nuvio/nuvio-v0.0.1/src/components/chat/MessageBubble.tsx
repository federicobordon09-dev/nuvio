import type { ChatMessage } from "@/lib/chat/schema";
import { Chat, User } from "@/components/ui/icons";

interface MessageBubbleProps {
  message: ChatMessage;
}

/**
 * Burbuja de un mensaje del hilo.
 *
 * Solo presentación: `message.content` se pinta tal cual (sin parsear ni
 * reescribir). El rol decide la alineación, el avatar y los colores.
 */
export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const time = new Date(message.created_at).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={`flex items-start gap-3 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      {!isUser && (
        <span
          aria-hidden="true"
          className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-plum-muted text-lilac-glow shadow-sm"
        >
          <Chat className="h-4 w-4" />
        </span>
      )}

      <div
        className={`flex min-w-0 max-w-[85%] flex-col gap-1.5 ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-caption font-semibold text-primary">
            {isUser ? "Vos" : "Nuvio"}
          </span>
          <time
            dateTime={message.created_at}
            suppressHydrationWarning
            className="text-[11px] font-medium text-outline"
          >
            {time}
          </time>
        </div>

        <div
          className={`whitespace-pre-line px-4 py-3 text-body leading-relaxed ${
            isUser
              ? "rounded-2xl rounded-tr-none bg-primary text-primary-foreground shadow-sm"
              : "rounded-2xl border border-border bg-background text-foreground shadow-sm"
          }`}
        >
          {message.content}
        </div>
      </div>

      {isUser && (
        <span
          aria-hidden="true"
          className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-muted text-primary shadow-sm"
        >
          <User className="h-4 w-4" />
        </span>
      )}
    </div>
  );
}
