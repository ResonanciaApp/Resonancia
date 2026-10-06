import test from "node:test";
import assert from "node:assert/strict";

import {
  authoritativeSnapshot,
  resolveCatalogRecord,
  type ResolvedCatalogRecord,
} from "../lib/cover-preset-catalog-logic.ts";

const item = (id: string): ResolvedCatalogRecord<string> => ({
  id,
  key: id,
  label: id,
  source: `source:${id}`,
});

test("locked avatars keep their flag when resolving images, caching, and recovering offline", () => {
  const raw = { id: "profile:one", key: "one", label: "One", isLocked: true };
  for (const resolved of [
    resolveCatalogRecord(raw, "builtin", undefined),
    resolveCatalogRecord(raw, undefined, "remote"),
  ]) {
    assert.ok(resolved);
    assert.equal(resolved.isLocked, true);
    const cached = JSON.parse(JSON.stringify([resolved]));
    assert.equal(authoritativeSnapshot(null, cached, [item("bootstrap")])[0].isLocked, true);
    const unlocked = { ...resolved, isLocked: false };
    assert.equal(authoritativeSnapshot([unlocked], cached, [item("bootstrap")])[0].isLocked, false);
  }
});

test("uses bundled bootstrap until a valid remote snapshot arrives", () => {
  const bootstrap = [item("one"), item("two")];
  assert.deepEqual(authoritativeSnapshot(null, [], bootstrap), bootstrap);
  assert.deepEqual(authoritativeSnapshot([item("two"), item("three")], bootstrap, bootstrap), [
    item("two"),
    item("three"),
  ]);
});

test("a valid remote snapshot is authoritative, including deletions and order", () => {
  const cached = [item("one"), item("two"), item("three")];
  const remote = [item("three"), item("one")];
  assert.deepEqual(authoritativeSnapshot(remote, cached, []), remote);
});

test("transient failures retain the last valid complete snapshot", () => {
  const cached = [item("one"), item("two")];
  assert.deepEqual(authoritativeSnapshot(null, cached, [item("bootstrap")]), cached);
});

test("resolves bundled and remote records without inventing a source", () => {
  const base = { id: "custom", key: "custom", label: "Custom" };
  assert.deepEqual(resolveCatalogRecord(base, "bundled", "remote"), { ...base, source: "bundled" });
  assert.deepEqual(resolveCatalogRecord(base, undefined, "remote"), { ...base, source: "remote" });
  assert.equal(resolveCatalogRecord(base, undefined, undefined), null);
});

test("raw snapshots keep stable storage fields separate from runtime sources", () => {
  const raw = {
    id: "preset-1",
    key: "aurora",
    label: "Aurora",
    sortOrder: 4,
    builtinKey: null,
    objectPath: "/objects/covers/aurora.jpg",
  };
  const runtime = resolveCatalogRecord(raw, undefined, { uri: "https://api.test/api/storage/objects/covers/aurora.jpg" });
  assert.equal(raw.objectPath, "/objects/covers/aurora.jpg");
  assert.equal("source" in raw, false);
  assert.deepEqual(runtime?.source, { uri: "https://api.test/api/storage/objects/covers/aurora.jpg" });
});