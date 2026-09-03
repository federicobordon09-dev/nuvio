import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  userMessageInputSchema,
  conversationTitleSchema,
  MAX_MESSAGE_LENGTH,
  MAX_CONVERSATION_TITLE_LENGTH,
  MAX_CONTEXT_STUDIES,
} from "../schema.ts";

describe("userMessageInputSchema", () => {
  it("mensaje válido → pasa y recorta", () => {
    const r = userMessageInputSchema.safeParse({ content: "  Hola doctor  " });
    assert.equal(r.success, true);
    if (r.success) assert.equal(r.data.content, "Hola doctor");
  });

  it("mensaje vacío → rechazado", () => {
    const r = userMessageInputSchema.safeParse({ content: "" });
    assert.equal(r.success, false);
  });

  it("mensaje solo espacios → rechazado", () => {
    const r = userMessageInputSchema.safeParse({ content: "   " });
    assert.equal(r.success, false);
  });

  it("mensaje que no es string → rechazado", () => {
    const r = userMessageInputSchema.safeParse({ content: 123 });
    assert.equal(r.success, false);
  });

  it("mensaje demasiado largo → rechazado", () => {
    const r = userMessageInputSchema.safeParse({
      content: "a".repeat(MAX_MESSAGE_LENGTH + 1),
    });
    assert.equal(r.success, false);
  });
});

describe("conversationTitleSchema", () => {
  it("título válido → pasa", () => {
    const r = conversationTitleSchema.safeParse("Mi conversación");
    assert.equal(r.success, true);
  });

  it("título vacío → rechazado", () => {
    const r = conversationTitleSchema.safeParse("   ");
    assert.equal(r.success, false);
  });

  it("título demasiado largo → rechazado", () => {
    const r = conversationTitleSchema.safeParse(
      "a".repeat(MAX_CONVERSATION_TITLE_LENGTH + 1)
    );
    assert.equal(r.success, false);
  });
});

describe("límites de configuración", () => {
  it("MAX_CONTEXT_STUDIES es razonable (10)", () => {
    assert.equal(MAX_CONTEXT_STUDIES, 10);
  });
});
