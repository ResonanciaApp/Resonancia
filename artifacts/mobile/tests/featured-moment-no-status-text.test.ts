import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { URL } from "node:url";
import ts from "typescript";

for (const screen of ["inicio8", "explore"]) {
  test(`${screen}: Para este momento loads normally without showing loading or refresh messages`, () => {
    const source = readFileSync(new URL(`../app/(tabs)/${screen}.tsx`, import.meta.url), "utf8");
    assert.match(source, /const \{ session: featuredMoment \} =\s*useFeaturedMoment\(\)/);
    assert.doesNotMatch(source, /featuredMomentStatus|Actualizando selección diaria/);
    assert.match(source, /Para este momento/);
    assert.match(source, /featuredMoment\.title/);
    assert.match(source, /featuredMoment\.categoryLabel/);
    assert.match(source, /styles\.heroAuthor/);
    assert.match(source, /\{authorName\}/);
    const result = ts.transpileModule(source, {
      reportDiagnostics: true,
      compilerOptions: { jsx: ts.JsxEmit.React },
    });
    assert.deepEqual(result.diagnostics?.filter(d => d.category === ts.DiagnosticCategory.Error), []);
  });
}