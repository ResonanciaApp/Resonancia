import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import test from "node:test";
import ts from "typescript";

const source = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
function style(file: string, name: string) {
  const ast = ts.createSourceFile(file, source(file), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let result: Record<string, string | number> | undefined;
  function visit(node: ts.Node) {
    if (ts.isPropertyAssignment(node) && node.name.getText(ast) === name && ts.isObjectLiteralExpression(node.initializer)) {
      result = Object.fromEntries(node.initializer.properties.filter(ts.isPropertyAssignment).map(prop => {
        const value = prop.initializer;
        return [prop.name.getText(ast), ts.isStringLiteral(value) ? value.text
          : ts.isNumericLiteral(value) ? Number(value.text) : value.getText(ast)];
      }));
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(result, `Missing style ${file}:${name}`);
  return result;
}

test("Inicio routine activity cards use 16% black without changing completion feedback or the shared calendar theme", () => {
  const routine = source("components/MiRutinaSection.tsx");
  assert.match(routine, /styles\.activityCard,\s*\{ backgroundColor: cardBackgroundColor \?\? "rgba\(0,0,0,0\.16\)" \}/);
  assert.match(routine, /styles\.completionOverlay,\s*completionOverlayStyle,[\s\S]*?<RoutineGradientFill \/>/);
  assert.match(routine, /onPress=\{completeFromTicket\}/);
  assert.match(source("hooks/useRoutineTheme.ts"), /surface: "rgba\(191,207,255,0\.096\)"/);
});

test("Inicio lotus surface is 16% black and borderless while retaining its dimensions and precedence", () => {
  const file = "app/(tabs)/inicio8.tsx";
  const surface = style(file, "inicio3HeroLotusSurface");
  assert.equal(surface.backgroundColor, "rgba(0,0,0,0.16)");
  assert.equal(surface.borderWidth, 0);
  assert.equal(surface.borderColor, "transparent");
  assert.equal(surface.height, 39);
  assert.equal(surface.borderRadius, 19.5);
  assert.match(source(file), /styles\.inicio3ProfileLotusContent, styles\.inicio3HeroLotusSurface/);
});

test("Actualizar recomendaciones is borderless without changing its background, spacing or refresh action", () => {
  const file = "components/DailyRecommendationsSection.tsx";
  const button = style(file, "refreshButton");
  assert.equal(button.borderWidth, 0);
  assert.equal(button.borderColor, "transparent");
  assert.equal(button.backgroundColor, "rgba(0,0,0,0.16)");
  assert.equal(button.paddingVertical, 14);
  assert.equal(button.borderRadius, 20);
  assert.match(source(file), /onPress=\{refreshRecommendations\}/);
});