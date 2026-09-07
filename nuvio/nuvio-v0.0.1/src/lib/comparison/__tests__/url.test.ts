import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseCompareIds } from "../url.ts";

// ── Helpers ──────────────────────────────────────────────

function idsOf(rawIds: string | undefined): [string, string] {
  const result = parseCompareIds(rawIds);
  assert.ok(result.ok, `Se esperaba un resultado válido para "${rawIds}"`);
  return result.ids;
}

function errorKindOf(rawIds: string | undefined): string {
  const result = parseCompareIds(rawIds);
  assert.ok(!result.ok, `Se esperaba un error para "${rawIds}"`);
  return result.kind;
}

describe("parseCompareIds", () => {
  describe("casos válidos", () => {
    it("parsea dos IDs separados por coma", () => {
      assert.deepEqual(idsOf("abc-123,def-456"), ["abc-123", "def-456"]);
    });

    it("recorta espacios alrededor de cada ID", () => {
      assert.deepEqual(idsOf("  abc-123 , def-456  "), ["abc-123", "def-456"]);
    });

    it("acepta IDs con guiones, números y puntos", () => {
      assert.deepEqual(idsOf("a1.b-2,000-abc"), ["a1.b-2", "000-abc"]);
    });
  });

  describe("casos inválidos", () => {
    it("rechaza un parámetro ausente", () => {
      assert.equal(errorKindOf(undefined), "missing_ids");
    });

    it("rechaza un parámetro vacío", () => {
      assert.equal(errorKindOf(""), "missing_ids");
    });

    it("rechaza un parámetro de solo espacios", () => {
      assert.equal(errorKindOf("   "), "missing_ids");
    });

    it("rechaza un solo ID", () => {
      assert.equal(errorKindOf("abc-123"), "not_exactly_two");
    });

    it("rechaza tres IDs", () => {
      assert.equal(errorKindOf("a,b,c"), "not_exactly_two");
    });

    it("rechaza más de tres IDs", () => {
      assert.equal(errorKindOf("a,b,c,d"), "not_exactly_two");
    });

    it("rechaza un primer ID vacío", () => {
      assert.equal(errorKindOf(",def-456"), "empty_id");
      assert.equal(errorKindOf(" ,def-456"), "empty_id");
    });

    it("rechaza un segundo ID vacío", () => {
      assert.equal(errorKindOf("abc-123,"), "empty_id");
      assert.equal(errorKindOf("abc-123, "), "empty_id");
    });

    it("rechaza dos IDs duplicados", () => {
      assert.equal(errorKindOf("abc-123,abc-123"), "duplicate_ids");
    });

    it("rechaza IDs duplicados aunque haya espacios", () => {
      assert.equal(errorKindOf(" abc-123 ,abc-123 "), "duplicate_ids");
    });
  });

  describe("mensajes de error", () => {
    it("incluye un mensaje descriptivo", () => {
      const result = parseCompareIds("solo-uno");
      assert.ok(!result.ok);
      assert.match(result.message, /exactamente dos IDs/);
    });
  });
});