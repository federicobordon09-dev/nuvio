import type { ChatMessage } from "@/lib/chat/schema";

interface MessageBubbleProps {
  message: ChatMessage;
}

/**
 * Burbuja de un mensaje del chat. El usuario a la derecha (acento ocean),
 * el asistente a la izquierda (superficie neutra). El contenido se muestra
 * como texto pre-lineado para conservar saltos de línea.
 */
export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-xl px-4 py-2.5 text-[14px] leading-relaxed ${
          isUser
            ? "bg-primary-600 text-white"
            : "border border-border bg-surface text-foreground"
        }`}
      >
        <p className="whitespace-pre-line">{message.content}</p>
      </div>
    </div>
  );
}
