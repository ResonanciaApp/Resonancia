import assert from "node:assert/strict";
import test from "node:test";
import {
  inspirationEmptyState, inspirationPutNote, inspirationPutFavorite, inspirationMergeNote,
  inspirationMergeFavorite, inspirationImportGuest, inspirationStorageKey, inspirationParseState,
  inspirationWeekDates, inspirationWeekStart, inspirationDateInZone,
} from "./inspiration-state.ts";
import {
  inspirationAcceptWeek, inspirationCatalogKey, inspirationGateWeek, inspirationParseCatalog,
  inspirationWithdrawSavedDays, inspirationRememberWeekRequest, inspirationWeekRequestedAt,
  createInspirationCatalogPersistence,
} from "./inspiration-cache.ts";
import { createInspirationAccountLifecycle } from "./inspiration-lifecycle.ts";

const time = "2026-09-18T12:00:00Z";
const note = (overrides = {}) => ({
  id: "note-1", inspirationId: "editorial-1", text: "Mi texto privado", revision: 0,
  updatedAt: time, deletedAt: null, ...overrides,
});
const favorite = (overrides = {}) => ({
  inspirationId: "editorial-1", revision: 0, updatedAt: time, deletedAt: null, ...overrides,
});
const recovery = () => "recovery-1";
const settings = { revision: 1, sectionTitle: "Sabiduría diaria", readMoreLabel: "Leer más", discoverMoreLabel: "Descubre más", notesLabel: "Mis notas" };
const content = { quote: "Editorial", author: null, reflection: "Reflexión", imageUrl: "https://example.test/protected", imagePositionX: 50, imagePositionY: 50, overlayOpacity: .35, sessionId: null };
function week(overrides = {}) {
  return {
    weekStart: "2026-09-14", today: "2026-09-18", timeZone: "UTC", settings,
    days: inspirationWeekDates("2026-09-18").map((date) => ({
      date, status: date > "2026-09-18" ? "future" : "available",
      id: date > "2026-09-18" ? null : `id-${date}`, revision: date > "2026-09-18" ? null : 1,
      content: date > "2026-09-18" ? null : content,
    })), ...overrides,
  };
}

test("guest data stays local; user namespaces are distinct and cannot collide with guest", () => {
  const state = inspirationPutNote(inspirationEmptyState(), note(), false);
  assert.equal(Object.keys(state.pending).length, 0);
  assert.notEqual(inspirationStorageKey(null), inspirationStorageKey("guest"));
  assert.notEqual(inspirationStorageKey("alice"), inspirationStorageKey("bob"));
  assert.match(inspirationStorageKey("a/b"), /a%2Fb/);
});

test("guest import requires explicit consent and is idempotent", () => {
  const guest = inspirationPutNote(inspirationEmptyState(), note(), false);
  assert.throws(() => inspirationImportGuest(inspirationEmptyState(), guest, false), /Confirma/);
  const imported = inspirationImportGuest(inspirationEmptyState(), guest, true);
  assert.equal(Object.keys(imported.pending).length, 1);
  assert.deepEqual(inspirationImportGuest(imported, guest, true), imported);
  assert.equal(guest.importedGuestIds.length, 0);
});

test("guest import never replaces an account tombstone", () => {
  const guest = inspirationPutNote(inspirationEmptyState(), note(), false);
  const account = inspirationPutNote(inspirationEmptyState(), note({ deletedAt: time, revision: 3 }), false);
  const merged = inspirationImportGuest(account, guest, true);
  assert.equal(merged.notes["note-1"].deletedAt, time);
  assert.equal(Object.keys(merged.pending).length, 0);
});

test("per-item queue coalesces edits and persists across reload", () => {
  let state = inspirationPutNote(inspirationEmptyState(), note(), true);
  state = inspirationPutNote(state, note({ text: "Versión 2" }), true);
  assert.equal(Object.keys(state.pending).length, 1);
  assert.equal(state.pending["note:note-1"].sequence, 2);
  assert.deepEqual(inspirationParseState(JSON.stringify(state)), state);
  assert.throws(() => inspirationParseState("{bad"), SyntaxError);
  assert.throws(() => inspirationParseState('{"version":99}'), /No se pudieron/);
});

test("acknowledgment clears exactly the operation that was sent", () => {
  const state = inspirationPutNote(inspirationEmptyState(), note(), true);
  const merged = inspirationMergeNote(state, note({ revision: 1 }), recovery, state.pending["note:note-1"]);
  assert.equal(merged.notes["note-1"].revision, 1);
  assert.deepEqual(merged.pending, {});
});

test("an edit arriving while a request is in flight survives the older acknowledgment", () => {
  const initial = inspirationPutNote(inspirationEmptyState(), note(), true);
  const sent = initial.pending["note:note-1"];
  const edited = inspirationPutNote(initial, note({ text: "Texto escrito mientras sincroniza" }), true);
  const merged = inspirationMergeNote(edited, note({ revision: 1 }), recovery, sent);
  assert.equal(merged.notes["note-1"].text, "Texto escrito mientras sincroniza");
  assert.equal(merged.pending["note:note-1"].baseRevision, 1);
  assert.equal(merged.pending["note:note-1"].sequence, 2);
});

test("an offline deletion survives a newer remote edit and rebases only the tombstone", () => {
  const initial = inspirationPutNote(inspirationEmptyState(), note({ revision: 1 }), false);
  const deleted = inspirationPutNote(initial, note({ revision: 1, deletedAt: time }), true);
  const merged = inspirationMergeNote(deleted, note({ text: "Otro dispositivo", revision: 2 }), recovery);
  assert.equal(merged.notes["note-1"].deletedAt, time);
  assert.equal(merged.pending["note:note-1"].baseRevision, 2);
});

test("remote tombstone wins stale offline edit while preserving text in a local recovery copy", () => {
  const initial = inspirationPutNote(inspirationEmptyState(), note({ revision: 1 }), false);
  const edited = inspirationPutNote(initial, note({ revision: 1, text: "No perder este texto" }), true);
  const merged = inspirationMergeNote(edited, note({ revision: 2, deletedAt: time, text: "" }), recovery);
  assert.equal(merged.notes["note-1"].deletedAt, time);
  assert.equal(merged.notes["recovery-1"].text, "No perder este texto");
  assert.equal(merged.notes["recovery-1"].localOnly, true);
  assert.equal(merged.notes["recovery-1"].conflictOf, "note-1");
  assert.deepEqual(merged.pending, {});
  assert.throws(() => inspirationPutNote(merged, note(), true), /no se puede reactivar/);
});

test("concurrent live edits preserve both texts without silently overwriting the server", () => {
  const initial = inspirationPutNote(inspirationEmptyState(), note({ revision: 1 }), false);
  const edited = inspirationPutNote(initial, note({ revision: 1, text: "Local" }), true);
  const remote = note({ revision: 2, text: "Remoto" });
  const merged = inspirationMergeNote(edited, remote, recovery);
  assert.equal(merged.notes["note-1"].text, "Remoto");
  assert.equal(merged.notes["recovery-1"].text, "Local");
  assert.deepEqual(merged.pending, {});
  assert.deepEqual(inspirationMergeNote(merged, remote, () => "duplicate"), merged);
});

test("lost success response is recovered idempotently without a duplicate note", () => {
  const state = inspirationPutNote(inspirationEmptyState(), note(), true);
  const merged = inspirationMergeNote(state, note({ revision: 1 }), recovery);
  assert.equal(Object.keys(merged.notes).length, 1);
  assert.deepEqual(merged.pending, {});
});

test("old snapshots cannot revert a newer note revision or resurrect a deletion", () => {
  const state = inspirationPutNote(inspirationEmptyState(), note({ revision: 4, deletedAt: time }), false);
  assert.deepEqual(inspirationMergeNote(state, note({ revision: 3 }), recovery), state);
  assert.deepEqual(inspirationMergeNote(state, note({ revision: 4 }), recovery), state);
});

test("stale favorite add cannot revive a remote removal", () => {
  const state = inspirationPutFavorite(inspirationEmptyState(), favorite(), true);
  const merged = inspirationMergeFavorite(state, favorite({ revision: 2, deletedAt: time }));
  assert.equal(merged.favorites["editorial-1"].deletedAt, time);
  assert.deepEqual(merged.pending, {});
});

test("explicit save after observing favorite tombstone is allowed", () => {
  const initial = inspirationPutFavorite(inspirationEmptyState(), favorite({ revision: 2, deletedAt: time }), false);
  const restored = inspirationPutFavorite(initial, favorite({ revision: 2 }), true);
  const merged = inspirationMergeFavorite(restored, favorite({ revision: 2, deletedAt: time }));
  assert.equal(merged.favorites["editorial-1"].deletedAt, null);
  assert.equal(merged.pending["favorite:editorial-1"].baseRevision, 2);
});

test("equal-revision active snapshot cannot resurrect an acknowledged favorite tombstone", () => {
  const tombstone = inspirationPutFavorite(inspirationEmptyState(), favorite({ revision: 3, deletedAt: time }), false);
  const merged = inspirationMergeFavorite(tombstone, favorite({ revision: 3 }));
  assert.equal(merged, tombstone);
});

test("genuinely newer server favorite restoration is accepted", () => {
  const tombstone = inspirationPutFavorite(inspirationEmptyState(), favorite({ revision: 3, deletedAt: time }), false);
  const merged = inspirationMergeFavorite(tombstone, favorite({ revision: 4 }));
  assert.equal(merged.favorites["editorial-1"].deletedAt, null);
  assert.equal(merged.favorites["editorial-1"].revision, 4);
});

test("favorite removal during an in-flight save survives acknowledgment", () => {
  const initial = inspirationPutFavorite(inspirationEmptyState(), favorite(), true);
  const sent = initial.pending["favorite:editorial-1"];
  const removed = inspirationPutFavorite(initial, favorite({ deletedAt: time }), true);
  const merged = inspirationMergeFavorite(removed, favorite({ revision: 1 }), sent);
  assert.equal(merged.favorites["editorial-1"].deletedAt, time);
  assert.equal(merged.pending["favorite:editorial-1"].baseRevision, 1);
});

test("new explicit favorite save survives an older in-flight removal acknowledgment", () => {
  const initial = inspirationPutFavorite(inspirationEmptyState(), favorite({ revision: 2, deletedAt: time }), true);
  const removal = initial.pending["favorite:editorial-1"];
  const restored = inspirationPutFavorite(initial, favorite({ revision: 2 }), true);
  const merged = inspirationMergeFavorite(restored, favorite({ revision: 3, deletedAt: time }), removal);
  assert.equal(merged.favorites["editorial-1"].deletedAt, null);
  assert.equal(merged.pending["favorite:editorial-1"].baseRevision, 3);
  assert.equal(merged.pending["favorite:editorial-1"].sequence, restored.pending["favorite:editorial-1"].sequence);
});

test("ISO weeks cross years, leap days and DST independently of local timezone", () => {
  assert.equal(inspirationWeekStart("2027-01-01"), "2026-12-28");
  assert.deepEqual(inspirationWeekDates("2027-01-01"), [
    "2026-12-28", "2026-12-29", "2026-12-30", "2026-12-31", "2027-01-01", "2027-01-02", "2027-01-03",
  ]);
  assert.equal(inspirationWeekDates("2024-02-29")[3], "2024-02-29");
  assert.equal(inspirationWeekDates("2026-03-08").length, 7);
  assert.equal(inspirationDateInZone("America/Los_Angeles", new Date("2026-09-18T01:00:00Z")), "2026-09-17");
  assert.throws(() => inspirationWeekStart("2026-02-30"), /no válida/);
});

test("cached future cannot be unlocked by advancing the device clock", () => {
  const gated = inspirationGateWeek(week(), "2030-01-01");
  assert.equal(gated.days[5].status, "future");
  assert.equal(gated.days[5].content, null);
  assert.equal(gated.days[5].id, null);
});

test("future gate strips leaked fields defensively and honors backward timezone date", () => {
  const invalid = week();
  invalid.days[5] = { ...invalid.days[4], date: "2026-09-19" };
  const gated = inspirationGateWeek(invalid, "2026-09-17");
  assert.equal(gated.days[4].status, "future");
  assert.equal(gated.days[4].content, null);
  assert.equal(gated.days[5].content, null);
});

test("successful withdrawal replaces cache; stale responses cannot resurrect same revision", () => {
  const key = inspirationCatalogKey("UTC", "2026-09-14");
  const original = week();
  const cached = inspirationAcceptWeek({}, original, 100);
  const withdrawn = week({ days: original.days.map((day) => ({ ...day, status: "unavailable", id: null, revision: null, content: null })) });
  const removed = inspirationAcceptWeek(cached, withdrawn, 200);
  assert.equal(removed[key].week.days[0].content, null);
  assert.equal(inspirationAcceptWeek(removed, original, 150), removed);
  assert.equal(inspirationAcceptWeek(removed, original, 300)[key].week.days[0].content, null);
  const republished = week({ days: original.days.map((day) => day.id ? { ...day, revision: 3 } : day) });
  assert.equal(inspirationAcceptWeek(removed, republished, 400)[key].week.days[0].status, "available");
  assert.deepEqual(inspirationParseCatalog(JSON.stringify(removed)), removed);
});

test("private saved-item withdrawal invalidates cached public content", () => {
  const original = week();
  const cached = inspirationAcceptWeek({}, original, 100);
  const next = inspirationWithdrawSavedDays(cached, [{ inspirationId: "id-2026-09-14", day: null }], "UTC", 200);
  assert.equal(next[inspirationCatalogKey("UTC", "2026-09-14")].week.days[0].status, "unavailable");
  assert.equal(next[inspirationCatalogKey("UTC", "2026-09-14")].week.days[1].status, "available");
  assert.equal(next[inspirationCatalogKey("UTC", "2026-09-14")].futureFences["2026-09-19"], 100);
});

test("removing a favorite does not withdraw its still-published editorial day", () => {
  const cached = inspirationAcceptWeek({}, week(), 100);
  const next = inspirationWithdrawSavedDays(cached, [
    { inspirationId: "id-2026-09-14", day: null, deleted: true },
  ], "UTC", 200);
  assert.equal(next, cached);
});

test("late available response cannot replace a more recent publication revision", () => {
  const original = week();
  const updated = week({ days: original.days.map((day) => day.id ? { ...day, revision: 4 } : day) });
  const cached = inspirationAcceptWeek({}, updated, 100);
  const late = inspirationAcceptWeek(cached, original, 200);
  assert.equal(late[inspirationCatalogKey("UTC", "2026-09-14")].week.days[0].revision, 4);
});

test("future gate rejects older in-flight available snapshots, including a higher revision", () => {
  const original = week();
  const key = inspirationCatalogKey("UTC", original.weekStart);
  const cached = inspirationAcceptWeek({}, original, 100, 90);
  const gatedWeek = week({ days: original.days.map((day) => day.date === "2026-09-18"
    ? { ...day, status: "future", id: null, revision: null, content: null } : day) });
  const gated = inspirationAcceptWeek(cached, gatedWeek, 200, 190);
  const late = inspirationAcceptWeek(gated, original, 300, 150);
  assert.equal(late[key].week.days[4].status, "future");
  assert.equal(late[key].week.days[4].content, null);
  const higher = week({ days: original.days.map((day) => day.id ? { ...day, revision: 8 } : day) });
  assert.equal(inspirationAcceptWeek(gated, higher, 350, 150)[key].week.days[4].content, null);
});

test("future fence survives reload and fresh arrival-day request unlocks same publication revision", () => {
  const original = week();
  const key = inspirationCatalogKey("UTC", original.weekStart);
  const cached = inspirationAcceptWeek({}, original, 100, 90);
  const gated = inspirationAcceptWeek(cached, week({ today: "2026-09-17" }), 200, 190);
  const disk = inspirationParseCatalog(JSON.stringify(gated));
  assert.equal(inspirationAcceptWeek(disk, original, 300)[key].week.days[4].content, null);
  const fresh = inspirationAcceptWeek(disk, original, 400, 350);
  assert.equal(fresh[key].week.days[4].status, "available");
  assert.equal(fresh[key].week.days[4].revision, 1);
  assert.equal(fresh[key].futureFences["2026-09-18"], undefined);
});

test("fresh request cannot unlock an actual future day or bypass an editorial withdrawal", () => {
  const original = week();
  const key = inspirationCatalogKey("UTC", original.weekStart);
  const cached = inspirationAcceptWeek({}, original, 100, 90);
  const removed = inspirationAcceptWeek(cached, week({ days: original.days.map((day) => day.date === "2026-09-18"
    ? { ...day, status: "unavailable", id: null, revision: null, content: null } : day) }), 200, 150);
  const gated = inspirationAcceptWeek(removed, week({ today: "2026-09-17" }), 300, 250);
  const fresh = inspirationAcceptWeek(gated, original, 500, 400);
  assert.equal(fresh[key].week.days[4].status, "unavailable");
  assert.equal(fresh[key].week.days[5].status, "future");
});

test("generated response request metadata is external to its editorial DTO", () => {
  const response = week();
  const keys = Object.keys(response);
  inspirationRememberWeekRequest(response, 123);
  assert.equal(inspirationWeekRequestedAt(response), 123);
  assert.deepEqual(Object.keys(response), keys);
});

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};

test("account deletion aborts synchronously, drains in-flight storage, then removes the key", async () => {
  const lifecycle = createInspirationAccountLifecycle();
  const disk = new Map();
  const pendingWrite = deferred();
  const order = [];
  lifecycle.register("alice", () => order.push("abort"));
  const write = pendingWrite.promise.then(() => { disk.set("alice", "private"); order.push("write"); });
  lifecycle.trackWrite("alice", write);
  const clear = lifecycle.clear("alice", async () => { order.push("remove"); disk.delete("alice"); });
  assert.deepEqual(order, ["abort"]);
  assert.equal(lifecycle.isRevoked("alice"), true);
  assert.equal(lifecycle.isRevoked("bob"), false);
  pendingWrite.resolve();
  await clear;
  assert.deepEqual(order, ["abort", "write", "remove"]);
  assert.equal(disk.has("alice"), false);
});

test("deletion drains writes from unmounted providers and immediately stops late registration", async () => {
  const lifecycle = createInspirationAccountLifecycle();
  const pendingWrite = deferred();
  let removed = false;
  const unregister = lifecycle.register("alice", () => {});
  lifecycle.trackWrite("alice", pendingWrite.promise);
  unregister();
  const clear = lifecycle.clear("alice", async () => { removed = true; });
  let lateStopped = false;
  lifecycle.register("alice", () => { lateStopped = true; });
  assert.equal(lateStopped, true);
  assert.equal(removed, false);
  pendingWrite.resolve();
  await clear;
  assert.equal(removed, true);
});

test("queued transaction after deletion is rejected before storage and failed removal remains retryable", async () => {
  const lifecycle = createInspirationAccountLifecycle();
  const queuedStart = deferred();
  let wrote = false;
  const queued = queuedStart.promise.then(() => {
    if (lifecycle.isRevoked("alice")) throw new Error("account deleted");
    wrote = true;
  });
  lifecycle.trackWrite("alice", queued);
  const clear = lifecycle.clear("alice", async () => { throw new Error("disk failed"); });
  queuedStart.resolve();
  await assert.rejects(clear, /disk failed/);
  assert.equal(wrote, false);
  assert.equal(lifecycle.isRevoked("alice"), true);
  let retried = false;
  await lifecycle.clear("alice", async () => { retried = true; });
  assert.equal(retried, true);
});

test("late catalog hydration failure cannot restore an error after a successful fresh write", async () => {
  const reports = [];
  const persistence = createInspirationCatalogPersistence((error) => reports.push(error));
  const read = deferred();
  const loading = persistence.load(() => read.promise, () => assert.fail("stale read was applied"));
  await persistence.save(async () => {});
  read.reject(new Error("old read failed"));
  await loading;
  assert.deepEqual(reports, [null]);
});

test("catalog writes remain ordered and latest success clears an earlier persistence error", async () => {
  const reports = [];
  const persistence = createInspirationCatalogPersistence((error) => reports.push(error?.message ?? null));
  await persistence.save(async () => { throw new Error("storage unavailable"); });
  assert.deepEqual(reports, ["storage unavailable"]);
  const first = deferred();
  const order = [];
  const older = persistence.save(async () => { order.push("first"); await first.promise; });
  const latest = persistence.save(async () => { order.push("second"); });
  await Promise.resolve();
  first.reject(new Error("older failure"));
  await Promise.all([older, latest]);
  assert.deepEqual(order, ["first", "second"]);
  assert.deepEqual(reports, ["storage unavailable", null]);
});

test("timezone caches remain isolated and malformed cache fails explicitly", () => {
  const utc = inspirationAcceptWeek({}, week(), 100);
  const zones = inspirationAcceptWeek(utc, week({ timeZone: "America/Los_Angeles", today: "2026-09-17" }), 200);
  assert.equal(Object.keys(zones).length, 2);
  assert.equal(zones[inspirationCatalogKey("America/Los_Angeles", "2026-09-14")].week.days[4].content, null);
  assert.throws(() => inspirationParseCatalog('{"bad":{}}'), /no es válida/);
});