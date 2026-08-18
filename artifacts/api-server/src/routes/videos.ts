import { Router, type IRouter } from "express";
import { and, asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db, catalogVideosTable, CATALOG_VIDEO_THEMES, type CatalogVideo } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";

const router: IRouter = Router();

// ── Schemas Zod (admin) ──────────────────────────────────────────────────────

const VideoIdParams = z.object({ id: z.coerce.number().int().positive() });

const CreateVideoBody = z.object({
  title: z.string().trim().min(1, "El título es requerido"),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  durationLabel: z.string().optional(),
  bunnyVideoId: z.string().trim().min(1, "El bunnyVideoId es requerido"),
  thumbnailObjectPath: z.string().nullable().optional(),
  author: z.string().optional(),
  theme: z.string().nullable().optional(),
  isPremium: z.boolean().optional(),
  isNew: z.boolean().optional(),
  status: z.enum(["published", "draft"]).optional(),
  sortOrder: z.number().int().optional(),
});

const UpdateVideoBody = CreateVideoBody.partial();

const UploadUrlBody = z.object({ title: z.string().optional() }).partial();

const BunnyIdParams = z.object({
  bunnyVideoId: z.string().trim().min(1).max(120),
});

const BUNNY_LIBRARY_ID = process.env.BUNNY_LIBRARY_ID ?? "";
const BUNNY_API_KEY = process.env.BUNNY_API_KEY ?? "";
const BUNNY_API_BASE = `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}`;

function serializeVideo(v: CatalogVideo) {
  return {
    id: v.id,
    title: v.title,
    subtitle: v.subtitle,
    description: v.description,
    durationLabel: v.durationLabel,
    bunnyVideoId: v.bunnyVideoId,
    thumbnailObjectPath: v.thumbnailObjectPath ?? null,
    author: v.author,
    theme: v.theme ?? null,
    isPremium: v.isPremium,
    isNew: v.isNew,
    status: v.status,
    sortOrder: v.sortOrder,
    createdAt: v.createdAt.toISOString(),
    updatedAt: v.updatedAt.toISOString(),
  };
}

// ── Helpers Bunny ─────────────────────────────────────────────────────────────

async function bunnyFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BUNNY_API_BASE}${path}`, {
    ...options,
    headers: {
      AccessKey: BUNNY_API_KEY,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  return res;
}

// ── Rutas públicas ────────────────────────────────────────────────────────────

// GET /videos — lista de videos publicados (mobile + cualquier cliente)
router.get("/videos", async (req, res) => {
  try {
    const videos = await db
      .select()
      .from(catalogVideosTable)
      .where(eq(catalogVideosTable.status, "published"))
      .orderBy(asc(catalogVideosTable.sortOrder), desc(catalogVideosTable.createdAt));
    res.json({ videos: videos.map(serializeVideo) });
  } catch (err) {
    req.log.error({ err }, "error listing videos");
    res.status(500).json({ error: "Error al obtener los videos" });
  }
});

// GET /videos/:id
router.get("/videos/:id", async (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }
  try {
    const [video] = await db
      .select()
      .from(catalogVideosTable)
      .where(eq(catalogVideosTable.id, id))
      .limit(1);
    if (!video || video.status !== "published") {
      res.status(404).json({ error: "Video no encontrado" });
      return;
    }
    res.json(serializeVideo(video));
  } catch (err) {
    req.log.error({ err }, "error getting video");
    res.status(500).json({ error: "Error al obtener el video" });
  }
});

// ── Rutas admin ───────────────────────────────────────────────────────────────

// GET /admin/videos — lista completa (admin)
router.get("/admin/videos", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const videos = await db
      .select()
      .from(catalogVideosTable)
      .orderBy(asc(catalogVideosTable.sortOrder), desc(catalogVideosTable.createdAt));
    res.json({ videos: videos.map(serializeVideo) });
  } catch (err) {
    req.log.error({ err }, "error listing admin videos");
    res.status(500).json({ error: "Error al obtener los videos" });
  }
});

// POST /admin/videos — crear registro de video (tras subirlo a Bunny)
router.post("/admin/videos", requireAuth, requireRole("admin"), async (req, res) => {
  const parsed = CreateVideoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
      details: parsed.error.issues,
    });
    return;
  }
  const {
    title,
    subtitle,
    description,
    durationLabel,
    bunnyVideoId,
    thumbnailObjectPath,
    author,
    theme,
    isPremium,
    isNew,
    status,
    sortOrder,
  } = parsed.data;

  if (theme && !(CATALOG_VIDEO_THEMES as readonly string[]).includes(theme)) {
    res.status(400).json({ error: "Tema inválido" });
    return;
  }

  try {
    const [created] = await db
      .insert(catalogVideosTable)
      .values({
        title,
        subtitle: subtitle?.trim() ?? "",
        description: description?.trim() ?? "",
        durationLabel: durationLabel?.trim() ?? "",
        bunnyVideoId,
        thumbnailObjectPath: thumbnailObjectPath ?? null,
        author: author?.trim() ?? "Casa del Cuenco",
        theme: theme?.trim() || null,
        isPremium: isPremium ?? false,
        isNew: isNew ?? false,
        status: status ?? "published",
        sortOrder: sortOrder ?? 0,
      })
      .returning();
    req.log.info({ videoId: created.id, bunnyVideoId }, "video created");
    res.status(201).json(serializeVideo(created));
  } catch (err) {
    req.log.error({ err }, "error creating video");
    res.status(500).json({ error: "Error al crear el video" });
  }
});

// PATCH /admin/videos/:id — actualizar metadata
router.patch("/admin/videos/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const params = VideoIdParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }
  const id = params.data.id;
  const parsedBody = UpdateVideoBody.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({ error: "Datos inválidos", details: parsedBody.error.issues });
    return;
  }
  try {
    const [existing] = await db
      .select()
      .from(catalogVideosTable)
      .where(eq(catalogVideosTable.id, id))
      .limit(1);
    if (!existing) {
      res.status(404).json({ error: "Video no encontrado" });
      return;
    }

    const body = parsedBody.data;
    if (body.theme && !(CATALOG_VIDEO_THEMES as readonly string[]).includes(body.theme)) {
      res.status(400).json({ error: "Tema inválido" });
      return;
    }
    const updates: Partial<typeof catalogVideosTable.$inferInsert> = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.subtitle !== undefined) updates.subtitle = body.subtitle;
    if (body.description !== undefined) updates.description = body.description;
    if (body.durationLabel !== undefined) updates.durationLabel = body.durationLabel;
    if (body.bunnyVideoId !== undefined) updates.bunnyVideoId = body.bunnyVideoId;
    if ("thumbnailObjectPath" in body) updates.thumbnailObjectPath = body.thumbnailObjectPath ?? null;
    if (body.author !== undefined) updates.author = body.author;
    if ("theme" in body) updates.theme = body.theme?.trim() || null;
    if (body.isPremium !== undefined) updates.isPremium = body.isPremium;
    if (body.isNew !== undefined) updates.isNew = body.isNew;
    if (body.status !== undefined) updates.status = body.status;
    if (body.sortOrder !== undefined) updates.sortOrder = body.sortOrder;

    const [updated] = await db
      .update(catalogVideosTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(catalogVideosTable.id, id))
      .returning();
    res.json(serializeVideo(updated));
  } catch (err) {
    req.log.error({ err }, "error updating video");
    res.status(500).json({ error: "Error al actualizar el video" });
  }
});

// DELETE /admin/videos/:id — borrar registro + video en Bunny
router.delete("/admin/videos/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const params = VideoIdParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }
  const id = params.data.id;
  try {
    const [existing] = await db
      .select()
      .from(catalogVideosTable)
      .where(eq(catalogVideosTable.id, id))
      .limit(1);
    if (!existing) {
      res.status(404).json({ error: "Video no encontrado" });
      return;
    }

    // Borrar en Bunny (no crítico — si falla, seguimos)
    if (BUNNY_LIBRARY_ID && BUNNY_API_KEY) {
      try {
        const bunnyRes = await bunnyFetch(`/videos/${existing.bunnyVideoId}`, {
          method: "DELETE",
        });
        if (!bunnyRes.ok) {
          req.log.warn(
            { bunnyVideoId: existing.bunnyVideoId, status: bunnyRes.status },
            "bunny delete failed (non-critical)",
          );
        }
      } catch (bunnyErr) {
        req.log.warn({ err: bunnyErr }, "bunny delete error (non-critical)");
      }
    }

    await db.delete(catalogVideosTable).where(eq(catalogVideosTable.id, id));
    req.log.info({ videoId: id, bunnyVideoId: existing.bunnyVideoId }, "video deleted");
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "error deleting video");
    res.status(500).json({ error: "Error al eliminar el video" });
  }
});

// POST /admin/videos/bunny/upload-url — crear video en Bunny y obtener URL de upload
router.post(
  "/admin/videos/bunny/upload-url",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    const parsed = UploadUrlBody.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({ error: "Datos inválidos", details: parsed.error.issues });
      return;
    }
    const { title } = parsed.data;
    if (!BUNNY_LIBRARY_ID || !BUNNY_API_KEY) {
      res.status(503).json({ error: "Bunny no configurado (falta BUNNY_LIBRARY_ID o BUNNY_API_KEY)" });
      return;
    }
    try {
      const bunnyRes = await bunnyFetch("/videos", {
        method: "POST",
        body: JSON.stringify({ title: title?.trim() || "Sin título" }),
      });
      if (!bunnyRes.ok) {
        const text = await bunnyRes.text();
        req.log.error({ status: bunnyRes.status, body: text }, "bunny create video failed");
        res.status(502).json({ error: "Error al crear el video en Bunny" });
        return;
      }
      const data = (await bunnyRes.json()) as { guid: string };
      const uploadUrl = `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${data.guid}`;
      res.json({
        bunnyVideoId: data.guid,
        uploadUrl,
        uploadMethod: "PUT",
        uploadHeaders: { AccessKey: BUNNY_API_KEY },
      });
    } catch (err) {
      req.log.error({ err }, "error creating bunny video");
      res.status(500).json({ error: "Error al preparar el upload" });
    }
  },
);

// GET /admin/videos/bunny/:bunnyVideoId/status — estado de procesamiento en Bunny
router.get(
  "/admin/videos/bunny/:bunnyVideoId/status",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    const params = BunnyIdParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: "ID de Bunny inválido" });
      return;
    }
    const { bunnyVideoId } = params.data;
    if (!BUNNY_LIBRARY_ID || !BUNNY_API_KEY) {
      res.status(503).json({ error: "Bunny no configurado" });
      return;
    }
    try {
      const bunnyRes = await bunnyFetch(`/videos/${bunnyVideoId}`);
      if (!bunnyRes.ok) {
        res.status(bunnyRes.status).json({ error: "Video no encontrado en Bunny" });
        return;
      }
      const data = (await bunnyRes.json()) as {
        guid: string;
        status: number;
        length: number;
        framerate: number;
        width: number;
        height: number;
        availableResolutions: string | null;
      };
      // Bunny status codes: 0=Created, 1=Uploaded, 2=Processing, 3=Transcoding, 4=Finished, 5=Error, 6=UploadFailed
      res.json({
        bunnyVideoId: data.guid,
        status: data.status,
        ready: data.status === 4,
        lengthSeconds: data.length,
        framerate: data.framerate,
        width: data.width,
        height: data.height,
        availableResolutions: data.availableResolutions,
      });
    } catch (err) {
      req.log.error({ err }, "error getting bunny video status");
      res.status(500).json({ error: "Error al consultar el estado en Bunny" });
    }
  },
);

export default router;
