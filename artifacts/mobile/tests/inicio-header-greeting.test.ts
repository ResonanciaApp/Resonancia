import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("the greeting below Home username uses the same F4F4F4 in every theme", () => {
  const source = readFileSync(new URL("../app/(tabs)/inicio8.tsx", import.meta.url), "utf8");
  const body = source.match(/inicio3HeroDecree: \{([\s\S]*?)\n  \}/)?.[1];
  assert.ok(body);
  const style = new Function(`return ({${body}});`)();
  assert.equal(style.color, "#F4F4F4");
  const greeting = source.match(/<Text style=\{styles\.inicio3HeroDecree\}[\s\S]*?<\/Text>/)?.[0];
  assert.ok(greeting);
  assert.match(greeting, /\{greeting\}/);
  assert.equal(style.fontSize, 13);
  assert.equal(style.fontWeight, "600");
});
