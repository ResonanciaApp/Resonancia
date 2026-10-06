import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { asc, eq } from "drizzle-orm";
import { db, pool, coverPresetsTable, uploadsTable } from "@workspace/db";
import { ObjectStorageService } from "../src/lib/objectStorage";
import { lockObjectPaths } from "../src/lib/objectAccess";

const storage = new ObjectStorageService();
const output = resolve(fileURLToPath(new URL("../../../", import.meta.url)),
  "attached_assets/processed/profile-avatar-catalog/lossless");
const hash = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
const rgba = (path: string) => execFileSync("magick", [path, "-depth", "8", "RGBA:-"],
  { maxBuffer: 2 * 1024 * 1024 });
let stage = "prepare";

async function main() {
  if (!process.argv.includes("--apply") || process.env.NODE_ENV === "production") {
    throw new Error("Development-only import requires explicit --apply.");
  }
  await mkdir(output, { recursive: true });
  const presets = await db.select().from(coverPresetsTable)
    .where(eq(coverPresetsTable.scope, "profile")).orderBy(asc(coverPresetsTable.sortOrder));
  if (!presets.length) throw new Error("Empty profile catalog.");
  const prepared = [];
  // Validate every conversion before changing any published image.
  for (const [index, preset] of presets.entries()) {
    stage = `prepare ${index + 1}/${presets.length}`;
    if (!preset.objectPath) throw new Error("Unexpected non-uploaded avatar.");
    const file = await storage.getObjectEntityFile(preset.objectPath);
    const [metadata] = await file.getMetadata();
    if (metadata.contentType !== "image/png") throw new Error("Unexpected original format.");
    const [original] = await file.download({ validation: "crc32c" });
    const [afterDownload] = await file.getMetadata();
    if (metadata.generation !== afterDownload.generation) throw new Error("Concurrent image change.");
    const stem = `avatar-${String(preset.sortOrder + 1).padStart(2, "0")}`;
    const png = resolve(output, `${stem}.png`);
    const webp = resolve(output, `${stem}.webp`);
    await writeFile(png, original);
    execFileSync("magick", [png, "-define", "webp:lossless=true",
      "-define", "webp:exact=true", "-define", "webp:method=6", webp]);
    const originalPixels = rgba(png);
    const decodedPixels = rgba(webp);
    if (originalPixels.length !== 512 * 512 * 4 || hash(originalPixels) !== hash(decodedPixels)) {
      throw new Error("RGBA pixels changed during conversion.");
    }
    const encoded = await readFile(webp);
    if (encoded.length >= original.length) throw new Error("Conversion did not reduce image size.");
    const [upload] = await db.select().from(uploadsTable)
      .where(eq(uploadsTable.objectPath, preset.objectPath)).limit(1);
    if (!upload || upload.contentType !== "image/png" || upload.sizeBytes !== original.length) {
      throw new Error("Upload metadata does not match the original image.");
    }
    prepared.push({ preset, file, metadata, original, encoded, upload, pixelHash: hash(originalPixels) });
  }

  const report = [];
  for (const [index, image] of prepared.entries()) {
    stage = `apply ${index + 1}/${prepared.length}`;
    const { preset, file, metadata, original, encoded, upload } = image;
    const oldMetadata = {
      contentType: "image/png", metadata: metadata.metadata,
      ...(metadata.cacheControl ? { cacheControl: metadata.cacheControl } : {}),
    };
    let attemptedWrite = false;
    try {
      await db.transaction(async tx => {
        const [current] = await tx.select().from(coverPresetsTable)
          .where(eq(coverPresetsTable.id, preset.id)).for("update");
        if (!current || current.objectPath !== preset.objectPath) throw new Error("Concurrent catalog change.");
        await lockObjectPaths(tx, [preset.objectPath!]);
        const [currentUpload] = await tx.select().from(uploadsTable)
          .where(eq(uploadsTable.id, upload.id)).for("update");
        if (!currentUpload || currentUpload.contentType !== upload.contentType ||
          currentUpload.sizeBytes !== upload.sizeBytes) throw new Error("Concurrent upload change.");
        attemptedWrite = true;
        // Keep the URL and custom ACL metadata; existing selections continue to work.
        await file.save(encoded, {
          resumable: false, validation: "crc32c",
          preconditionOpts: { ifGenerationMatch: metadata.generation },
          metadata: { ...oldMetadata, contentType: "image/webp" },
        });
        const [stored] = await file.getMetadata();
        if (stored.contentType !== "image/webp" || Number(stored.size) !== encoded.length) {
          throw new Error("Stored WebP metadata mismatch.");
        }
        await tx.update(uploadsTable).set({
          name: upload.name.replace(/\.png$/i, ".webp"),
          contentType: "image/webp", sizeBytes: encoded.length,
        }).where(eq(uploadsTable.id, upload.id));
      });
    } catch (error) {
      // Compensate a failed database transaction only if this exact replacement is still present.
      if (attemptedWrite) {
        const [current] = await file.getMetadata();
        const encodedMd5 = createHash("md5").update(encoded).digest("base64");
        if (current.md5Hash === encodedMd5 && current.generation !== metadata.generation) {
          await file.save(original, {
            resumable: false, validation: "crc32c",
            preconditionOpts: { ifGenerationMatch: current.generation }, metadata: oldMetadata,
          });
        }
      }
      throw error;
    }
    report.push({
      id: preset.id, objectPath: preset.objectPath, beforeBytes: original.length,
      afterBytes: encoded.length, width: 512, height: 512, pixelHash: image.pixelHash,
    });
    // Persist progress so a partial failure is visible and never mistaken for full completion.
    await writeFile(resolve(output, "optimization-report.json"), JSON.stringify(report, null, 2));
    if ((index + 1) % 10 === 0) console.log(`Optimized ${index + 1}/${prepared.length}`);
  }
  const before = report.reduce((sum, image) => sum + image.beforeBytes, 0);
  const after = report.reduce((sum, image) => sum + image.afterBytes, 0);
  console.log(JSON.stringify({
    count: report.length, beforeBytes: before, afterBytes: after,
    reductionPercent: Math.round((1 - after / before) * 1000) / 10,
    minBytes: Math.min(...report.map(image => image.afterBytes)),
    maxBytes: Math.max(...report.map(image => image.afterBytes)),
    averageBytes: Math.round(after / report.length),
  }));
}

main().catch(error => {
  // Provider errors can include credentials; report only the safe stage and error type.
  console.error("Optimization stopped:", stage, error instanceof Error ? error.name : "UnknownError");
  process.exitCode = 1;
}).finally(() => pool.end());
