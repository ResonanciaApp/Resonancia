import assert from "node:assert/strict";
import test from "node:test";
import { addWorld, LEGACY_WORLDS, MAX_WORLDS, moveStage, newStage, validate, resolveWorlds } from "../src/lib/growth-worlds.ts";

test("world creation uses templates and caps at five", () => {
  let w = [...LEGACY_WORLDS];
  for (let i = 0; i < 6; i++) w = addWorld(w);
  assert.equal(w.length, MAX_WORLDS);
  assert.deepEqual(w.slice(2).map((x) => x.id), ["iluminacion", "llegada", "despertar"]);
  assert.equal(w[4].name, "El Gran Despertar");
  assert.equal(w[4].description, "");
});

test("stage ops work in any world and validation is global in world order", () => {
  const w = addWorld(LEGACY_WORLDS);
  let s = newStage([], "iluminacion", "a");
  s = newStage(s, "iluminacion", "b");
  assert.equal(s[1].startDay, 1);
  s = moveStage(s, "b", -1);
  assert.deepEqual(s.map((x) => x.id), ["b", "a"]);
  const mk = (id: string, group: string, d: number) => ({ id, group, name: "n", startDay: d, endDay: d, story: "", imageUrl: "/x", rewards: [] });
  const errs = validate(w, [mk("x", "iluminacion", 3), mk("y", "florecimiento", 3)]);
  assert.ok(errs.x?.some((m) => m.includes("Se superpone")));
  assert.equal(errs.y, undefined);
});

test("world metadata validation and legacy fallback", () => {
  const w = [{ ...LEGACY_WORLDS[0], name: " ", coverUrl: "" }];
  assert.equal(validate(w, [])[w[0].id].length, 2);
  assert.deepEqual(resolveWorlds({ stages: [] }), LEGACY_WORLDS);
  assert.deepEqual(resolveWorlds({ worlds: [], stages: [] }), []);
  const worlds = addWorld(LEGACY_WORLDS);
  const last = { id: "last", group: "ascenso", name: "Última", startDay: 99, endDay: 112, story: "", imageUrl: "/x", rewards: [] };
  assert.equal(newStage([last], "iluminacion", "first", worlds)[1].startDay, 113);
  const edited = [{ ...worlds[0], name: "Editado", coverUrl: "/objects/photo" }, ...worlds.slice(1)];
  assert.equal(resolveWorlds({ worlds: edited, stages: [] }), edited);
});
