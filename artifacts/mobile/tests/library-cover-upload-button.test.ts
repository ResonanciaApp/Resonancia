import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

for (const screen of ["playlist", "mi-mezcla"]) {
  test(`${screen}: portada tiene botón de imagen en el header y conserva el selector de fotos`, () => {
    const source = readFileSync(new URL(`../app/${screen}/[id].tsx`, import.meta.url), "utf8");
    const header = source.slice(source.indexOf("<View style={"), source.indexOf("  coverUploadButton: {"));
    const coverHeader = header.slice(header.indexOf(".coverHeader}>"), header.indexOf(".selectedPreviewSlot}>"));
    assert.match(coverHeader, /coverUploadButton/);
    assert.match(coverHeader, /onPickImage\(onClose\)/);
    assert.match(coverHeader, /name="image" size=\{18\} color=\{TEXT\}/);
    assert.doesNotMatch(source, /uploadPill|>Agregar imagen</);
    const buttonStyle = source.slice(source.indexOf("  coverUploadButton: {")).split("  },")[0];
    for (const rule of ['position: "absolute"', "left: 0", "width: 43", "height: 43", "borderRadius: 21.5", "borderWidth: 0"]) {
      assert.ok(buttonStyle.includes(rule), rule);
    }
    assert.match(source, /ImagePicker\.launchImageLibraryAsync/);
  });
}
