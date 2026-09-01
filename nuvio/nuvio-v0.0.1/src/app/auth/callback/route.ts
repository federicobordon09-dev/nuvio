import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function buildRedirect(
  request: NextRequest,
  pathname: string,
  params?: Record<string, string>
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  const rawNext = searchParams.get("next");
  const next =
    rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//")
      ? rawNext
      : "/dashboard";

  console.log("[auth/callback]", {
    hasCode: Boolean(code),
    hasFlowId: searchParams.has("flow_id"),
    next,
    cookieNames: request.cookies.getAll().map((cookie) => cookie.name),
  });

  if (!code) {
    return buildRedirect(request, "/auth/login", { error: "missing_code" });
  }

  // The response object carries every cookie the Supabase client writes while
  // exchanging the code (the session tokens, but also PKCE verifier cleanup).
  // It is rebuilt inside setAll() so those cookie writes always survive on the
  // redirect we return — returning a brand-new response instead would drop the
  // session cookie and silently bounce the user back to /auth/login.
  let supabaseResponse = buildRedirect(request, next);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = buildRedirect(request, next);
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const errorResponse = buildRedirect(request, "/auth/login", {
      error: error.message,
    });
    // Preserve any cookie writes made before the failed exchange (e.g. the
    // verifier cleanup) on the error redirect as well.
    for (const cookie of supabaseResponse.cookies.getAll()) {
      errorResponse.cookies.set(cookie);
    }
    return errorResponse;
  }

  return supabaseResponse;
}