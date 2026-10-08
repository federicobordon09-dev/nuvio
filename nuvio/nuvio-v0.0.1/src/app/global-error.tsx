"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("Global error:", error);
    }
  }, [error]);

  return (
    <html lang="es">
      <body style={{ padding: "2rem", fontFamily: "system-ui, sans-serif", textAlign: "center" }}>
        <h1 style={{ color: "#dc2626", marginBottom: "1rem" }}>Something went wrong!</h1>
        <p style={{ color: "#374151", marginBottom: "1.5rem", maxWidth: "400px", margin: "0 auto 1.5rem" }}>
          {error?.message ?? "An unexpected error occurred"}
        </p>
        <button
          onClick={reset}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "0.375rem",
            cursor: "pointer",
            fontSize: "1rem",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}