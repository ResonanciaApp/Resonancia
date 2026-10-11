import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import { test } from "node:test";

const avatarSource = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
function styleBlock(source: string, name: string) {
  const block = source.match(new RegExp(`\\b${name}:\\s*(\\{[^}]*\\})`));
  assert.ok(block, `Missing style ${name}`);
  return block[1];
}
function styleNumber(source: string, name: string, property: string) {
  const value = styleBlock(source, name).match(new RegExp(`\\b${property}:\\s*([\\d.]+)`));
  assert.ok(value, `Missing ${name}.${property}`);
  return Number(value[1]);
}

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
    for (const rule of ['position: "absolute"', "right: 0", "top: 20", "width: 43", "height: 43", "borderRadius: 21.5", "borderWidth: 0"]) {
      assert.ok(buttonStyle.includes(rule), rule);
    }
    const closeStyle = source.slice(source.indexOf("  coverCloseButton: {")).split("  },")[0];
    assert.match(closeStyle, /left: 0/);
    assert.doesNotMatch(closeStyle, /right:/);
    assert.doesNotMatch(buttonStyle, /left:/);
    assert.match(source, /ImagePicker\.launchImageLibraryAsync/);
  });

  test(`${screen}: title, icons, hero and grid share avatar cover vertical spacing with a white 10% handle`, () => {
    const source = readFileSync(new URL(`../app/${screen}/[id].tsx`, import.meta.url), "utf8");
    for (const property of ["minHeight", "paddingTop"]) {
      assert.equal(styleNumber(source, "coverHeader", property), styleNumber(avatarSource, "accountCoverHeader", property));
    }
    for (const [name, reference] of [
      ["coverCloseButton", "accountCoverUploadButton"],
      ["coverUploadButton", "accountCoverUploadButton"],
    ]) {
      for (const property of ["top", "width", "height"]) {
        assert.equal(styleNumber(source, name, property), styleNumber(avatarSource, reference, property));
      }
    }
    for (const property of ["height", "marginTop"]) {
      assert.equal(styleNumber(source, "selectedPreviewSlot", property), styleNumber(avatarSource, "accountCoverPreviewSlot", property));
    }
    assert.match(styleBlock(source, "handle"), /backgroundColor:\s*"rgba\(255,255,255,0\.1\)"/);
    for (const property of ["marginTop", "marginBottom", "height"]) {
      assert.equal(styleNumber(source, "handle", property), styleNumber(avatarSource, "accountCoverHandle", property));
    }
    const gridStart = styleNumber(source, "handle", "marginTop") + styleNumber(source, "handle", "height")
      + styleNumber(source, "handle", "marginBottom") + styleNumber(source, "coverHeader", "minHeight")
      + styleNumber(source, "selectedPreviewSlot", "marginTop") + styleNumber(source, "selectedPreviewSlot", "height");
    assert.equal(gridStart, 261);
  });
}
