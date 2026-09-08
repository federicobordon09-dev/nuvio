import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  parseEvolutionIds,
  EVOLUTION_PARSE_MESSAGES,
  type ParseEvolutionIdsErrorKind,
} from "../parse-ids.ts";
import {
  EVOLUTION_MIN_STUDIES,
  EVOLUTION_MAX_STUDIES,
} from "../selection.ts";

// ── Helpers ──────────────────────────────────────────────

const reasonOf = (raw: string | undefined): ParseEvolutionIdsErrorKind | null =>
  parseEvolutionIds(raw).ok ? null : parseEvolutionIds(raw).kind;

const idsOf = (raw: string | undefined): string[] | null => {
  const r = parseEvolutionIds(raw);
  return r.ok ? r.ids : null;
};

// ── Tests ────────────────────────────────────────────────

describe("parseEvolutionIds", () => {
  // ── Parámetro ausente o vacío ─────────────────────────
  describe("missing_ids", () => {
    it("undefined → missing_ids", () => {
      assert.equal(reasonOf(undefined), "missing_ids");
    });

    it("empty string → missing_ids", () => {
      assert.equal(reasonOf(""), "missing_ids");
    });

    it("whitespace only → missing_ids", () => {
      assert.equal(reasonOf("   "), "missing_ids");
    });

    it("mensaje legible y específico", () => {
      const r = parseEvolutionIds("");
      assert.equal(r.ok, false);
      if (!r.ok) {
        assert.equal(r.message, EVOLUTION_PARSE_MESSAGES.missing_ids);
      }
    });
  });

  // ── Parte vacía ───────────────────────────────────────
  describe("empty_id", () => {
    it("trailing comma → empty_id", () => {
      assert.equal(reasonOf("a,b,"), "empty_id");
    });

    it("leading comma → empty_id", () => {
      assert.equal(reasonOf(",a,b"), "empty_id");
    });

    it("double comma → empty_id", () => {
      assert.equal(reasonOf("a,,b"), "empty_id");
    });

    it("spaces-only part → empty_id", () => {
      assert.equal(reasonOf("a,  ,b"), "empty_id");
    });

    it("mensaje legible", () => {
      const r = parseEvolutionIds("a,,b");
      assert.equal(r.ok, false);
      if (!r.ok) {
        assert.equal(r.message, EVOLUTION_PARSE_MESSAGES.empty_id);
      }
    });
  });

  // ── Menos de 2 estudios ────────────────────────────────
  describe("not_enough_studies", () => {
    it("un solo ID → not_enough_studies", () => {
      assert.equal(reasonOf("single-id"), "not_enough_studies");
    });

    it("mensaje usa la constante MIN (2)", () => {
      const r = parseEvolutionIds("one");
      assert.equal(r.ok, false);
      if (!r.ok) {
        assert.match(r.message, new RegExp(String(EVOLUTION_MIN_STUDIES)));
      }
    });
  });

  // ── Más de 10 estudios ─────────────────────────────────
  describe("too_many_studies", () => {
    it("11 IDs → too_many_studies", () => {
      const eleven = Array.from({ length: 11 }, (_, i) => `id${i}`).join(",");
      assert.equal(reasonOf(eleven), "too_many_studies");
    });

    it("mensaje usa la constante MAX (10)", () => {
      const eleven = Array.from({ length: 11 }, (_, i) => `id${i}`).join(",");
      const r = parseEvolutionIds(eleven);
      assert.equal(r.ok, false);
      if (!r.ok) {
        assert.match(r.message, new RegExp(String(EVOLUTION_MAX_STUDIES)));
      }
    });
  });

  // ── IDs duplicados ────────────────────────────────────
  describe("duplicate_ids", () => {
    it("dos iguales → duplicate_ids", () => {
      assert.equal(reasonOf("same,same"), "duplicate_ids");
    });

    it("repetidos en medio → duplicate_ids", () => {
      assert.equal(reasonOf("a,b,b,c"), "duplicate_ids");
    });

    it("mensaje legible", () => {
      const r = parseEvolutionIds("x,x");
      assert.equal(r.ok, false);
      if (!r.ok) {
        assert.equal(r.message, EVOLUTION_PARSE_MESSAGES.duplicate_ids);
      }
    });
  });

  // ── Casos válidos ─────────────────────────────────────
  describe("válidos", () => {
    it("2 IDs → ok, array de 2", () => {
      const ids = idsOf("a,b");
      assert.deepEqual(ids, ["a", "b"]);
    });

    it("10 IDs → ok, array de 10", () => {
      const ten = Array.from({ length: 10 }, (_, i) => `id${i}`).join(",");
      const ids = idsOf(ten);
      assert.equal(ids?.length, 10);
    });

    it("recorta espacios alrededor de cada parte", () => {
      const ids = idsOf("  a , b , c  ");
      assert.deepEqual(ids, ["a", "b", "c"]);
    });

    it("preserva el orden original de la URL (no ordena)", () => {
      const ids = idsOf("z,a,m");
      assert.deepEqual(ids, ["z", "a", "m"]);
    });

    it("caracteres especiales en IDs se preservan", () => {
      const ids = idsOf("uuid-with-dashes,uuid.with.dots,uuid_with_underscores");
      assert.deepEqual(ids, [
        "uuid-with-dashes",
        "uuid.with.dots",
        "uuid_with_underscores",
      ]);
    });
  });

  // ── Prioridad determinista de motivos ─────────────────
  describe("prioridad determinista", () => {
    it("vacío vence a poco → missing_ids", () => {
      assert.equal(reasonOf(""), "missing_ids");
    });

    it("parte vacía vence a pocos → empty_id", () => {
      assert.equal(reasonOf("a,"), "empty_id");
    });

    it("pocos vence a muchos → not_enough_studies", () => {
      assert.equal(reasonOf("a"), "not_enough_studies");
    });

    it("muchos vence a duplicados → too_many_studies", () => {
      const eleven = Array.from({ length: 11 }, (_, i) => `dup${i % 2}`).join(",");
      // 11 items con duplicados: too_many_studies debe reportarse primero
      assert.equal(reasonOf(eleven), "too_many_studies");
    });
  });
});