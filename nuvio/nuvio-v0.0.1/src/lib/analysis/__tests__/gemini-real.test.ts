import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { analyzeStudyText } from "../gemini.ts";

/**
 * Prueba real contra Gemini con texto médico SINTÉTICO.
 *
 * Requiere GEMINI_API_KEY en el entorno.
 * Si no está disponible, el test se skipea.
 */

const SYNTHETIC_MEDICAL_TEXT = `Paciente ficticio de 45 años.
Análisis de sangre completo.
Glucosa: 123 mg/dL. Rango de referencia: 70-110 mg/dL.
Hemoglobina: 14.2 g/dL. Rango de referencia: 13.0-17.0 g/dL.
Colesterol total: 190 mg/dL. Rango de referencia: menor a 200 mg/dL.
Triglicéridos: 150 mg/dL. Rango de referencia: menor a 150 mg/dL.
Creatinina: 0.9 mg/dL. Rango de referencia: 0.7-1.3 mg/dL.`;

describe("Prueba real contra Gemini (texto sintético)", { skip: !process.env.GEMINI_API_KEY }, () => {
  it("devuelve un StudyAnalysis válido a partir de texto médico ficticio", async () => {
    const analysis = await analyzeStudyText(SYNTHETIC_MEDICAL_TEXT);

    // Verificar estructura básica
    assert.equal(typeof analysis.summary, "string");
    assert.ok(analysis.summary.length > 0);
    assert.equal(typeof analysis.document_type, "string");
    assert.ok(analysis.document_type.length > 0);

    // Verificar que tiene key_findings
    assert.ok(Array.isArray(analysis.key_findings));
    assert.ok(analysis.key_findings.length > 0);

    // Verificar cada finding
    for (const finding of analysis.key_findings) {
      assert.equal(typeof finding.title, "string");
      assert.ok(finding.title.length > 0);
      assert.equal(typeof finding.value, "string");
      assert.ok(finding.value.length > 0);
      assert.equal(typeof finding.explanation, "string");
      assert.ok(finding.explanation.length > 0);
      assert.ok(
        ["normal", "high", "low", "abnormal", "unknown"].includes(
          finding.status
        )
      );
    }

    // Verificar arrays
    assert.ok(Array.isArray(analysis.observations));
    assert.ok(Array.isArray(analysis.warnings));
    assert.ok(Array.isArray(analysis.recommendations));
    assert.ok(Array.isArray(analysis.limitations));

    // Verificar que la glucosa fue detectada como high (123 > 110)
    const glucose = analysis.key_findings.find(
      (f) => f.title.toLowerCase().includes("glucosa")
    );
    assert.ok(glucose, "Debería encontrar un hallazgo de glucosa");
    assert.equal(glucose.status, "high");

    // Verificar que la hemoglobina fue detectada como normal
    const hemoglobin = analysis.key_findings.find(
      (f) => f.title.toLowerCase().includes("hemoglobina")
    );
    assert.ok(hemoglobin, "Debería encontrar un hallazgo de hemoglobina");
    assert.equal(hemoglobin.status, "normal");
  });
});
