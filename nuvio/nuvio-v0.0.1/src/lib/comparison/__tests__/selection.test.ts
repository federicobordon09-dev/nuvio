import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  initialSelectionState,
  addSelection,
  removeSelection,
  toggleSelection,
  clearSelection,
  canCompare,
  getCompareUrl,
  getSelectionLabel,
  getCompareButtonLabel,
  isSelected,
  getSelectionIndex,
} from "../selection.ts";

const idA = "study-A";
const idB = "study-B";
const idC = "study-C";

describe("selection logic", () => {
  describe("addSelection", () => {
    it("agrega el primer ID", () => {
      const s = addSelection(initialSelectionState, idA);
      assert.deepEqual(s.selectedIds, [idA]);
      assert.equal(s.lastAddedId, idA);
    });

    it("agrega el segundo ID", () => {
      const s1 = addSelection(initialSelectionState, idA);
      const s2 = addSelection(s1, idB);
      assert.deepEqual(s2.selectedIds, [idA, idB]);
      assert.equal(s2.lastAddedId, idB);
    });

    it("no agrega un tercero (límite de 2)", () => {
      const s1 = addSelection(initialSelectionState, idA);
      const s2 = addSelection(s1, idB);
      const s3 = addSelection(s2, idC);
      assert.deepEqual(s3.selectedIds, [idA, idB]);
    });

    it("no duplica un ID ya seleccionado", () => {
      const s1 = addSelection(initialSelectionState, idA);
      const s2 = addSelection(s1, idA);
      assert.deepEqual(s2.selectedIds, [idA]);
    });
  });

  describe("removeSelection", () => {
    it("quita un ID seleccionado", () => {
      const s1 = addSelection(initialSelectionState, idA);
      const s2 = addSelection(s1, idB);
      const s3 = removeSelection(s2, idA);
      assert.deepEqual(s3.selectedIds, [idB]);
    });

    it("quita el último ID → vacío", () => {
      const s1 = addSelection(initialSelectionState, idA);
      const s2 = removeSelection(s1, idA);
      assert.deepEqual(s2.selectedIds, []);
    });

    it("quita ID no seleccionado → sin cambios", () => {
      const s1 = addSelection(initialSelectionState, idA);
      const s2 = removeSelection(s1, idB);
      assert.deepEqual(s2.selectedIds, [idA]);
    });
  });

  describe("toggleSelection", () => {
    it("agrega si no estaba", () => {
      const s = toggleSelection(initialSelectionState, idA);
      assert.deepEqual(s.selectedIds, [idA]);
    });

    it("quita si ya estaba", () => {
      const s1 = addSelection(initialSelectionState, idA);
      const s2 = toggleSelection(s1, idA);
      assert.deepEqual(s2.selectedIds, []);
    });
  });

  describe("clearSelection", () => {
    it("vacía la selección", () => {
      const s = addSelection(initialSelectionState, idA);
      assert.deepEqual(s.selectedIds, [idA]);
      const cleared = clearSelection();
      assert.deepEqual(cleared.selectedIds, []);
      assert.equal(cleared.lastAddedId, null);
    });
  });

  describe("canCompare", () => {
    it("false con 0", () => {
      assert.equal(canCompare(initialSelectionState), false);
    });
    it("false con 1", () => {
      const s = addSelection(initialSelectionState, idA);
      assert.equal(canCompare(s), false);
    });
    it("true con 2", () => {
      const s1 = addSelection(initialSelectionState, idA);
      const s2 = addSelection(s1, idB);
      assert.equal(canCompare(s2), true);
    });
    it("false con >2 (no debería ocurrir)", () => {
      const s = { selectedIds: [idA, idB, idC], lastAddedId: idC };
      assert.equal(canCompare(s), false);
    });
  });

  describe("getCompareUrl", () => {
    it("null si no hay 2", () => {
      assert.equal(getCompareUrl(initialSelectionState), null);
      assert.equal(getCompareUrl(addSelection(initialSelectionState, idA)), null);
    });

    it("URL con IDs en orden de selección (A,B)", () => {
      const s1 = addSelection(initialSelectionState, idA);
      const s2 = addSelection(s1, idB);
      assert.equal(getCompareUrl(s2), "/dashboard/comparar?ids=study-A,study-B");
    });

    it("orden preservado: primero seleccionado = A", () => {
      const s1 = addSelection(initialSelectionState, idB);
      const s2 = addSelection(s1, idA);
      assert.equal(getCompareUrl(s2), "/dashboard/comparar?ids=study-B,study-A");
    });
  });

  describe("getSelectionLabel", () => {
    it("0 seleccionados", () => {
      assert.equal(getSelectionLabel(initialSelectionState), "Ningún estudio seleccionado");
    });
    it("1 seleccionado", () => {
      const s = addSelection(initialSelectionState, idA);
      assert.match(getSelectionLabel(s), /1 estudio seleccionado/);
      assert.match(getSelectionLabel(s), /seleccioná 1 más/);
    });
    it("2 seleccionados", () => {
      const s1 = addSelection(initialSelectionState, idA);
      const s2 = addSelection(s1, idB);
      assert.match(getSelectionLabel(s2), /2 estudios seleccionados/);
      assert.match(getSelectionLabel(s2), /listos para comparar/);
    });
  });

  describe("getCompareButtonLabel", () => {
    it("pide seleccionar con 0/1", () => {
      assert.equal(getCompareButtonLabel(initialSelectionState), "Seleccioná 2 estudios");
      assert.equal(getCompareButtonLabel(addSelection(initialSelectionState, idA)), "Seleccioná 2 estudios");
    });
    it("muestra Comparar con 2", () => {
      const s1 = addSelection(initialSelectionState, idA);
      const s2 = addSelection(s1, idB);
      assert.equal(getCompareButtonLabel(s2), "Comparar estudios");
    });
  });

  describe("isSelected", () => {
    it("true para IDs seleccionados", () => {
      const s1 = addSelection(initialSelectionState, idA);
      assert.equal(isSelected(s1, idA), true);
    });
    it("false para IDs no seleccionados", () => {
      const s1 = addSelection(initialSelectionState, idA);
      assert.equal(isSelected(s1, idB), false);
    });
  });

  describe("getSelectionIndex", () => {
    it("0 = anterior, 1 = posterior", () => {
      const s1 = addSelection(initialSelectionState, idA);
      const s2 = addSelection(s1, idB);
      assert.equal(getSelectionIndex(s2, idA), 0);
      assert.equal(getSelectionIndex(s2, idB), 1);
    });
    it("-1 si no seleccionado", () => {
      const s1 = addSelection(initialSelectionState, idA);
      assert.equal(getSelectionIndex(s1, idB), -1);
    });
  });
});