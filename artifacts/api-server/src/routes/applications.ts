import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { and, desc, eq } from "drizzle-orm";
import { db, applicationsTable, type Application } from "@workspace/db";
import {
  CreateApplicationBody,
  GetAdminApplicationsQueryParams,
  UpdateApplicationStatusParams,
  UpdateApplicationStatusBody,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";

const router: IRouter = Router();

function serialize(row: Application) {
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    location: row.location,
    phone: row.phone,
    aporte: row.aporte,
    services: row.services,
    audioPath: row.audioPath,
    status: row.status,
    userId: row.userId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * POST /applications — recibir una postulación (Resonador o Expansor).
 * Público: no exige sesión, pero si el usuario está autenticado se guarda su
 * Clerk user id para poder vincular la postulación con su cuenta.
 */
router.post("/applications", async (req, res) => {
  const parsed = CreateApplicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos" });
    return;
  }

  if (parsed.data.type === "resonador" && !parsed.data.audioPath) {
    res.status(400).json({ error: "Falta el audio de muestra" });
    return;
  }
  if (parsed.data.type === "expansor" && !parsed.data.location) {
    res.status(400).json({ error: "Falta la ubicación" });
    return;
  }

  const auth = getAuth(req);
  const userId = auth?.userId ?? null;

  try {
    const [row] = await db
      .insert(applicationsTable)
      .values({
        type: parsed.data.type,
        name: parsed.data.name,
        location: parsed.data.location ?? null,
        phone: parsed.data.phone,
        aporte: parsed.data.aporte,
        services: parsed.data.services ?? null,
        audioPath: parsed.data.audioPath ?? null,
        userId,
      })
      .returning();
    res.status(201).json(serialize(row));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "No se pudo registrar la postulación" });
  }
});

/**
 * GET /admin/applications — listar postulaciones (admin).
 */
router.get(
  "/admin/applications",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    const parsed = GetAdminApplicationsQueryParams.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: "Parámetros inválidos" });
      return;
    }

    const filters = [];
    if (parsed.data.status) {
      filters.push(eq(applicationsTable.status, parsed.data.status));
    }
    if (parsed.data.type) {
      filters.push(eq(applicationsTable.type, parsed.data.type));
    }

    try {
      const rows = await db
        .select()
        .from(applicationsTable)
        .where(filters.length ? and(...filters) : undefined)
        .orderBy(desc(applicationsTable.createdAt));
      res.json({ applications: rows.map(serialize) });
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "No se pudieron cargar las postulaciones" });
    }
  },
);

/**
 * PATCH /admin/applications/:id — cambiar el estado de una postulación (admin).
 */
router.patch(
  "/admin/applications/:id",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    const params = UpdateApplicationStatusParams.safeParse(req.params);
    const body = UpdateApplicationStatusBody.safeParse(req.body);
    if (!params.success || !body.success) {
      res.status(400).json({ error: "Datos inválidos" });
      return;
    }

    try {
      const [row] = await db
        .update(applicationsTable)
        .set({ status: body.data.status })
        .where(eq(applicationsTable.id, params.data.id))
        .returning();
      if (!row) {
        res.status(404).json({ error: "Postulación no encontrada" });
        return;
      }
      res.json(serialize(row));
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "No se pudo actualizar la postulación" });
    }
  },
);

export default router;
