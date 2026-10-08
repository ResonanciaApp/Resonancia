import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { biographyFingerprint, recoverBiography } from "../lib/profileBiographySync.ts";

const owner = "fixture-owner";
const remote = { longDescription: "Desde la nube", lifeMotto: "Respirar" };
const local = { description: "", lifeMotto: "", biographyOwnerId: null as string | null, biographySyncedValue: null as string | null };
test("first sync restores remote content instead of publishing empty defaults", () => {
  const restored = recoverBiography(local, remote, owner)!;
  assert.equal(restored.description, remote.longDescription);
  assert.equal(restored.lifeMotto, remote.lifeMotto);
  assert.equal(restored.biographyOwnerId, owner);
});
test("first sync preserves real existing local fields independently", () => {
  const restored = recoverBiography({ ...local, lifeMotto: "Mi lema local" }, remote, owner)!;
  assert.equal(restored.description, remote.longDescription);
  assert.equal(restored.lifeMotto, "Mi lema local");
  assert.equal(restored.biographySyncedValue, biographyFingerprint(remote.longDescription, remote.lifeMotto));
});
test("intentional deletions remain pending rather than resurrecting remote text", () => {
  assert.equal(recoverBiography({
    ...local, biographyOwnerId: owner,
    biographySyncedValue: biographyFingerprint(remote.longDescription, remote.lifeMotto),
  }, remote, owner), null);
});
test("clean local content follows edits made on another device", () => {
  const restored = recoverBiography({
    ...local, description: "Antes", lifeMotto: "Antes",
    biographyOwnerId: owner, biographySyncedValue: biographyFingerprint("Antes", "Antes"),
  }, remote, owner)!;
  assert.equal(restored.description, remote.longDescription);
  assert.equal(restored.lifeMotto, remote.lifeMotto);
});
test("switching accounts never publishes the previous owner's biography", () => {
  const restored = recoverBiography({
    ...local, description: "Privado del anterior", lifeMotto: "Anterior",
    biographyOwnerId: "another-fixture-owner",
  }, remote, owner)!;
  assert.equal(restored.description, remote.longDescription);
  assert.equal(restored.lifeMotto, remote.lifeMotto);
});
test("matching server content confirms a pending edit without another write", () => {
  const confirmed = recoverBiography({
    ...local, description: remote.longDescription, lifeMotto: remote.lifeMotto,
    biographyOwnerId: owner, biographySyncedValue: biographyFingerprint("", ""),
  }, remote, owner)!;
  assert.equal(confirmed.biographySyncedValue, biographyFingerprint(remote.longDescription, remote.lifeMotto));
});
test("background profile recovery cannot overwrite unsaved detail-editor drafts", () => {
  const source = readFileSync("components/ProfileScreenBase.tsx", "utf8");
  assert.match(source, /accountDraftBaselineRef\.current !== null && accountDraftBaselineRef\.current !== draft\) return/);
  assert.match(source, /JSON\.stringify\(\[accountName, accountDescription, accountLifeMotto, accountPhotoUri, accountAvatarPresetId\]\)/);
});
