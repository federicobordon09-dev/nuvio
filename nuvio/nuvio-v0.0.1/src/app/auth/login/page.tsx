"use client";

import { motion } from "motion/react";
import { useState, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import {
  fadeInUpHero,
  fadeInUp,
  staggerContainer,
  scaleInSpring,
  getViewportOptions,
} from "@/lib/animation";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const error = searchParams.get("error");
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      setLoading(false);
    }
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {error && (
        <motion.div
          className="mb-6 rounded-lg border border-danger/20 bg-danger-tint/50 p-4 text-caption text-danger-strong"
          role="alert"
          variants={fadeInUp}
          style={{ animationDelay: "0ms" }}
        >
          {error}
        </motion.div>
      )}

      <motion.button
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full inline-flex items-center justify-center font-medium h-14 px-8 text-body gap-2 rounded-md"
        variants={scaleInSpring}
        style={{ animationDelay: error ? "100ms" : "0ms" }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
      >
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {loading ? "Conectando..." : "Continuar con Google"}
      </motion.button>

      <motion.p
        className="mt-6 text-center text-caption text-muted-foreground"
        variants={fadeInUp}
        style={{ animationDelay: error ? "200ms" : "100ms" }}
      >
        Al continuar, aceptás nuestros{" "}
        <a href="/terminos" className="underline hover:text-primary">
          Términos de uso
        </a>{" "}
        y{" "}
        <a href="/privacidad" className="underline hover:text-primary">
          Política de privacidad
        </a>
      </motion.p>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <motion.div
        className="radial-lilac-glow pointer-events-none absolute inset-0"
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      />

      <motion.div
        className="relative w-full max-w-md rounded-xl border border-border bg-surface p-8 shadow-[var(--shadow-md)]"
        variants={fadeInUpHero}
        initial="hidden"
        animate="visible"
        viewport={getViewportOptions()}
      >
        <motion.div className="mb-8 text-center" variants={staggerContainer}>
          <motion.img
            src="/nuvio_logo_nuevo.png"
            alt="Nuvio"
            className="mx-auto h-14 w-auto"
            variants={scaleInSpring}
            style={{ animationDelay: "0ms" }}
          />
          <motion.h1
            className="mt-5 text-heading font-semibold text-primary"
            variants={fadeInUpHero}
            style={{ animationDelay: "100ms" }}
          >
            Iniciá sesión en Nuvio
          </motion.h1>
          <motion.p
            className="mt-2 text-body leading-body text-muted-foreground"
            variants={fadeInUp}
            style={{ animationDelay: "150ms" }}
          >
            Accedé con tu cuenta de Google para gestionar tus estudios médicos
          </motion.p>
        </motion.div>

        <Suspense>
          <LoginForm />
        </Suspense>
      </motion.div>
    </div>
  );
}