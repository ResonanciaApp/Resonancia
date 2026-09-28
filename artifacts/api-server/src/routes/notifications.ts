import { Router, type IRouter } from "express";
import { and, asc, desc, eq, isNotNull, isNull, ne, sql } from "drizzle-orm";
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

type NotificationSessionPreview = Pick<
  typeof catalogSessionsTable.$inferSelect,
  "title" | "imageUrl" | "categoryLabel"
>;

function getNotificationSessionLabel(
  message: string | null,
  session: NotificationSessionPreview | null,
) {
  if (!session || !message) return session?.categoryLabel ?? null;

  for (const [prefix, suffix] of [
    ["Subimos una sesión de la categoría ", `, se llama "${session.title}"`],
    ["Subimos una sesión de la temática ", `, se llama "${session.title}"`],
    ["Hemos subido una nueva sesión de la categoría ", `, se llama ${session.title}.`],
    ["Hemos subido una nueva sesión de la temática ", `, se llama ${session.title}.`],
  ] as const) {
    if (message.startsWith(prefix) && message.endsWith(suffix)) {
      return message.slice(prefix.length, -suffix.length);
    }
  }

  const simplifiedPrefix = "Hemos subido una nueva sesión de ";
  const simplifiedSuffix = `: ${session.title}`;
  if (message.startsWith(simplifiedPrefix) && message.endsWith(simplifiedSuffix)) {
    return message.slice(simplifiedPrefix.length, -simplifiedSuffix.length);
  }

  const quotedPrefix = 'Hemos subido a Resonancia una nueva sesión de "';
  const quotedSuffix = `": "${session.title}"`;
  if (message.startsWith(quotedPrefix) && message.endsWith(quotedSuffix)) {
    return message.slice(quotedPrefix.length, -quotedSuffix.length);
  }

  // Compatibilidad con avisos creados antes del nuevo texto.
  const legacyPrefix = "Nueva sesión de ";
  const legacySuffix = `: ${session.title}`;
  if (message.startsWith(legacyPrefix) && message.endsWith(legacySuffix)) {
    return message.slice(legacyPrefix.length, -legacySuffix.length);
  }

  return session.categoryLabel;
}

function getNotificationSessionMessage(
  message: string | null,
  session: NotificationSessionPreview | null,
  label: string | null,
) {
  if (!session || !label) return message;
  const isEditorial =
    message?.startsWith("Subimos una sesión de la temática ") ||
    message?.startsWith("Hemos subido una nueva sesión de la temática ") ||
    label !== session.categoryLabel;
  const labelType = isEditorial ? "temática" : "categoría";
  return `Subimos una sesión de la ${labelType} ${label}, se llama "${session.title}"`;
}

function serialize(
  n: Notification,
  actor: User | null,
  session: NotificationSessionPreview | null,
) {
  const sessionLabel = getNotificationSessionLabel(n.message, session);
  return {
    id: n.id,
    type: n.type,
    entityId: n.entityId,
    sessionId: n.sessionId,
    message: n.type === "session_published"
      ? getNotificationSessionMessage(n.message, session, sessionLabel)
      : n.message,
    createdAt: n.createdAt.toISOString(),
    readAt: n.readAt ? n.readAt.toISOString() : null,
    actor: actor ? toProfile(actor) : null,
    sessionTitle: session?.title ?? null,
    sessionImageUrl: session?.imageUrl ?? null,
    sessionLabel,
  };
}

async function getPreferenceOptions() {
  const [categories, sessions] = await Promise.all([
    db.select({ id: catalogCategoriesTable.id, label: catalogCategoriesTable.title })
      .from(catalogCategoriesTable)
      .where(
        and(
          eq(catalogCategoriesTable.isPrimary, true),
          ne(catalogCategoriesTable.id, "reflexiones"),
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
      .select({ n: notificationsTable, actor: usersTable, session: catalogSessionsTable })
      .from(notificationsTable)
      .leftJoin(usersTable, eq(usersTable.id, notificationsTable.actorUserId))
      .leftJoin(catalogSessionsTable, eq(catalogSessionsTable.id, notificationsTable.sessionId))
      .where(eq(notificationsTable.userId, me.id))
      .orderBy(desc(notificationsTable.createdAt))
      .limit(50);
    res.json(rows.map((r) => serialize(r.n, r.actor, r.session)));
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
      .where(
        and(
          eq(notificationsTable.userId, me.id),
          eq(notificationsTable.type, "session_published"),
          isNull(notificationsTable.readAt),
        ),
      );
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

router.delete("/notifications/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    res.status(400).json({ error: "ID de notificación inválido" });
    return;
  }
  try {
    const [deleted] = await db
      .delete(notificationsTable)
      .where(and(
        eq(notificationsTable.id, id),
        eq(notificationsTable.userId, req.currentUser!.id),
        isNotNull(notificationsTable.readAt),
      ))
      .returning({ id: notificationsTable.id });
    if (!deleted) {
      res.status(404).json({ error: "Notificación no encontrada o aún sin leer" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al eliminar notificación" });
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
