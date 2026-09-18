import sharp from "sharp";
import { InspirationError, validImageSignature } from "./inspirationPolicy";

/** Fully decode before publication, with a strict pixel/resource budget.
 * A MIME/header check alone would accept truncated/unusable image files.
 */
export async function validateInspirationImage(bytes: Buffer, contentType: string) {
  if (bytes.length < 4 || bytes.length > 15 * 1024 * 1024 || !validImageSignature(bytes, contentType)) {
    throw new InspirationError(400, "Archivo de imagen inválido");
  }
  try {
    const image = sharp(bytes, { limitInputPixels: 25_000_000, failOn: "warning", animated: false });
    const metadata = await image.metadata();
    const expected = { "image/jpeg": "jpeg", "image/png": "png", "image/webp": "webp" }[contentType];
    if (metadata.format !== expected || !metadata.width || !metadata.height || metadata.width > 10000 || metadata.height > 10000 || (metadata.pages ?? 1) > 1) throw new Error("Invalid image dimensions/format");
    await image.resize(1, 1).raw().toBuffer();
  } catch {
    throw new InspirationError(400, "No se puede leer la imagen. Usa JPEG, PNG o WebP estático de hasta 25 megapíxeles.");
  }
}