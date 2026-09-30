"use client";

import { motion, AnimatePresence } from "motion/react";
import type { ChatMessage } from "@/lib/chat/schema";
import { Chat, User } from "@/components/ui/icons";

interface MessageBubbleProps {
  message: ChatMessage;
}

const MESSAGE_TRANSITION = {
  duration: 0.25,
  ease: [0.16, 1, 0.3, 1] as const,
};

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const time = new Date(message.created_at).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        className={`flex items-start gap-3 ${isUser ? "justify-end" : "justify-start"}`}
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: isUser ? 20 : -20, height: 0 }}
        transition={MESSAGE_TRANSITION}
      >
        {!isUser && (
<motion.span
              aria-hidden="true"
              className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-plum-muted text-lilac-glow shadow-sm"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, ...MESSAGE_TRANSITION }}
            >
            <Chat className="h-4 w-4" />
          </motion.span>
        )}

        <motion.div
          className={`flex min-w-0 max-w-[85%] flex-col gap-1.5 ${isUser ? "items-end" : "items-start"}`}
          initial={{ opacity: 0, y: isUser ? 16 : -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, ...MESSAGE_TRANSITION }}
        >
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
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
          </motion.div>

          <motion.div
            className={`whitespace-pre-line px-4 py-3 text-body leading-relaxed ${
              isUser
                ? "rounded-2xl rounded-tr-none bg-primary text-primary-foreground shadow-sm"
                : "rounded-2xl border border-border bg-background text-foreground shadow-sm"
            }`}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, ...MESSAGE_TRANSITION }}
          >
            {message.content}
          </motion.div>
        </motion.div>

        {isUser && (
          <motion.span
            aria-hidden="true"
            className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-muted text-primary shadow-sm"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, ...MESSAGE_TRANSITION }}
          >
            <User className="h-4 w-4" />
          </motion.span>
        )}
      </motion.div>
    </AnimatePresence>
  );
}