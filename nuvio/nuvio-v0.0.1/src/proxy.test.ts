import { describe, expect, it } from "vitest";

import { needsSessionCheck } from "./proxy";

describe("needsSessionCheck", () => {
  it.each<[string, boolean]>([
    ["/dashboard", true],
    ["/dashboard/subir", true],
    ["/auth", true],
    ["/auth/login", true],
    ["/", false],
    ["/precios", false],
  ])("returns %s for pathname %s", (pathname, expected) => {
    expect(needsSessionCheck(pathname)).toBe(expected);
  });

  // Decision: /auth/callback returns true because the predicate is a pure
  // prefix check and /auth/callback IS an auth route. The proxy short-circuits
  // it before the session check runs (it needs raw request cookies for the
  // PKCE exchange), so the check is moot for that path, not wrong.
  it("returns true for /auth/callback (the proxy short-circuits that route earlier)", () => {
    expect(needsSessionCheck("/auth/callback")).toBe(true);
  });
});