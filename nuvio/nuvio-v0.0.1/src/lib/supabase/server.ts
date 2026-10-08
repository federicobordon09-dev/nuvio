import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import type { User } from "@supabase/supabase-js";

/**
 * Request-scoped Supabase server client. React `cache()` memoizes within a
 * single render pass, so the layout, pages and nested components share one
 * client (and one session load) instead of creating a new client — and a new
 * INITIAL_SESSION auth round-trip — at every call site.
 */
export const getServerClient = cache(async () => createClient());

/**
 * Resolve the authenticated user at most once per request.
 */
export const getServerUser = cache(async (): Promise<User | null> => {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export async function createClient() {
  const cookieStore = await cookies();

  // Use the same key name as proxy.ts (PUBLISHABLE_KEY) with fallback to ANON_KEY
  // for backward compatibility. Both work with @supabase/ssr.
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseKey) {
    throw new Error(
      "Missing Supabase key. Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (preferred) or NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Components cannot set cookies. Middleware handles refreshes.
          }
        },
      },
    }
  );
}