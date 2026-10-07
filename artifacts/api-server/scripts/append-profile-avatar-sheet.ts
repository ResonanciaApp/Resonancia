import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { asc, eq, sql } from "drizzle-orm";
import { db, pool, coverPresetsTable, uploadsTable, usersTable } from "@workspace/db";
import { ObjectStorageService } from "../src/lib/objectStorage";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const directoryIndex = process.argv.indexOf("--directory");
const directory = directoryIndex === -1
  ? "attached_assets/processed/profile-avatar-characters"
  : process.argv[directoryIndex + 1];
const countIndex = process.argv.indexOf("--expected-count");
const expectedCount = countIndex === -1 ? 30 : Number(process.argv[countIndex + 1]);
if (!Number.isInteger(expectedCount) || expectedCount < 1 || expectedCount > 200) {
  throw new Error("Expected an avatar count between 1 and 200.");
}
if (!directory || !/^attached_assets\/processed\/[a-z0-9-]+$/.test(directory)) {
  throw new Error("Expected a prepared avatar directory under attached_assets/processed.");
}
const storage = new ObjectStorageService();
const created: string[] = [];
let committed = false;
let stage = "validate";

async function main() {
  if (!process.argv.includes("--apply") || process.env.NODE_ENV === "production") {
    throw new Error("Development-only import requires --apply.");
  }
  type Image = { number: number; filePath: string; width: number; height: number; pixelHash: string; sizeBytes: number; contentType: string };
  const { images } = JSON.parse(await readFile(resolve(root, directory, "manifest.json"), "utf8")) as { images: Image[] };
  if (images.length !== expectedCount || images.some((image, index) => image.number !== index + 1 ||
    image.width !== 512 || image.height !== 512 || image.contentType !== "image/webp" ||
    image.filePath !== `${directory}/avatar-${String(index + 1).padStart(2, "0")}.webp`)) {
    throw new Error(`Expected the approved ${expectedCount} ordered, circular, lossless avatars.`);
  }
  const [owner] = await db.select({ id: usersTable.id, clerkUserId: usersTable.clerkUserId }).from(usersTable)
    .where(eq(usersTable.role, "admin")).orderBy(asc(usersTable.id)).limit(1);
  if (!owner?.clerkUserId) throw new Error("Missing administrator.");
  const before = await db.select().from(coverPresetsTable).where(eq(coverPresetsTable.scope, "profile"));
  if (before.length + images.length > 200) throw new Error("Profile capacity exceeded.");
  const receipt = resolve(root, directory, "imported-catalog.json");
  try {
    await readFile(receipt);
    throw new Error("This sheet has already been imported.");
  } catch (error) {
    if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") throw error;
  }
  const uploaded: { objectPath: string; sizeBytes: number; name: string }[] = new Array(images.length);
  let cursor = 0;
  stage = "upload";
  const results = await Promise.allSettled(Array.from({ length: 3 }, async () => {
    while (cursor < images.length) {
      const index = cursor++;
      const image = images[index];
      const bytes = await readFile(resolve(root, image.filePath));
      const pixels = execFileSync("magick", [resolve(root, image.filePath), "-depth", "8", "RGBA:-"],
        { maxBuffer: 2 * 1024 * 1024 });
      if (bytes.length !== image.sizeBytes || pixels.length !== 512 * 512 * 4 ||
        createHash("sha256").update(pixels).digest("hex") !== image.pixelHash) {
        throw new Error("Prepared image integrity mismatch.");
      }
      const url = await storage.getObjectEntityUploadURL();
      const objectPath = storage.normalizeObjectEntityPath(url);
      created.push(objectPath);
      const response = await fetch(url, {
        method: "PUT", headers: { "Content-Type": "image/webp" },
        body: new Uint8Array(bytes), signal: AbortSignal.timeout(120000),
      });
      if (!response.ok) throw new Error("Image upload failed.");
      const file = await storage.getObjectEntityFile(objectPath);
      const [metadata] = await file.getMetadata();
      if (metadata.contentType !== "image/webp" || Number(metadata.size) !== bytes.length) {
        throw new Error("Uploaded metadata mismatch.");
      }
      // The approved editorial avatars are public; preserve access for future confirmed selections.
      await storage.trySetObjectEntityAclPolicy(objectPath, { owner: owner.clerkUserId, visibility: "public" });
      uploaded[index] = { objectPath, sizeBytes: bytes.length, name: `avatar-character-${image.number}.webp` };
    }
  }));
  const failure = results.find(result => result.status === "rejected");
  if (failure?.status === "rejected") throw failure.reason;
  stage = "publish";
  const presets = await db.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${"profile"}, 402))`);
    const current = await tx.select().from(coverPresetsTable).where(eq(coverPresetsTable.scope, "profile"));
    if (current.length + images.length > 200) throw new Error("Concurrent capacity change.");
    const start = Math.max(-1, ...current.map(item => item.sortOrder)) + 1;
    await tx.insert(uploadsTable).values(uploaded.map(image => ({
      ...image, userId: owner.id, contentType: "image/webp",
    })));
    const appended = await tx.insert(coverPresetsTable).values(uploaded.map((image, index) => {
      const key = `custom-${randomUUID()}`;
      return { id: `profile:${key}`, scope: "profile" as const, key,
        label: `Avatar ${String(start + index + 1).padStart(2, "0")}`,
        objectPath: image.objectPath, sortOrder: start + index, isLocked: false };
    })).returning();
    const after = await tx.select().from(coverPresetsTable).where(eq(coverPresetsTable.scope, "profile"));
    const byId = new Map(after.map(item => [item.id, item]));
    if (after.length !== current.length + images.length ||
      current.some(item => JSON.stringify(byId.get(item.id)) !== JSON.stringify(item))) {
      throw new Error("Existing avatar catalog changed during append.");
    }
    return appended;
  });
  committed = true;
  await writeFile(receipt, JSON.stringify(presets.map((preset, index) => ({
    id: preset.id, label: preset.label, objectPath: preset.objectPath,
    sizeBytes: uploaded[index].sizeBytes, pixelHash: images[index].pixelHash,
  })), null, 2));
  const sizes = uploaded.map(image => image.sizeBytes);
  console.log(JSON.stringify({ appended: presets.length, minBytes: Math.min(...sizes),
    maxBytes: Math.max(...sizes), averageBytes: Math.round(sizes.reduce((a, b) => a + b, 0) / sizes.length),
    totalBytes: sizes.reduce((a, b) => a + b, 0) }));
}

main().catch(async error => {
  if (!committed) await Promise.allSettled(created.map(path => storage.deleteObjectEntity(path)));
  console.error("Import stopped:", stage, error instanceof Error ? error.name : "UnknownError");
  process.exitCode = 1;
}).finally(() => pool.end());
