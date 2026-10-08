import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const source = readFileSync(new URL("../components/GrowthJourney.tsx", import.meta.url), "utf8");
const ast = ts.createSourceFile("growth.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let component = "";
const selected: string[] = [];
function visit(node: ts.Node) {
  if (ts.isFunctionDeclaration(node) && node.name?.text === "GrowthCurrentStagePill") component = node.getText(ast).replace(/^export /, "");
  if (ts.isPropertyAssignment(node) && ["dayPill", "bloomDayPill", "timelineDayPill", "timelineBloomDayPill", "days", "bloomLotus"].includes(node.name.getText(ast))) selected.push(node.getText(ast));
  ts.forEachChild(node, visit);
}
visit(ast);
assert.ok(component);
const styles = new Function(`return ({${selected.join(",")}});`)();
const compiled = ts.transpileModule(`${component}; return GrowthCurrentStagePill;`, { compilerOptions: { jsx: ts.JsxEmit.React } }).outputText;
const flat = (value: any): any => Array.isArray(value) ? Object.assign({}, ...value.map(flat)) : value ?? {};
const Native = (props: any) => {
  const style = flat(props.style);
  return React.createElement("div", {
    "data-testid": props.testID, "data-background": style.backgroundColor,
    "data-radius": style.borderRadius, "data-border": style.borderColor,
    "data-padding-y": style.paddingVertical, "data-padding-x": style.paddingHorizontal,
    "data-color": style.color, "data-icon": props.name, "data-icon-size": props.size,
  }, props.children);
};

test("Perfil stage shares Tu camino pill styling for Índigo 2 and Cloudy without advancing levels", () => {
  const palette = readFileSync(new URL("../constants/colors.ts", import.meta.url), "utf8");
  const cloudy = palette.match(/CLOUDY_GROWTH_DAY_PILL_BACKGROUND = "([^"]+)"/)![1];
  const levels = readFileSync(new URL("../data/growthLevels.ts", import.meta.url), "utf8");
  const currentName = levels.match(/id: "intencion", name: "([^"]+)"/)![1];
  for (const theme of ["indigo-2", "cloudy"]) {
    const Pill = new Function("React", "View", "Text", "MaterialCommunityIcons", "useColors", "useSceneTheme", "styles", "GROWTH_COLORS", "CLOUDY_GROWTH_DAY_PILL_BACKGROUND", "growthLevels", compiled)(
      React, Native, Native, Native, () => ({ foreground: "#F9F9F9" }), () => ({ theme: { id: theme } }),
      styles, { current: "#E7B95C" }, cloudy, [{ name: currentName }],
    );
    const html = renderToStaticMarkup(React.createElement(Pill));
    assert.match(html, /Intención/);
    assert.ok(html.includes(`data-background="${theme === "cloudy" ? cloudy : styles.dayPill.backgroundColor}"`));
    assert.match(html, /data-radius="12"[^>]*data-border="rgba\(255,255,255,0.10\)"[^>]*data-padding-y="4"[^>]*data-padding-x="9"/);
    assert.match(html, /data-icon="spa" data-icon-size="12"/);
    assert.match(html, /data-color="#F9F9F9"[^>]*>Intención/);
  }
  assert.match(component, /growthLevels\[0\]\.name/);
  assert.doesNotMatch(component, /totalActiveDays|streak|Math\.floor/);
});
