import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import ts from "typescript";
import { getExactTwoCardCarouselCardWidth } from "../constants/carousel.ts";

const source = readFileSync(new URL("../components/SessionCarousel.tsx", import.meta.url), "utf8");
const ast = ts.createSourceFile("SessionCarousel.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const expressions = new Map<string, string>();
let playTop = "", playLeft = "";
function visit(node: ts.Node) {
  if (ts.isVariableDeclaration(node) && node.initializer) {
    expressions.set(node.name.getText(ast), node.initializer.getText(ast));
  }
  if (ts.isPropertyAssignment(node)) {
    const expression = node.initializer.getText(ast);
    if (node.name.getText(ast) === "top" && expression.includes("ambientalFilledImageVisualTop") &&
      expression.includes("ambientalPlayButtonSize")) playTop = expression;
    if (node.name.getText(ast) === "left" && expression.includes("ambientalFilledImageLeft") &&
      expression.includes("ambientalPlayButtonSize")) playLeft = expression;
  }
  ts.forEachChild(node, visit);
}
visit(ast);
const names = [
  "AMBIENTAL_CONTENT_DROP", "AMBIENTAL_IMAGE_EXTRA_DROP", "AMBIENTAL_IMAGE_LIFT", "AMBIENTAL_PLAY_BUTTON_GROWTH",
  "ambientalImageSize", "ambientalImageBottom", "ambientalFillScale",
  "ambientalFilledImageDiameter", "ambientalFilledImageWidth", "ambientalFilledImageHeight",
  "ambientalFilledImageLeft", "ambientalFilledImageTop", "ambientalFilledImageVisualTop",
  "ambientalPlayButtonSize",
];
for (const name of names) assert.ok(expressions.has(name), `Production geometry defines ${name}`);
assert.ok(playTop && playLeft, "Read actual Play placement, not a duplicate test formula");
const measure = new Function("cw", "ch", "ambientalImageLift", "AMBIENTAL_IMAGE_SIZE_REDUCTION",
  names.map(name => `const ${name} = ${expressions.get(name)};`).join("\n") +
  `return { diameter: ambientalFilledImageDiameter, width: ambientalFilledImageWidth,
    height: ambientalFilledImageHeight, left: ambientalFilledImageLeft,
    top: ambientalFilledImageVisualTop, playSize: ambientalPlayButtonSize,
    playTop: ${playTop}, playLeft: ${playLeft} };`,
);

test("Sonidos artwork shrinks exactly 12 logical points without changing card layout", () => {
  assert.equal(expressions.get("AMBIENTAL_IMAGE_SIZE_REDUCTION"), "12");
  for (const viewport of [320, 360, 375, 390, 402, 430, 768, 1024]) {
    const width = getExactTwoCardCarouselCardWidth(viewport, 16, 10, 2);
    const previous = measure(width, width + 60, 9, 0);
    const current = measure(width, width + 60, 9, 12);
    for (const dimension of ["diameter", "width", "height"]) {
      assert.ok(Math.abs(previous[dimension] - current[dimension] - 12) < 1e-9);
    }
    assert.ok(Math.abs(current.left + current.width / 2 - width / 2) < 1e-9);
    assert.ok(Math.abs(current.top + current.height / 2 - previous.top - previous.height / 2) < 1e-9);
    assert.ok(current.diameter > 0);
  }
});

test("Play follows the resized circle's bottom edge while retaining its size and horizontal center", () => {
  for (const width of [100, 140, 170, 200, 350, 490]) {
    const previous = measure(width, width + 60, 9, 0);
    const current = measure(width, width + 60, 9, 12);
    assert.equal(current.playSize, previous.playSize);
    assert.ok(Math.abs(current.playTop + current.playSize / 2 - current.top - current.height) < 1e-9);
    assert.ok(Math.abs(current.playLeft + current.playSize / 2 - width / 2) < 1e-9);
    assert.ok(Math.abs(current.playTop - previous.playTop + 6) < 1e-9);
  }
});