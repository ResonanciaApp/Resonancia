/**
 * Manual development-only editorial import. Never runs at startup or publish.
 * Usage: NODE_ENV=development tsx scripts/replace-profile-avatars.ts <manifest> --apply [--append]
 */
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { and, asc, eq, sql } from "drizzle-orm";
import { db, coverPresetsTable, uploadsTable, usersTable } from "@workspace/db";
import { ObjectStorageService } from "../src/lib/objectStorage";

const service = new ObjectStorageService();
const staged: { objectPath: string; file: string; label: string; size: number }[] = [];
let phase = "checking development target";
let committed = false;
const append = process.argv.includes("--append");
try {
  if (process.env.NODE_ENV !== "development" || !process.argv.includes("--apply")) {
    throw new Error("Explicit development mode and --apply required");
  }
  const manifestPath = process.argv[2];
  if (!manifestPath) throw new Error("Manifest required");
  const manifest = JSON.parse(await readFile(resolve(manifestPath), "utf8")) as { file: string; label: string }[];
  if (!Array.isArray(manifest) || manifest.length === 0 || (!append && manifest.length !== 26) ||
    new Set(manifest.map((item) => item.file)).size !== manifest.length) {
    throw new Error("A unique cropped-image manifest is required");
  }
  const original = await db.select().from(coverPresetsTable)
    .where(eq(coverPresetsTable.scope, "profile")).orderBy(asc(coverPresetsTable.sortOrder));
  if ((!append && original.length !== 26) || (append && original.length + manifest.length > 200)) {
    throw new Error("Unexpected profile slot count or avatar capacity exceeded");
  }
  if (append && manifest.some((item) => original.some((slot) => slot.label === item.label))) {
    throw new Error("This labeled batch has already been imported");
  }
  const [owner] = await db.select({ id: usersTable.id }).from(usersTable)
    .where(eq(usersTable.role, "admin")).orderBy(asc(usersTable.id)).limit(1);
  if (!owner) throw new Error("An existing administrator is required");
  await writeFile(resolve(manifestPath, "../previous-profile-slots.json"), JSON.stringify(original, null, 2));

  for (const [index, item] of manifest.entries()) {
    phase = `uploading avatar ${index + 1}`;
    const bytes = await readFile(item.file);
    if (!bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
      throw new Error("Only cropped PNG files are accepted");
    }
    const uploadUrl = await service.getObjectEntityUploadURL();
    const objectPath = service.normalizeObjectEntityPath(uploadUrl);
    if (!objectPath.startsWith("/objects/uploads/")) throw new Error("Unexpected storage destination");
    staged.push({ ...item, objectPath, size: bytes.length });
    const response = await fetch(uploadUrl, {
      method: "PUT", headers: { "Content-Type": "image/png" }, body: new Uint8Array(bytes),
    });
    if (!response.ok) throw new Error("Upload failed");
    // Check the stored object, not just the client PUT response.
    const object = await service.getObjectEntityFile(objectPath);
    const [metadata] = await object.getMetadata();
    if (Number(metadata.size) !== bytes.length || metadata.contentType !== "image/png") {
      throw new Error("Stored image validation failed");
    }
  }

  phase = append ? "atomically appending profile slots" : "atomically replacing the 26 profile slots";
  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended('profile', 402))`);
    const current = await tx.select().from(coverPresetsTable).where(eq(coverPresetsTable.scope, "profile"))
      .orderBy(asc(coverPresetsTable.sortOrder)).for("update");
    if (current.length !== original.length || current.some((row, index) =>
      row.id !== original[index].id || row.sortOrder !== original[index].sortOrder ||
      row.objectPath !== original[index].objectPath || row.builtinKey !== original[index].builtinKey ||
      row.label !== original[index].label)) {
      throw new Error("The editorial catalog changed during preparation");
    }
    const [stillAdmin] = await tx.select({ id: usersTable.id }).from(usersTable)
      .where(and(eq(usersTable.id, owner.id), eq(usersTable.role, "admin"))).limit(1);
    if (!stillAdmin) throw new Error("Administrator no longer available");
    for (const [index, asset] of staged.entries()) {
      await tx.insert(uploadsTable).values({
        userId: owner.id, objectPath: asset.objectPath,
        name: `profile-avatar-${String(index + 1).padStart(2, "0")}.png`,
        contentType: "image/png", sizeBytes: asset.size,
      });
      if (append) {
        const key = `custom-${randomUUID()}`;
        await tx.insert(coverPresetsTable).values({
          id: `profile:${key}`, scope: "profile", key, label: asset.label,
          objectPath: asset.objectPath, builtinKey: null, isLocked: false,
          sortOrder: Math.max(-1, ...current.map((row) => row.sortOrder)) + index + 1,
        });
      } else {
        await tx.update(coverPresetsTable).set({
          label: asset.label, objectPath: asset.objectPath, builtinKey: null, updatedAt: new Date(),
        }).where(eq(coverPresetsTable.id, current[index].id));
      }
      // Deliberately preserve IDs, keys, ordering and the current lock state.
    }
  });
  committed = true;
  console.log(append
    ? `Added ${staged.length} avatars; all previous images, identities, order and locks preserved.`
    : "Replaced all 26 profile avatar images; identities, order and locks preserved.");
} catch {
  if (!committed) {
    for (const asset of staged) await service.deleteObjectEntity(asset.objectPath).catch(() => {});
  }
  // Do not log signed upload URLs or provider errors containing credentials.
  console.error(`Avatar import failed while ${phase}; no catalog replacement committed.`);
  process.exitCode = 1;
} finally {
  await db.$client.end();
}
