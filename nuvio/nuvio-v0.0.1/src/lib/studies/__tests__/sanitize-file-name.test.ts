import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  sanitizeStorageFileName,
  DEFAULT_MAX_FILENAME_LENGTH,
} from "../sanitize-file-name.ts";

/**
 * Tests de sanitizeStorageFileName (F5).
 *
 * El nombre saneado se usa como SEGUNDO segmento del path de Storage:
 * {user_id}/{study_id}/{sanitized_filename}. user_id y study_id vienen del
 * servidor; solo el filename pasa por este helper.
 */
describe("sanitizeStorageFileName — F5", () => {
  it("A. filename normal se conserva", () => {
    assert.equal(sanitizeStorageFileName("analisis.pdf"), "analisis.pdf");
  });

  it("B. filename con ../ pierde el traversal (se queda el basename)", () => {
    assert.equal(sanitizeStorageFileName("../../otro.pdf"), "otro.pdf");
  });

  it("C. filename con ../../ colapsa a un nombre seguro sin traversal", () => {
    const out = sanitizeStorageFileName("../../");
    assert.ok(!out.includes(".."));
    assert.ok(out.length > 0);
  });

  it("D. filename con / (carpeta) se reduce al basename", () => {
    assert.equal(sanitizeStorageFileName("carpeta/archivo.pdf"), "archivo.pdf");
  });

  it("E. filename con backslash \\ se reduce al basename", () => {
    assert.equal(sanitizeStorageFileName("carpeta\\\\archivo.pdf"), "archivo.pdf");
  });

  it("F. filename extremadamente largo se trunca de forma segura", () => {
    const longName = "a".repeat(500) + ".pdf";
    const out = sanitizeStorageFileName(longName);
    assert.ok(out.length <= DEFAULT_MAX_FILENAME_LENGTH);
    assert.equal(out.length, DEFAULT_MAX_FILENAME_LENGTH);
    assert.ok(out.endsWith(".pdf"));
  });

  it("G. filename vacío o extraño cae en un fallback determinista", () => {
    assert.equal(sanitizeStorageFileName(""), "archivo");
    assert.equal(sanitizeStorageFileName("..."), "archivo");
    assert.equal(sanitizeStorageFileName("   "), "archivo");
    // Caracteres de control se eliminan (hex escapes en el fuente).
    const withControl = "informe\x00\x1fmedico.pdf";
    assert.equal(sanitizeStorageFileName(withControl), "informemedico.pdf");
  });

  it("H. PDF normal conserva la extensión", () => {
    const out = sanitizeStorageFileName("Informe_Medico_2026.pdf");
    assert.equal(out, "Informe_Medico_2026.pdf");
    assert.ok(out.endsWith(".pdf"));
  });

  it("I. nombres distintos no colisionan; el upload usa upsert:false (sin overwrite)", () => {
    const a = sanitizeStorageFileName("informe.pdf");
    const b = sanitizeStorageFileName("resultados.pdf");
    assert.notEqual(a, b);
    assert.equal(a, "informe.pdf");
    assert.equal(b, "resultados.pdf");

    // El helper es determinista (sin sufijos aleatorios): la protección ante
    // una eventual colisión de nombres saneados recae en `upsert: false`
    // del upload, que falla en vez de sobrescribir. Aquí verificamos que
    // basenames distintos no se colapsen accidentalmente.
    assert.equal(sanitizeStorageFileName("informe.pdf"), "informe.pdf");
    assert.equal(sanitizeStorageFileName("carpeta/informe.pdf"), "informe.pdf");
  });
});
