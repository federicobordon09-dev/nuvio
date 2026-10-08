"use client";

import { motion, AnimatePresence, type Variants } from "motion/react";
import { useState } from "react";
import { ConversationList } from "./ConversationList";
import type { ChatConversation } from "@/lib/chat/schema";
import { Menu, X } from "@/components/ui/icons";
import { fadeInUp, mobileNavPanel, getMotionSafeTransition, STAGGER } from "@/lib/animation";

const MOBILE_TOGGLE_HEIGHT = 44;

interface ChatPageLayoutProps {
  conversations: ChatConversation[];
  children: React.ReactNode;
  hasActiveConversation?: boolean;
}

export function ChatPageLayout({
  conversations,
  children,
  hasActiveConversation = true,
}: ChatPageLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!hasActiveConversation) {
    return (
      <motion.div
        className="flex h-[calc(100vh-7rem)] min-h-[480px] overflow-hidden rounded-2xl border border-border bg-surface shadow-md lg:h-[calc(100vh-6rem)]"
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
      >
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="grid h-[calc(100vh-7rem)] min-h-[480px] gap-4 overflow-hidden lg:h-[calc(100vh-6rem)] lg:grid-cols-[280px_1fr] lg:gap-6"
      initial="hidden"
      animate="visible"
      variants={{ staggerChildren: STAGGER.section } as unknown as Variants}
    >
      <motion.aside
        className="hidden min-h-0 lg:block"
        variants={fadeInUp}
        style={{ animationDelay: "0ms" }}
      >
        <ConversationList conversations={conversations} />
      </motion.aside>

      <motion.div
        className="relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-md"
        variants={fadeInUp}
        style={{ animationDelay: "100ms" }}
      >
        <motion.button
          onClick={() => setMobileOpen((v) => !v)}
          className="flex h-11 w-full shrink-0 items-center gap-2 border-b border-border bg-background px-4 text-caption font-medium text-primary transition-colors duration-150 hover:bg-primary-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-lilac-glow lg:hidden"
          aria-expanded={mobileOpen}
          whileTap={{ scale: 0.98 }}
        >
          <AnimatePresence mode="wait">
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </AnimatePresence>
          {mobileOpen ? "Ocultar conversaciones" : "Conversaciones"}
        </motion.button>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              className="absolute inset-x-0 z-20 overflow-hidden border-b border-border bg-surface shadow-lg lg:hidden"
              style={{
                top: MOBILE_TOGGLE_HEIGHT,
                height: `calc(100% - ${MOBILE_TOGGLE_HEIGHT}px)`,
              }}
              variants={mobileNavPanel}
              initial="closed"
              animate="open"
              exit="closed"
              transition={getMotionSafeTransition({ duration: 0.3, ease: [0.16, 1, 0.3, 1] })}
            >
              <ConversationList conversations={conversations} />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          className="flex min-h-0 flex-1 flex-col"
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
        >
          {children}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}