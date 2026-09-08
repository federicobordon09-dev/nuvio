import type { ChatMessage } from "@/lib/chat/schema";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-xl px-4 py-2.5 text-[14px] leading-relaxed ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "border border-border bg-surface text-foreground"
        }`}
      >
        <p className="whitespace-pre-line">{message.content}</p>
      </div>
    </div>
  );
}
