import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

/**
 * Tests de contenido para las migrations de hardening de RLS (F1 y F2).
 *
 * Las policies se definen en SQL y no pueden ejecutarse sin un Postgres
 * real, por lo que estos tests verifican estáticamente que las migrations
 * codifican las propiedades de seguridad requeridas:
 *
 *  - F1: INSERT de study_extractions valida el ownership del estudio.
 *  - F2: UPDATE de study_extractions y study_analyses valida el ownership
 *        de la fila Y del estudio referenciado (USING + WITH CHECK).
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "..", "..", "..", "..", "supabase", "migrations");

function readMigration(name: string): string {
  return readFileSync(join(migrationsDir, name), "utf8");
}

/**
 * Extrae un bloque `create policy "NAME" ... );` completo del SQL.
 * Las policies terminan siempre con un `);` al final de la cláusula.
 */
function extractPolicy(sql: string, name: string): string {
  const start = sql.indexOf(`create policy "${name}"`);
  assert.notEqual(start, -1, `no se encontró create policy "${name}"`);
  const block = sql.slice(start);
  // La policy termina en el primer `\n  );` que cierra el WITH CHECK (o USING).
  const end = block.indexOf("\n  );");
  assert.notEqual(end, -1, `no se encontró el cierre de la policy "${name}"`);
  return block.slice(0, end);
}

// ── F1: study_extractions INSERT ──────────────────────────────

const f1 = readMigration("20260906000000_harden_study_extractions_insert.sql");
const f1Insert = extractPolicy(f1, "Users can insert own study extractions");

describe("F1 — hardening INSERT de study_extractions", () => {
  it("A. permite insertar una extracción para un study propio (exists + ownership)", () => {
    assert.match(f1Insert, /exists\s*\(\s*select 1 from public\.studies/i);
    assert.match(f1Insert, /studies\.id\s*=\s*study_extractions\.study_id/i);
    assert.match(f1Insert, /studies\.user_id\s*=\s*auth\.uid\(\)/i);
  });

  it("B. NO permite insertar una extracción apuntando al study de otro usuario", () => {
    // La subconsulta exige que el estudio pertenezca al usuario autenticado.
    assert.match(f1Insert, /studies\.user_id\s*=\s*auth\.uid\(\)/i);
    assert.match(f1Insert, /exists/i);
  });

  it("C. NO permite falsificar user_id (auth.uid() = user_id en WITH CHECK)", () => {
    assert.match(f1Insert, /with check\s*\(/i);
    assert.match(f1Insert, /auth\.uid\(\)\s*=\s*user_id/i);
  });

  it("D. conserva el funcionamiento normal para el propio usuario", () => {
    assert.match(f1Insert, /for insert\b/i);
    assert.match(f1Insert, /to authenticated/i);
    assert.match(f1Insert, /auth\.uid\(\)\s*=\s*user_id/i);
    // La policy previa insegura (sin exists) debe haber sido eliminada.
    assert.match(
      f1,
      /drop policy if exists\s+"Users can insert own study extractions"/i
    );
  });
});

// ── F2: UPDATE de study_extractions y study_analyses ─────────

const f2 = readMigration("20260906000001_harden_update_policies.sql");
const f2Extractions = extractPolicy(f2, "Users can update own study extractions");
const f2Analyses = extractPolicy(f2, "Users can update own study analyses");

describe("F2 — hardening UPDATE de study_extractions", () => {
  it("A. UPDATE de extraction propia + study propio → permitido (exists en USING y WITH CHECK)", () => {
    assert.match(f2Extractions, /for update\b/i);
    assert.match(f2Extractions, /using\s*\(/i);
    assert.match(f2Extractions, /with check\s*\(/i);
    assert.equal((f2Extractions.match(/exists/gi) ?? []).length, 2); // USING + WITH CHECK
    assert.match(f2Extractions, /studies\.id\s*=\s*study_extractions\.study_id/i);
  });

  it("B. NO permite apuntar extraction propia a un study ajeno", () => {
    assert.match(f2Extractions, /studies\.user_id\s*=\s*auth\.uid\(\)/i);
  });

  it("E. NO permite modificar filas de otro usuario (auth.uid() = user_id)", () => {
    assert.match(f2Extractions, /auth\.uid\(\)\s*=\s*user_id/i);
  });

  it("la policy previa insegura fue eliminada antes de recrearse", () => {
    assert.match(
      f2,
      /drop policy if exists\s+"Users can update own study extractions"/i
    );
  });
});

describe("F2 — hardening UPDATE de study_analyses", () => {
  it("C. UPDATE de analysis propia + study propio → permitido (exists en USING y WITH CHECK)", () => {
    assert.match(f2Analyses, /for update\b/i);
    assert.match(f2Analyses, /using\s*\(/i);
    assert.match(f2Analyses, /with check\s*\(/i);
    assert.equal((f2Analyses.match(/exists/gi) ?? []).length, 2); // USING + WITH CHECK
    assert.match(f2Analyses, /studies\.id\s*=\s*study_analyses\.study_id/i);
  });

  it("D. NO permite apuntar analysis propia a un study ajeno", () => {
    assert.match(f2Analyses, /studies\.user_id\s*=\s*auth\.uid\(\)/i);
  });

  it("E. NO permite modificar filas de otro usuario (auth.uid() = user_id)", () => {
    assert.match(f2Analyses, /auth\.uid\(\)\s*=\s*user_id/i);
  });

  it("la policy previa insegura fue eliminada antes de recrearse", () => {
    assert.match(
      f2,
      /drop policy if exists\s+"Users can update own study analyses"/i
    );
  });
});
