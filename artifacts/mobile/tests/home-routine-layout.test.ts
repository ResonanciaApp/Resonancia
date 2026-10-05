import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { URL } from "node:url";
import ts from "typescript";

const home = readFileSync(new URL("../app/(tabs)/inicio8.tsx", import.meta.url), "utf8");

test("Inicio no longer mounts Mi rutina expansiva, while Perfil retains the shared functional section", () => {
  assert.doesNotMatch(home, /MiRutinaSection|Mi rutina expansiva/);
  assert.doesNotMatch(home, /HomeReflectionWallSection|Mi muro expansivo|wallSectionRef|composingReflection|ReflectionSavedBanner/);
  const profile = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
  assert.match(profile, /import \{ MiRutinaSection \} from "@\/components\/MiRutinaSection"/);
  assert.equal((profile.match(/<MiRutinaSection /g) ?? []).length, 1);
  assert.match(home, /SHOW_CONTINUE_LISTENING && continueSession/);
  assert.match(home, /title="Populares"/);
  const parsed = ts.transpileModule(home, {
    reportDiagnostics: true,
    compilerOptions: { jsx: ts.JsxEmit.React },
  });
  assert.deepEqual(parsed.diagnostics?.filter(d => d.category === ts.DiagnosticCategory.Error), []);
});

test("wall-writing shortcuts now target Perfil and retain the compose request", () => {
  const drawer = readFileSync(new URL("../components/DrawerMenu.tsx", import.meta.url), "utf8");
  const wall = readFileSync(new URL("../app/mi-espacio-interior.tsx", import.meta.url), "utf8");
  assert.match(drawer, /route === "__profile_compose"[\s\S]*?requestWallCompose\(\);\s*router\.push\("\/\(tabs\)\/profile"/);
  assert.match(wall, /requestWallCompose\(\);\s*router\.replace\("\/\(tabs\)\/profile"\)/);
  const profile = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
  assert.match(profile, /<ProfileReflectionWallSection/);
});