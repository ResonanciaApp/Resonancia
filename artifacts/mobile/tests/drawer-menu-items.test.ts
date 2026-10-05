import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { URL } from "node:url";

test("the drawer hides Diario without removing its screen or neighboring menu items", () => {
  const source = readFileSync(new URL("../components/DrawerMenu.tsx", import.meta.url), "utf8");
  const sections = source.match(/const INICIO3_SECTIONS[\s\S]*?\n\];/)?.[0];
  assert.ok(sections);
  assert.doesNotMatch(sections, /id: "journal"|label: "Diario"|__overlay:\/diario/);
  for (const id of ["premium", "favorites", "library", "history", "downloads", "notifications", "mixer", "breathing", "mood-register"]) {
    assert.ok(sections.includes(`id: "${id}"`), `Missing neighboring drawer item: ${id}`);
  }
  assert.ok(existsSync(new URL("../app/diario.tsx", import.meta.url)));
});

test("mixer, breathing exercises and mood register follow notifications in the same standard-spaced menu group, without Herramientas", () => {
  const source = readFileSync(new URL("../components/DrawerMenu.tsx", import.meta.url), "utf8");
  const sections = source.match(/const INICIO3_SECTIONS[\s\S]*?\n\];/)?.[0];
  assert.ok(sections);
  assert.doesNotMatch(sections, /Herramientas/);
  assert.equal((sections.match(/items: \[/g) ?? []).length, 1);
  assert.match(sections, /title: null/);
  const ids = Array.from(sections.matchAll(/id: "([^"]+)"/g), match => match[1]);
  assert.deepEqual(ids.slice(ids.indexOf("notifications")), ["notifications", "mixer", "breathing", "mood-register"]);
  assert.match(sections, /id: "mixer", label: "Mezclador"[^}]*route: "__mixer"/);
  assert.match(sections, /id: "breathing", label: "Respiración"[^}]*route: "\/respiracion"/);
  assert.match(sections, /id: "mood-register"[^}]*route: "__mood_picker"/);
  assert.match(source, /itemGroup: \{ gap: 2, marginTop: 10 \}/);
  assert.match(source, /section\.items\.map\(\(item\) => \([\s\S]*?style=\{styles\.item\}/);
  assert.match(source, /item: \{[\s\S]*?paddingVertical: 6\.5,/);
});