import { vi } from "vitest";
import "@testing-library/jest-dom";

// ── node:test mock → Vitest globals ─────────────────
vi.mock("node:test", async () => {
  const actual = await vi.importActual<typeof import("node:test")>("node:test");
  return {
    ...actual,
    describe: (vitest as any).describe,
    it: (vitest as any).it,
    test: (vitest as any).it,
    beforeAll: (vitest as any).beforeAll,
    afterAll: (vitest as any).afterAll,
    beforeEach: (vitest as any).beforeEach,
    afterEach: (vitest as any).afterEach,
    default: {
      describe: (vitest as any).describe,
      it: (vitest as any).it,
      test: (vitest as any).it,
    },
  };
});

// ── next/navigation mocks ──────────────────────────────────
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// ── supabase mock ──────────────────────────────────────────
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({ data: { user: { id: "user-1", email: "test@test.com" } } })
      ),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: {}, error: null })),
          maybeSingle: vi.fn(() => Promise.resolve({ data: {}, error: null })),
        })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn() })) })),
      update: vi.fn(() => ({ eq: vi.fn() })),
      remove: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => ({ error: null })),
        createSignedUrl: vi.fn(() => ({ data: { signedUrl: "" }, error: null })),
        remove: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    },
    cookies: {
      getAll: vi.fn(() => []),
    },
  })),
}));

// ── motion/react mock ──────────────────────────────────────
vi.mock("motion/react", () => ({
  motion: {
    div: "div",
    section: "section",
    ul: "ul",
    li: "li",
    button: "button",
    header: "header",
    footer: "footer",
    nav: "nav",
    a: "a",
    span: "span",
    p: "p",
    h1: "h1",
    h2: "h2",
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) =>
    children,
  useMotionValue: vi.fn(() => ({ get: () => 0, set: vi.fn() })),
  useTransform: vi.fn((val) => val),
  useAnimation: vi.fn(() => ({ start: vi.fn() })),
}));