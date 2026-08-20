import { Router, type IRouter, type Request, type Response } from "express";
import { Readable } from "stream";
import { getAuth } from "@clerk/express";
import {
  RequestUploadUrlBody,
  RequestUploadUrlResponse,
} from "@workspace/api-zod";
import { db, uploadsTable } from "@workspace/db";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";
import { ObjectPermission } from "../lib/objectAcl";
import { requireAuth } from "../middlewares/requireAuth";
import { resolveObjectReadAccess } from "../lib/objectAccess";

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

/** Tipos de archivo aceptados para subida (imágenes + audio). */
const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/aac",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/webm",
]);
const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // 15 MB
const MAX_AUDIO_BYTES = 200 * 1024 * 1024; // 200 MB

/**
 * POST /storage/uploads/request-url
 *
 * Request a presigned URL for file upload.
 * The client sends JSON metadata (name, size, contentType) — NOT the file.
 * Then uploads the file directly to the returned presigned URL.
 *
 * Requires an authenticated account: presigned upload URLs are a sensitive
 * action, so anonymous callers must not be able to obtain them.
 */
router.post("/storage/uploads/request-url", requireAuth, async (req: Request, res: Response) => {
  const parsed = RequestUploadUrlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Missing or invalid required fields" });
    return;
  }

  const { name, size, contentType } = parsed.data;
  const normalizedType = contentType.toLowerCase();
  if (!ALLOWED_CONTENT_TYPES.has(normalizedType)) {
    res.status(400).json({ error: "Tipo de archivo no permitido" });
    return;
  }
  const maxBytes = normalizedType.startsWith("image/") ? MAX_IMAGE_BYTES : MAX_AUDIO_BYTES;
  if (size > maxBytes) {
    res.status(413).json({ error: "El archivo supera el tamaño máximo permitido" });
    return;
  }

  try {
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

    // La URL nunca se entrega si no podemos asociarla al propietario. Sin este
    // registro el borrado de cuenta no tendría forma fiable de localizar el
    // objeto más tarde.
    try {
      await db.insert(uploadsTable).values({
        userId: req.currentUser!.id,
        objectPath,
        name,
        contentType,
        sizeBytes: size,
      });
    } catch (recordErr) {
      req.log.error({ err: recordErr }, "Failed to record upload metadata");
      await objectStorageService.deleteObjectEntity(objectPath).catch((cleanupErr) => {
        req.log.warn({ err: cleanupErr }, "Failed to clean unregistered upload path");
      });
      throw recordErr;
    }

    res.json(
      RequestUploadUrlResponse.parse({
        uploadURL,
        objectPath,
        metadata: { name, size, contentType },
      }),
    );
  } catch (error) {
    req.log.error({ err: error }, "Error generating upload URL");
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
});

/**
 * GET /storage/public-objects/*
 *
 * Serve public assets from PUBLIC_OBJECT_SEARCH_PATHS.
 * These are unconditionally public — no authentication or ACL checks.
 * IMPORTANT: Always provide this endpoint when object storage is set up.
 */
router.get("/storage/public-objects/*filePath", async (req: Request, res: Response) => {
  try {
    const raw = req.params.filePath;
    const filePath = Array.isArray(raw) ? raw.join("/") : raw;
    const file = await objectStorageService.searchPublicObject(filePath);
    if (!file) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    const response = await objectStorageService.downloadObject(file);

    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));

    if (response.body) {
      const nodeStream = Readable.fromWeb(response.body as ReadableStream<Uint8Array>);
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    req.log.error({ err: error }, "Error serving public object");
    res.status(500).json({ error: "Failed to serve public object" });
  }
});

/**
 * GET /storage/objects/*
 *
 * Serve object entities from PRIVATE_OBJECT_DIR.
 * These are served from a separate path from /public-objects and can optionally
 * be protected with authentication or ACL checks based on the use case.
 */
router.get("/storage/objects/*path", async (req: Request, res: Response) => {
  try {
    const raw = req.params.path;
    const wildcardPath = Array.isArray(raw) ? raw.join("/") : raw;
    const objectPath = `/objects/${wildcardPath}`;
    const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
    const clerkUserId = getAuth(req)?.userId ?? undefined;
    const databaseAccess = await resolveObjectReadAccess({
      objectPath,
      clerkUserId,
    });
    let aclAccess = false;
    if (databaseAccess === "denied") {
      try {
        aclAccess = await objectStorageService.canAccessObjectEntity({
          userId: clerkUserId,
          objectFile,
          requestedPermission: ObjectPermission.READ,
        });
      } catch (error) {
        req.log.warn({ err: error, objectPath }, "Invalid object ACL denied");
      }
    }
    if (databaseAccess === "denied" && !aclAccess) {
      res.status(clerkUserId ? 403 : 401).json({
        error: clerkUserId ? "No autorizado para acceder a este archivo" : "No autenticado",
      });
      return;
    }

    const [metadata] = await objectFile.getMetadata();
    const totalSize =
      typeof metadata.size === "string" ? parseInt(metadata.size, 10) : Number(metadata.size ?? 0);
    let contentType = (metadata.contentType as string) || "application/octet-stream";
    // Normalize non-standard audio MIME types that iOS AVPlayer rejects
    if (contentType === "audio/m4a" || contentType === "audio/x-m4a") {
      contentType = "audio/mp4";
    }

    res.setHeader("Content-Type", contentType);
    res.setHeader("Accept-Ranges", "bytes");
    const isPublic = databaseAccess === "public" || (!clerkUserId && aclAccess);
    res.setHeader("Cache-Control", `${isPublic ? "public" : "private"}, max-age=3600`);
    res.setHeader("Vary", "Authorization");

    const rangeHeader = req.headers.range;
    if (rangeHeader && totalSize > 0) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader);
      if (!match) {
        res.status(416).setHeader("Content-Range", `bytes */${totalSize}`).end();
        return;
      }
      const startStr = match[1];
      const endStr = match[2];
      let start = startStr ? parseInt(startStr, 10) : 0;
      let end = endStr ? parseInt(endStr, 10) : totalSize - 1;
      if (!startStr && endStr) {
        // suffix range: last N bytes
        start = Math.max(0, totalSize - parseInt(endStr, 10));
        end = totalSize - 1;
      }
      if (isNaN(start) || isNaN(end) || start > end || end >= totalSize) {
        res.status(416).setHeader("Content-Range", `bytes */${totalSize}`).end();
        return;
      }
      res.status(206);
      res.setHeader("Content-Range", `bytes ${start}-${end}/${totalSize}`);
      res.setHeader("Content-Length", String(end - start + 1));
      const stream = objectFile.createReadStream({ start, end });
      stream.on("error", (err) => {
        req.log.error({ err }, "Error streaming range");
        if (!res.headersSent) res.status(500).end();
        else res.destroy(err);
      });
      stream.pipe(res);
      return;
    }

    res.status(200);
    if (totalSize > 0) res.setHeader("Content-Length", String(totalSize));
    const stream = objectFile.createReadStream();
    stream.on("error", (err) => {
      req.log.error({ err }, "Error streaming object");
      if (!res.headersSent) res.status(500).end();
      else res.destroy(err);
    });
    stream.pipe(res);
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      req.log.warn({ err: error }, "Object not found");
      res.status(404).json({ error: "Object not found" });
      return;
    }
    req.log.error({ err: error }, "Error serving object");
    res.status(500).json({ error: "Failed to serve object" });
  }
});

export default router;
