import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db, pool, coverPresetsTable, uploadsTable, usersTable } from "@workspace/db";
import { ObjectStorageService } from "../src/lib/objectStorage";
import { getObjectAclPolicy } from "../src/lib/objectAcl";

const workspaceRoot = fileURLToPath(new URL("../../../", import.meta.url));
const directory = resolve(workspaceRoot, "attached_assets/processed/profile-avatar-catalog");
const storage = new ObjectStorageService();
const createdObjects: string[] = [];
let committed = false;

async function preserveExistingAvatarAccess(previous: { scope: string; objectPath: string | null }[], owner: string) {
  if (previous.length !== 86 || previous.some(preset => preset.scope !== "profile" ||
    !preset.objectPath?.match(/^\/objects\/uploads\/[a-f0-9-]+$/))) {
    throw new Error("Invalid previous profile catalog.");
  }
  let cursor = 0;
  const results = await Promise.allSettled(Array.from({ length: 3 }, async () => {
    while (cursor < previous.length) {
      const preset = previous[cursor++];
      const file = await storage.getObjectEntityFile(preset.objectPath!);
      const policy = await getObjectAclPolicy(file);
      // These editorial images were already public through their catalog reference.
      // Preserve that access after the reference is replaced, including offline selections.
      await storage.trySetObjectEntityAclPolicy(preset.objectPath!, {
        ...policy, owner: policy?.owner ?? owner, visibility: "public",
      });
    }
  }));
  const failure = results.find(result => result.status === "rejected");
  if (failure?.status === "rejected") throw failure.reason;
}

async function main() {
  if (!process.argv.includes("--apply")) throw new Error("Explicit --apply is required.");
  const { images } = JSON.parse(await readFile(resolve(directory, "manifest.json"), "utf8")) as {
    images: { number: number; filePath: string; width: number; height: number }[];
  };
  if (images.length !== 60 || images.some((image, index) =>
    image.number !== index + 1 || image.width !== 512 || image.height !== 512 ||
    image.filePath !== `attached_assets/processed/profile-avatar-catalog/avatar-${String(index + 1).padStart(2, "0")}.png`)) {
    throw new Error("The approved catalog must contain exactly 60 ordered square PNGs.");
  }
  const [owner] = await db.select({ id: usersTable.id, clerkUserId: usersTable.clerkUserId }).from(usersTable)
    .where(eq(usersTable.role, "admin")).orderBy(asc(usersTable.id)).limit(1);
  if (!owner) throw new Error("No existing administrator can own the imports.");
  if (process.argv.includes("--preserve-previous")) {
    const previous = JSON.parse(await readFile(resolve(directory, "previous-catalog.json"), "utf8"));
    await preserveExistingAvatarAccess(previous, owner.clerkUserId);
    console.log("Preserved read access to previously published avatars without changing user selections.");
    return;
  }
  const before = await db.select().from(coverPresetsTable)
    .where(eq(coverPresetsTable.scope, "profile")).orderBy(asc(coverPresetsTable.sortOrder));
  if (before.length !== 86) throw new Error("The catalog changed since approval; refusing to replace it.");
  await writeFile(resolve(directory, "previous-catalog.json"), JSON.stringify(before, null, 2));
  await preserveExistingAvatarAccess(before, owner.clerkUserId);

  const replacements: { objectPath: string; name: string; sizeBytes: number }[] = new Array(60);
  let cursor = 0;
  const uploadResults = await Promise.allSettled(Array.from({ length: 3 }, async () => {
    while (cursor < images.length) {
      const index = cursor++;
      const image = images[index];
      const bytes = await readFile(resolve(workspaceRoot, image.filePath));
      if (bytes.readUInt32BE(16) !== 512 || bytes.readUInt32BE(20) !== 512 || bytes[25] !== 6) {
        throw new Error("An avatar is not a 512px RGBA PNG.");
      }
      const uploadUrl = await storage.getObjectEntityUploadURL();
      const objectPath = storage.normalizeObjectEntityPath(uploadUrl);
      createdObjects.push(objectPath);
      const response = await fetch(uploadUrl, {
        method: "PUT", headers: { "Content-Type": "image/png" },
        body: new Uint8Array(bytes), signal: AbortSignal.timeout(120000),
      });
      if (!response.ok) throw new Error(`Upload returned status ${response.status}`);
      const object = await storage.getObjectEntityFile(objectPath);
      const [metadata] = await object.getMetadata();
      if (Number(metadata.size) !== bytes.length || metadata.contentType !== "image/png") {
        throw new Error("Stored image metadata does not match.");
      }
      replacements[index] = { objectPath, name: `avatar-${String(index + 1).padStart(2, "0")}.png`, sizeBytes: bytes.length };
      if ((index + 1) % 10 === 0) console.log(`Uploaded avatar ${index + 1}/60`);
    }
  }));
  const failedUpload = uploadResults.find(result => result.status === "rejected");
  if (failedUpload?.status === "rejected") throw failedUpload.reason;

  await db.transaction(async (tx) => {
    // Serialize the short catalog swap; readers continue to see a complete catalog.
    await tx.execute(sql`LOCK TABLE cover_presets IN SHARE ROW EXCLUSIVE MODE`);
    const current = await tx.select().from(coverPresetsTable)
      .where(eq(coverPresetsTable.scope, "profile")).orderBy(asc(coverPresetsTable.sortOrder));
    if (JSON.stringify(current) !== JSON.stringify(before)) throw new Error("Concurrent editorial change; refusing to overwrite it.");
    await tx.insert(uploadsTable).values(replacements.map(image => ({
      ...image, userId: owner.id, contentType: "image/png",
    })));
    for (let index = 0; index < 60; index++) {
      await tx.update(coverPresetsTable).set({
        objectPath: replacements[index].objectPath, builtinKey: null,
        label: `Avatar ${String(index + 1).padStart(2, "0")}`, updatedAt: new Date(),
      }).where(and(eq(coverPresetsTable.scope, "profile"), eq(coverPresetsTable.id, before[index].id)));
    }
    await tx.delete(coverPresetsTable).where(and(
      eq(coverPresetsTable.scope, "profile"),
      inArray(coverPresetsTable.id, before.slice(60).map(preset => preset.id)),
    ));
    // Do not delete old objects or edit user avatar URLs: existing selections remain valid.
  });
  committed = true;
  await writeFile(resolve(directory, "imported-catalog.json"), JSON.stringify(replacements, null, 2));
  console.log("Replaced the profile catalog with 60 avatars; existing identities and lock flags preserved.");
}

main().catch(async (error) => {
  if (!committed) {
    await Promise.allSettled(createdObjects.map(path => storage.deleteObjectEntity(path)));
  }
  // Never print upload URLs or provider errors that might contain signed credentials.
  console.error("Avatar import failed:", error instanceof Error ? error.name : "UnknownError");
  process.exitCode = 1;
}).finally(() => pool.end());
