import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { URL } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const home = readFileSync(new URL("../app/(tabs)/inicio8.tsx", import.meta.url), "utf8");

test("Inicio mounts the existing functional routine in the former wall slot, with no duplicate wall composer", () => {
  assert.match(home, /import \{ MiRutinaSection \} from "@\/components\/MiRutinaSection"/);
  assert.equal((home.match(/<MiRutinaSection/g) ?? []).length, 1);
  assert.doesNotMatch(home, /HomeReflectionWallSection|Mi muro expansivo|wallSectionRef|composingReflection|ReflectionSavedBanner/);
  const routineAt = home.indexOf("<MiRutinaSection");
  assert.ok(routineAt > home.indexOf("SHOW_CONTINUE_LISTENING && continueSession"));
  assert.ok(routineAt < home.indexOf('title="Populares"', routineAt));

  const section = home.match(/\{isInicio2 && \(\s*(<MiRutinaSection[\s\S]*?\/>)\s*\)\}/)?.[1];
  assert.ok(section, "the routine inherits the same Inicio variant gate as the removed wall");
  const compiled = ts.transpileModule(`return isInicio2 ? (${section}) : null;`, {
    compilerOptions: { jsx: ts.JsxEmit.React },
  }).outputText;
  let receivedStyle: Record<string, number> | undefined;
  const Routine = ({ style }: { style: Record<string, number> }) => {
    receivedStyle = style;
    return React.createElement("div", { "data-testid": "mi-rutina-section" }, "Mi rutina expansiva");
  };
  const render = new Function("React", "MiRutinaSection", "GRID_PAD", "isInicio2", compiled);
  const gridPad = Number(home.match(/const GRID_PAD = (\d+);/)?.[1]);
  assert.ok(Number.isFinite(gridPad));
  assert.match(renderToStaticMarkup(render(React, Routine, gridPad, true)), /Mi rutina expansiva/);
  assert.deepEqual(receivedStyle, { marginHorizontal: gridPad, marginBottom: 32 });
  assert.equal(render(React, Routine, gridPad, false), null);
});

test("wall-writing shortcuts now target Perfil and retain the compose request", () => {
  const drawer = readFileSync(new URL("../components/DrawerMenu.tsx", import.meta.url), "utf8");
  const wall = readFileSync(new URL("../app/mi-espacio-interior.tsx", import.meta.url), "utf8");
  assert.match(drawer, /route === "__profile_compose"[\s\S]*?requestWallCompose\(\);\s*router\.push\("\/\(tabs\)\/profile"/);
  assert.match(wall, /requestWallCompose\(\);\s*router\.replace\("\/\(tabs\)\/profile"\)/);
  const profile = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
  assert.match(profile, /<ProfileReflectionWallSection/);
});