import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

function load(path: string): any {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const exported: any = {};
  new Function("exports", "require", output)(exported, (name: string) => {
    if (name === "@/data/default-playlist-covers") {
      return { PLAYLIST_COVER_PRESETS: [{ id: "mist-forest", source: 42 }] };
    }
    if (name === "@/data/tags") return load("../data/tags.ts");
    if (name === "@/data/sonidos-tags") return load("../data/sonidos-tags.ts");
    if (name.startsWith("@/assets/")) return 42;
    throw new Error(`Unexpected dependency: ${name}`);
  });
  return exported;
}

test("Prueba Maestra 1 is absent offline and cannot return from a stale catalog snapshot", () => {
  const sessions = load("../data/sessions.ts");
  assert.equal(sessions.getSessionById("29"), undefined);
  const retained = sessions.getSessionById("30");
  assert.equal(retained.title, "Prueba Maestra 2");
  sessions.applyCatalogSnapshot([{ ...retained, id: "29", title: "Prueba Maestra 1" }]);
  assert.equal(sessions.getSessionById("29"), undefined);
  assert.equal(sessions.getSessionById("30").title, "Prueba Maestra 2");
});

test("Retired session is removed from seeds and audio references without removing Prueba Maestra 2", () => {
  const seed = load("../../../lib/db/src/seed/catalog-data.ts");
  assert.equal(seed.SEED_SESSIONS.some((s: any) => s.id === "29"), false);
  assert.equal(seed.SEED_AUDIO_FILES.some((s: any) => s.sessionId === "29"), false);
  assert.ok(seed.SEED_SESSIONS.some((s: any) => s.id === "30"));
  assert.ok(seed.SEED_AUDIO_FILES.some((s: any) => s.sessionId === "30"));
  const audio = load("../config/audio-map.ts");
  assert.equal(audio.AUDIO_MAP["29"], undefined);
  assert.equal(audio.VOICE_MAP["29"], undefined);
  assert.ok(audio.AUDIO_MAP["30"]);
  const manifest = load("../config/bundled-audio-manifest.ts");
  assert.equal(manifest.BUNDLED_AUDIO_SESSION_IDS.includes("29"), false);
  assert.ok(manifest.BUNDLED_AUDIO_SESSION_IDS.includes("30"));
});