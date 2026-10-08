# auth-request-latency — AuthRetryableFetchError en Vercel + carga lenta

## Objective

Eliminar el `[warn] AuthRetryableFetchError: fetch failed (status: 0)` de los logs de
Vercel y reducir la latencia de carga reduciendo los round-trips de autenticación
redundantes a Supabase por request.

## Why

Cada request a `/dashboard` dispara 3-4 llamadas HTTP seriales a Supabase Auth:
1. `src/proxy.ts` → `getClaims()` en TODOS los routes (incluidos `/`, `/auth/*`, etc.)
2. `dashboard/layout.tsx` → `getClaims()` + `getUser()` (2 llamadas)
3. `dashboard/page.tsx` → `getUser()`
4. `dashboard/estudios/page.tsx` → `getUser()`

El warning proviene de `@supabase/auth-js` (versión 2.112.4): al crear un
`createServerClient`, `@supabase/ssr` (0.12.5) registra `onAuthStateChange`, que
emite `INITIAL_SESSION` y ejecuta `__loadSession()`. Si el access token está dentro
de la ventana `EXPIRY_MARGIN_MS` (90s), dispara un POST `/token?grant_type=refresh_token`
sin importar `autoRefreshToken: false` (verificado en `__loadSession` línea 2558).
Cuando ese fetch falla a nivel transporte (abortado por navegación superseded o
fallo de red), auth-js lo envuelve en `AuthRetryableFetchError` con `status: 0` y
lo loguea con `console.warn(err)` (GoTrueClient.js:3670 `_emitInitialSession`).

La carga lenta alimenta el warning: render lento → navegaciones canceladas →
fetches abortados → `fetch failed`.

## Scope (allowed edit surfaces)

- `src/proxy.ts`
- `src/lib/supabase/server.ts`
- `src/app/dashboard/layout.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/dashboard/estudios/page.tsx`
- `src/app/dashboard/perfil/page.tsx`
- `src/proxy.ts` test: `src/proxy.test.ts` o `src/lib/__tests__/proxy.test.ts` (nuevo)
- Eliminar `proxy.ts` raíz (duplicado de `src/proxy.ts`)

## Constraints

- No cambiar comportamiento de auth (gate de /dashboard y redirect de /auth intactos).
- No tocar server actions (`src/lib/actions/*`), no tocar client.ts.
- No cambiar tests existentes.
- Cambios de código en inglés (identifiers, comments).

## Checklist

- [x] T1: `src/lib/supabase/server.ts` — agregar `getServerClient()` y `getServerUser()` con `cache()` de React (1 cliente + 1 getUser por render).
- [x] T2: `src/proxy.ts` — solo crear cliente Supabase y chequear sesión para rutas `/dashboard*` y `/auth*`; extraer `needsSessionCheck()` puro + test unitario (`src/proxy.test.ts`).
- [x] T3: `dashboard/layout.tsx` — reemplazar `getClaims()` + `getUser()` por `getServerUser()`.
- [x] T4: `dashboard/page.tsx`, `dashboard/estudios/page.tsx`, `dashboard/perfil/page.tsx` — usar `getServerUser()`/`getServerClient()`.
- [x] T5: Eliminar `proxy.ts` raíz (duplicado; ya borrado en worktree, staged con `git rm`).
- [x] T6: Verificación: RED→GREEN `pnpm exec vitest run src/proxy.test.ts` (7/7), `npx tsc --noEmit` exit 0, `pnpm build` OK (Next 16, Proxy reconocido).
- [x] T7: Commit convencional `fix(auth): ...` solo con archivos del fix + push.

## Route

- Delegated direct (writer `general`) — 7 archivos, requiere contexto de diagnóstico completo.

## Verification evidence

- `pnpm exec vitest run src/proxy.test.ts` → Test Files 1 passed, Tests 7 passed (RED → GREEN observado).
- `npx tsc --noEmit` → exit 0 (sin errores nuevos).
- `pnpm build` → OK; rutas estáticas/dinámicas correctas; `ƒ Proxy (Middleware)` reconocido; next-sitemap OK.
- `pnpm lint` → NO ejecutable por incompatibilidad de toolchain PRE-EXISTENTE (eslint-plugin-react@7.37.5 crashea con eslint@10.11.0 al cargar react/display-name; falla igual en archivos untouched). No es del fix.
- Fallos pre-existentes documentados: tests `node:test` (describe not a function) bajo vitest — no relacionados.
- Ambiente: sin `.env.local` local; build pasa igual (los `NEXT_PUBLIC_*` se resuelven en Vercel).- Commit: e249be7 (work-unit commit, feature branch main)
