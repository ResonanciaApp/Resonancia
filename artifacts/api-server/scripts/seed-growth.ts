import { fileURLToPath } from "node:url";
import { objectStorageClient, ObjectStorageService } from "../src/lib/objectStorage";
import { initializeGrowthSchema } from "../src/lib/growthSchema";
import { growthSeedRows } from "../src/lib/growthSeed";
import { pool } from "@workspace/db";

async function main() {
  const publicDir = new ObjectStorageService().getPublicObjectSearchPaths()[0].replace(/^\/+/, "");
  const [bucket, ...prefix] = publicDir.split("/");
  for (const row of growthSeedRows) {
    const filename = row[5];
    const destination = [...prefix, "growth", filename].join("/");
    const file = objectStorageClient.bucket(bucket).file(destination);
    const [exists] = await file.exists();
    if (!exists) {
      await objectStorageClient.bucket(bucket).upload(fileURLToPath(new URL(`../../mobile/assets/images/growth/${filename}`, import.meta.url)), {
        destination, resumable: false, metadata: { contentType: "image/png" },
      });
    }
    console.log(`Imagen disponible: ${filename}`);
  }
  await initializeGrowthSchema();
  console.log("Tu camino inicializado sin reemplazar configuración existente.");
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => pool.end());
