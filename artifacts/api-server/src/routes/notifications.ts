import { Router, type IRouter } from "express";
import { and, asc, desc, eq, isNull, ne, sql } from "drizzle-orm";
import {
  db,
  catalogCategoriesTable,
  catalogSessionsTable,
  notificationsTable,
  notificationPreferencesTable,
  usersTable,
  NOTIFICATION_TYPES,
  type Notification,
  type User,
} from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { z } from "zod";
import { getInternalEditorialTagOption } from "../lib/publication-notification-matching";

const router: IRouter = Router();

function toProfile(u: User) {
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    avatarPresetId: u.avatarPresetId ?? null,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
  };
}

function serialize(n: Notification, actor: User | null) {
  return {
    id: n.id,
    type: n.type,
    entityId: n.entityId,
    sessionId: n.sessionId,
    message: n.message,
    createdAt: n.createdAt.toISOString(),
    readAt: n.readAt ? n.readAt.toISOString() : null,
    actor: actor ? toProfile(actor) : null,
  };
}

async function getPreferenceOptions() {
  const [categories, sessions] = await Promise.all([
    db.select({ id: catalogCategoriesTable.id, label: catalogCategoriesTable.title })
      .from(catalogCategoriesTable)
      .where(
        and(
          eq(catalogCategoriesTable.isPrimary, true),
          ne(catalogCategoriesTable.id, "charlas"),
        ),
      )
      .orderBy(asc(catalogCategoriesTable.sortOrder), asc(catalogCategoriesTable.title)),
    db.select({
      themeTag: catalogSessionsTable.themeTag,
      temaTag: catalogSessionsTable.temaTag,
      sonidosTags: catalogSessionsTable.sonidosTags,
      descansoTags: catalogSessionsTable.descansoTags,
    }).from(catalogSessionsTable),
  ]);
  const tags = new Map<string, string>();
  for (const session of sessions) {
    for (const tag of [
      ...(session.themeTag ?? []),
      ...(session.temaTag ?? []),
      ...session.sonidosTags,
      ...session.descansoTags,
    ]) {
      const option = getInternalEditorialTagOption(tag);
      if (option) tags.set(option.id, option.label);
    }
  }
  return {
    categoryOptions: categories,
    editorialTagOptions: [...tags].map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "es")),
  };
}

const preferencesBody = z.object({
  selectedCategoryIds: z.array(z.string().trim()).max(100),
  selectedEditorialTags: z.array(z.string().trim()).max(500),
});

router.get("/notifications", requireAuth, async (req, res) => {
  const me = req.currentUser!;
  try {
    const rows = await db
      .select({ n: notificationsTable, actor: usersTable })
      .from(notificationsTable)
      .leftJoin(usersTable, eq(usersTable.id, notificationsTable.actorUserId))
      .where(eq(notificationsTable.userId, me.id))
      .orderBy(desc(notificationsTable.createdAt))
      .limit(50);
    res.json(rows.map((r) => serialize(r.n, r.actor)));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al obtener notificaciones" });
  }
});

router.get("/notification-preferences", requireAuth, async (req, res) => {
  try {
    const me = req.currentUser!;
    const [options, savedRows] = await Promise.all([
      getPreferenceOptions(),
      db.select().from(notificationPreferencesTable)
        .where(eq(notificationPreferencesTable.userId, me.id)).limit(1),
    ]);
    const saved = savedRows[0];
    const availableCategoryIds = new Set(options.categoryOptions.map((option) => option.id));
    res.json({
      selectedCategoryIds: (saved?.selectedCategoryIds ?? []).filter((id) =>
        availableCategoryIds.has(id),
      ),
      selectedEditorialTags: saved?.selectedEditorialTags ?? [],
      ...options,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al obtener preferencias de notificaciones" });
  }
});

router.put("/notification-preferences", requireAuth, async (req, res) => {
  const parsed = preferencesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Selecciones inválidas" });
    return;
  }
  try {
    const me = req.currentUser!;
    const options = await getPreferenceOptions();
    const categoryIds = new Set(options.categoryOptions.map((option) => option.id));
    const editorialTags = new Set(options.editorialTagOptions.map((option) => option.id));
    const selectedCategoryIds = [...new Set(parsed.data.selectedCategoryIds)];
    const selectedEditorialTags = [...new Set(parsed.data.selectedEditorialTags)];
    if (
      selectedCategoryIds.some((id) => !categoryIds.has(id)) ||
      selectedEditorialTags.some((tag) => !editorialTags.has(tag))
    ) {
      res.status(400).json({ error: "Una o más opciones ya no están disponibles" });
      return;
    }
    await db.insert(notificationPreferencesTable).values({
      userId: me.id, selectedCategoryIds, selectedEditorialTags, updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: notificationPreferencesTable.userId,
      set: { selectedCategoryIds, selectedEditorialTags, updatedAt: new Date() },
    });
    res.json({ selectedCategoryIds, selectedEditorialTags, ...options });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al guardar preferencias de notificaciones" });
  }
});

router.get("/notifications/unread-count", requireAuth, async (req, res) => {
  const me = req.currentUser!;
  try {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notificationsTable)
      .where(and(eq(notificationsTable.userId, me.id), isNull(notificationsTable.readAt)));
    res.json({ count: row?.count ?? 0 });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error" });
  }
});

router.post("/notifications/read-all", requireAuth, async (req, res) => {
  const me = req.currentUser!;
  try {
    await db
      .update(notificationsTable)
      .set({ readAt: new Date() })
      .where(and(eq(notificationsTable.userId, me.id), isNull(notificationsTable.readAt)));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error" });
  }
});

// ── DEV ONLY: seed one notification of each type for the current user ─────────
router.post("/notifications/seed-dev", requireAuth, async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const me = req.currentUser!;
  try {
    // Remove any previous seed (self-as-actor) so we can re-seed cleanly.
    await db
      .delete(notificationsTable)
      .where(
        and(
          eq(notificationsTable.userId, me.id),
          eq(notificationsTable.actorUserId, me.id),
        ),
      );

    // Insert one notification per type; entityId=1 for types that use it.
    const ENTITY_TYPES = new Set(["mix_like", "mix_comment", "group_message"]);
    await db.insert(notificationsTable).values(
      NOTIFICATION_TYPES.map((type) => ({
        userId: me.id,
        actorUserId: me.id,
        type,
        entityId: ENTITY_TYPES.has(type) ? 1 : null,
      })),
    );

    res.json({ ok: true, count: NOTIFICATION_TYPES.length });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al sembrar notificaciones" });
  }
});

export default router;
