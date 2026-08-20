import { Router, type IRouter } from "express";
import { and, desc, eq, ilike, inArray, ne, or, sql } from "drizzle-orm";
import { clerkClient, getAuth } from "@clerk/express";
import {
  accountDeletionsTable,
  applicationsTable,
  db,
  usersTable,
  friendshipsTable,
  followsTable,
  playbackHistoryTable,
  expansorProfilesTable,
  userLibraryTable,
  uploadsTable,
  messagesTable,
  liveSessionsTable,
  resonadoresTable,
  type User,
} from "@workspace/db";
import {
  DeleteMyAccountBody,
  UpdateMeBody,
  SearchUsersQueryParams,
  SetUserRoleBody,
  UpdateMyExpansorProfileBody,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import {
  OBJECT_UPLOAD_URL_TTL_SEC,
  ObjectStorageService,
} from "../lib/objectStorage";
import { accountIdentityHash } from "../lib/accountDeletion";
import { canUserReferenceObject } from "../lib/objectAccess";

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

function toProfile(u: User) {
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    location: u.location ?? null,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
  };
}

router.get("/me", requireAuth, async (req, res) => {
  res.json(toProfile(req.currentUser!));
});

router.patch("/me", requireAuth, async (req, res) => {
  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos" });
    return;
  }
  const me = req.currentUser!;
  if (
    parsed.data.avatarUrl !== undefined &&
    parsed.data.avatarUrl !== null &&
    !(await canUserReferenceObject({
      objectPath: parsed.data.avatarUrl,
      userId: me.id,
      clerkUserId: me.clerkUserId,
      role: me.role,
    }))
  ) {
    res.status(403).json({ error: "No podés usar un archivo que no te pertenece" });
    return;
  }
  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (parsed.data.username !== undefined) updates.username = parsed.data.username;
  if (parsed.data.displayName !== undefined) updates.displayName = parsed.data.displayName;
  if (parsed.data.avatarUrl !== undefined) updates.avatarUrl = parsed.data.avatarUrl;
  if (parsed.data.location !== undefined) updates.location = parsed.data.location;

  if (Object.keys(updates).length === 0) {
    res.json(toProfile(me));
    return;
  }

  try {
    const [updated] = await db
      .update(usersTable)
      .set(updates)
      .where(eq(usersTable.id, me.id))
      .returning();
    res.json(toProfile(updated));
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === "23505") {
      res.status(409).json({ error: "Ese nombre de usuario ya está en uso" });
      return;
    }
    req.log.error(err);
    res.status(500).json({ error: "Error al actualizar el perfil" });
  }
});

router.get("/me/export", requireAuth, async (req, res) => {
  const me = req.currentUser!;

  try {
    const result = await db.execute(sql`
      SELECT jsonb_build_object(
        'account', to_jsonb(u),
        'activity', jsonb_build_object(
          'playbackHistory', COALESCE((
            SELECT jsonb_agg(to_jsonb(t) ORDER BY t.created_at)
            FROM playback_history t WHERE t.user_id = u.id
          ), '[]'::jsonb),
          'favorites', COALESCE((
            SELECT jsonb_agg(to_jsonb(t) ORDER BY t.created_at)
            FROM favorites t WHERE t.user_id = u.id
          ), '[]'::jsonb),
          'sessionProgress', COALESCE((
            SELECT jsonb_agg(to_jsonb(t) ORDER BY t.updated_at)
            FROM session_progress t WHERE t.user_id = u.id
          ), '[]'::jsonb),
          'milestones', COALESCE((
            SELECT jsonb_agg(to_jsonb(t) ORDER BY t.unlocked_at)
            FROM user_milestones t WHERE t.user_id = u.id
          ), '[]'::jsonb),
          'communityEvents', COALESCE((
            SELECT jsonb_agg(to_jsonb(t) ORDER BY t.created_at)
            FROM community_activity_events t WHERE t.user_id = u.id
          ), '[]'::jsonb)
        ),
        'library', COALESCE((
          SELECT to_jsonb(t) FROM user_library t WHERE t.user_id = u.id LIMIT 1
        ), '{}'::jsonb),
        'social', jsonb_build_object(
          'friendships', COALESCE((
            SELECT jsonb_agg(to_jsonb(t) ORDER BY t.created_at)
            FROM friendships t
            WHERE t.requester_id = u.id OR t.addressee_id = u.id
          ), '[]'::jsonb),
          'follows', COALESCE((
            SELECT jsonb_agg(to_jsonb(t) ORDER BY t.created_at)
            FROM follows t
            WHERE t.follower_id = u.id OR t.following_id = u.id
          ), '[]'::jsonb),
          'directMessages', COALESCE((
            SELECT jsonb_agg(to_jsonb(t) ORDER BY t.created_at)
            FROM direct_messages t
            WHERE t.sender_id = u.id OR t.recipient_id = u.id
          ), '[]'::jsonb),
          'wallMessages', COALESCE((
            SELECT jsonb_agg(to_jsonb(t) ORDER BY t.created_at)
            FROM messages t WHERE t.author_clerk_id = u.clerk_user_id
          ), '[]'::jsonb),
          'messageLikes', COALESCE((
            SELECT jsonb_agg(to_jsonb(t))
            FROM message_likes t WHERE t.user_id = u.id
          ), '[]'::jsonb),
          'sharedMixes', COALESCE((
            SELECT jsonb_agg(to_jsonb(t) ORDER BY t.created_at)
            FROM shared_mixes t WHERE t.author_id = u.id
          ), '[]'::jsonb),
          'sharedMixComments', COALESCE((
            SELECT jsonb_agg(to_jsonb(t) ORDER BY t.created_at)
            FROM shared_mix_comments t WHERE t.author_id = u.id
          ), '[]'::jsonb),
          'sharedMixLikes', COALESCE((
            SELECT jsonb_agg(to_jsonb(t))
            FROM shared_mix_likes t WHERE t.user_id = u.id
          ), '[]'::jsonb),
          'sharedMixReports', COALESCE((
            SELECT jsonb_agg(to_jsonb(t) ORDER BY t.created_at)
            FROM shared_mix_reports t WHERE t.reporter_id = u.id
          ), '[]'::jsonb),
          'sharedGlyphs', COALESCE((
            SELECT jsonb_agg(to_jsonb(t) ORDER BY t.created_at)
            FROM shared_glyphs t WHERE t.author_id = u.id
          ), '[]'::jsonb),
          'sharedGlyphLikes', COALESCE((
            SELECT jsonb_agg(to_jsonb(t))
            FROM shared_glyph_likes t WHERE t.user_id = u.id
          ), '[]'::jsonb)
        ),
        'notifications', COALESCE((
          SELECT jsonb_agg(to_jsonb(t) ORDER BY t.created_at)
          FROM notifications t
          WHERE t.user_id = u.id OR t.actor_user_id = u.id
        ), '[]'::jsonb),
        'pushTokens', COALESCE((
          SELECT jsonb_agg(to_jsonb(t) ORDER BY t.created_at)
          FROM push_tokens t WHERE t.user_id = u.id
        ), '[]'::jsonb),
        'uploads', COALESCE((
          SELECT jsonb_agg(to_jsonb(t) ORDER BY t.created_at)
          FROM uploads t WHERE t.user_id = u.id
        ), '[]'::jsonb),
        'creatorProfiles', jsonb_build_object(
          'expansor', COALESCE((
            SELECT to_jsonb(t) FROM expansor_profiles t WHERE t.user_id = u.id LIMIT 1
          ), '{}'::jsonb),
          'resonador', COALESCE((
            SELECT to_jsonb(t) FROM resonadores t WHERE t.clerk_id = u.clerk_user_id LIMIT 1
          ), '{}'::jsonb)
        ),
        'liveSessions', COALESCE((
          SELECT jsonb_agg(to_jsonb(t) ORDER BY t.scheduled_at)
          FROM live_sessions t WHERE t.clerk_user_id = u.clerk_user_id
        ), '[]'::jsonb),
        'applications', COALESCE((
          SELECT jsonb_agg(to_jsonb(t) ORDER BY t.created_at)
          FROM applications t WHERE t.user_id = u.clerk_user_id
        ), '[]'::jsonb)
      ) AS data
      FROM users u
      WHERE u.id = ${me.id}
      LIMIT 1
    `);

    const row = result.rows[0] as { data?: Record<string, unknown> } | undefined;
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Disposition", 'attachment; filename="resonancia-datos.json"');
    res.json({
      formatVersion: 1,
      exportedAt: new Date().toISOString(),
      data: row?.data ?? {},
    });
  } catch (err) {
    req.log.error({ err }, "Failed to export account data");
    res.status(500).json({ error: "No se pudieron exportar tus datos" });
  }
});

async function deleteClerkUserWithRetry(clerkUserId: string): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await clerkClient.users.deleteUser(clerkUserId);
      return;
    } catch (error) {
      const status = (error as { status?: number })?.status;
      if (status === 404) return;
      lastError = error;
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 150 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

function ownedObjectPath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const marker = "/objects/";
  const markerIndex = value.indexOf(marker);
  if (markerIndex === -1) return null;
  return value.slice(markerIndex).split(/[?#]/, 1)[0] ?? null;
}

async function loadAccountDeletion(identityHash: string) {
  const [deletion] = await db
    .select()
    .from(accountDeletionsTable)
    .where(eq(accountDeletionsTable.identityHash, identityHash))
    .limit(1);
  return deletion;
}

router.delete("/me", async (req, res) => {
  const parsed = DeleteMyAccountBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Escribe "ELIMINAR" para confirmar' });
    return;
  }

  const clerkUserId = getAuth(req)?.userId;
  if (!clerkUserId) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }
  const identityHash = accountIdentityHash(clerkUserId);

  try {
    const [existingUser] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.clerkUserId, clerkUserId))
      .limit(1);
    let deletion = await loadAccountDeletion(identityHash);
    if (!existingUser && !deletion) {
      res.status(404).json({ error: "Cuenta no encontrada" });
      return;
    }

    if (!deletion) {
      await db
        .insert(accountDeletionsTable)
        .values({ identityHash, status: "pending" })
        .onConflictDoNothing();
      deletion = await loadAccountDeletion(identityHash);
    }
    if (!deletion) {
      throw new Error("Could not create account deletion tombstone");
    }

    if (deletion.status === "pending") {
      await db.transaction(async (tx) => {
        const [lockedDeletion] = await tx
          .select()
          .from(accountDeletionsTable)
          .where(eq(accountDeletionsTable.identityHash, identityHash))
          .for("update")
          .limit(1);
        if (!lockedDeletion || lockedDeletion.status !== "pending") {
          return;
        }

        // Cal.com webhooks use the same key and must revalidate the tombstone
        // only after acquiring it, preventing PII from racing past deletion.
        await tx.execute(sql`
          SELECT pg_advisory_xact_lock(hashtextextended(${identityHash}, 0))
        `);

        // Lock the root row before taking the final snapshot. FK-backed writes
        // cannot race past this point and all of them cascade in the same tx.
        const locked = await tx.execute(sql`
          SELECT id FROM users
          WHERE clerk_user_id = ${clerkUserId}
          FOR UPDATE
        `);
        const lockedUserIdRaw = (locked.rows[0] as { id?: number } | undefined)?.id;
        const userId = lockedUserIdRaw === undefined ? null : Number(lockedUserIdRaw);

        const objectPaths = new Set(lockedDeletion.objectPaths);
        const liveSessionUids = new Set(lockedDeletion.liveSessionUids);
        let storageCleanupAfter =
          lockedDeletion.storageCleanupAfter?.getTime() ?? 0;
        const addPath = (value: unknown) => {
          const path = ownedObjectPath(value);
          if (path) objectPaths.add(path);
        };

        if (userId !== null) {
          const uploadRows = await tx
            .select({
              objectPath: uploadsTable.objectPath,
              createdAt: uploadsTable.createdAt,
            })
            .from(uploadsTable)
            .where(eq(uploadsTable.userId, userId));
          for (const row of uploadRows) {
            addPath(row.objectPath);
            storageCleanupAfter = Math.max(
              storageCleanupAfter,
              row.createdAt.getTime() + OBJECT_UPLOAD_URL_TTL_SEC * 1_000 + 30_000,
            );
          }

          const [expansor] = await tx
            .select({ photos: expansorProfilesTable.photos })
            .from(expansorProfilesTable)
            .where(eq(expansorProfilesTable.userId, userId))
            .limit(1);
          expansor?.photos.forEach(addPath);
        }

        const applicationRows = await tx
          .select({ audioPath: applicationsTable.audioPath })
          .from(applicationsTable)
          .where(eq(applicationsTable.userId, clerkUserId));
        applicationRows.forEach((row) => addPath(row.audioPath));

        const bookingRows = await tx
          .select({ calEventUid: liveSessionsTable.calEventUid })
          .from(liveSessionsTable)
          .where(eq(liveSessionsTable.clerkUserId, clerkUserId));
        for (const row of bookingRows) {
          liveSessionUids.add(row.calEventUid);
          await tx.execute(sql`
            SELECT pg_advisory_xact_lock(
              hashtextextended(${"cal-booking:" + row.calEventUid}, 0)
            )
          `);
        }

        const resonadorRows = await tx
          .select({
            photoUrl: resonadoresTable.photoUrl,
            coverPhotoUrl: resonadoresTable.coverPhotoUrl,
            photos: resonadoresTable.photos,
          })
          .from(resonadoresTable)
          .where(eq(resonadoresTable.clerkId, clerkUserId));
        for (const profile of resonadorRows) {
          addPath(profile.photoUrl);
          addPath(profile.coverPhotoUrl);
          profile.photos.forEach(addPath);
        }

        await tx.delete(messagesTable).where(eq(messagesTable.authorClerkId, clerkUserId));
        await tx.delete(applicationsTable).where(eq(applicationsTable.userId, clerkUserId));
        await tx
          .update(liveSessionsTable)
          .set({
            clerkUserId: null,
            attendeeName: null,
            attendeeEmail: null,
            notes: null,
          })
          .where(eq(liveSessionsTable.clerkUserId, clerkUserId));
        await tx.delete(resonadoresTable).where(eq(resonadoresTable.clerkId, clerkUserId));

        if (userId !== null) {
          // Private/social data cascades. Editorial attribution uses SET NULL,
          // preserving catalog content without retaining the user identity.
          await tx.delete(usersTable).where(eq(usersTable.id, userId));
        }

        await tx
          .update(accountDeletionsTable)
          .set({
            status: "database_deleted",
            objectPaths: [...objectPaths],
            liveSessionUids: [...liveSessionUids],
            storageCleanupAfter:
              storageCleanupAfter > 0 ? new Date(storageCleanupAfter) : null,
            updatedAt: new Date(),
          })
          .where(eq(accountDeletionsTable.identityHash, identityHash));
      });
      deletion = await loadAccountDeletion(identityHash);
    }

    if (!deletion) {
      throw new Error("Account deletion tombstone disappeared");
    }

    if (deletion.status === "database_deleted") {
      const objectResults = await Promise.allSettled(
        deletion.objectPaths.map((path) => objectStorageService.deleteObjectEntity(path)),
      );
      const failedObjects = objectResults.filter((result) => result.status === "rejected");
      if (failedObjects.length > 0) {
        req.log.error(
          { failures: failedObjects.length, identityHash },
          "Account deletion paused because object cleanup failed",
        );
        res.status(503).json({
          error: "No se pudieron borrar todos tus archivos. Inténtalo de nuevo.",
        });
        return;
      }
      await db
        .update(accountDeletionsTable)
        .set({ status: "storage_deleted", updatedAt: new Date() })
        .where(eq(accountDeletionsTable.identityHash, identityHash));
      deletion = await loadAccountDeletion(identityHash);
    }

    if (deletion?.status === "storage_deleted") {
      try {
        await deleteClerkUserWithRetry(clerkUserId);
      } catch (err) {
        req.log.error({ err, identityHash }, "Clerk deletion failed; retry is available");
        res.status(503).json({
          error: "Tus datos se borraron, pero falta cerrar la cuenta. Inténtalo de nuevo.",
        });
        return;
      }
      const cleanupPending =
        deletion.storageCleanupAfter !== null &&
        deletion.storageCleanupAfter.getTime() > Date.now();
      await db
        .update(accountDeletionsTable)
        .set({
          status: cleanupPending ? "awaiting_storage_expiry" : "completed",
          completedAt: cleanupPending ? null : new Date(),
          updatedAt: new Date(),
        })
        .where(eq(accountDeletionsTable.identityHash, identityHash));
      deletion = await loadAccountDeletion(identityHash);
    }

    if (deletion?.status === "pending") {
      res.status(503).json({
        error: "La eliminación sigue en curso. Inténtalo de nuevo.",
      });
      return;
    }

    res.setHeader("Cache-Control", "no-store");
    res.json({
      deleted: true,
      deletedAt: new Date().toISOString(),
      cleanupPending: deletion?.status === "awaiting_storage_expiry",
    });
  } catch (err) {
    req.log.error({ err }, "Failed to delete account");
    res.status(503).json({
      error: "No se pudo completar la eliminación. No cierres sesión e inténtalo de nuevo.",
    });
  }
});

router.get("/users/search", requireAuth, async (req, res) => {
  const parsed = SearchUsersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Consulta inválida" });
    return;
  }
  const q = parsed.data.q.trim();
  if (!q) {
    res.json([]);
    return;
  }
  const me = req.currentUser!;
  const pattern = `%${q}%`;

  try {
    const matches = await db
      .select()
      .from(usersTable)
      .where(
        and(
          ne(usersTable.id, me.id),
          or(ilike(usersTable.username, pattern), ilike(usersTable.displayName, pattern)),
        ),
      )
      .limit(20);

    if (matches.length === 0) {
      res.json([]);
      return;
    }

    const ids = matches.map((u) => u.id);
    const edges = await db
      .select()
      .from(friendshipsTable)
      .where(
        or(
          and(eq(friendshipsTable.requesterId, me.id), inArray(friendshipsTable.addresseeId, ids)),
          and(eq(friendshipsTable.addresseeId, me.id), inArray(friendshipsTable.requesterId, ids)),
        ),
      );

    const statusFor = (otherId: number) => {
      const edge = edges.find(
        (e) =>
          (e.requesterId === me.id && e.addresseeId === otherId) ||
          (e.addresseeId === me.id && e.requesterId === otherId),
      );
      if (!edge) return "none" as const;
      if (edge.status === "accepted") return "accepted" as const;
      return edge.requesterId === me.id ? ("pending_outgoing" as const) : ("pending_incoming" as const);
    };

    res.json(
      matches.map((u) => ({
        ...toProfile(u),
        location: u.location ?? null,
        friendshipStatus: statusFor(u.id),
      })),
    );
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al buscar usuarios" });
  }
});

router.get("/users/:userId/public", requireAuth, async (req, res) => {
  const userId = Number(req.params.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    res.status(400).json({ error: "ID de usuario inválido" });
    return;
  }

  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);
    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    const [agg] = await db
      .select({
        totalSessions: sql<number>`count(distinct ${playbackHistoryTable.sessionId})`,
        totalMinutes: sql<number>`coalesce(sum(${playbackHistoryTable.minutes}), 0)`,
      })
      .from(playbackHistoryTable)
      .where(eq(playbackHistoryTable.userId, userId));

    const [topCategory] = await db
      .select({
        categoryLabel: playbackHistoryTable.categoryLabel,
        minutes: sql<number>`coalesce(sum(${playbackHistoryTable.minutes}), 0)`,
      })
      .from(playbackHistoryTable)
      .where(eq(playbackHistoryTable.userId, userId))
      .groupBy(playbackHistoryTable.categoryLabel)
      .orderBy(desc(sql`coalesce(sum(${playbackHistoryTable.minutes}), 0)`))
      .limit(1);

    const [friends] = await db
      .select({ count: sql<number>`count(*)` })
      .from(friendshipsTable)
      .where(
        and(
          eq(friendshipsTable.status, "accepted"),
          or(
            eq(friendshipsTable.requesterId, userId),
            eq(friendshipsTable.addresseeId, userId),
          ),
        ),
      );

    const [followersRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(followsTable)
      .where(eq(followsTable.followingId, userId));

    const [followingRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(followsTable)
      .where(eq(followsTable.followerId, userId));

    res.json({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      location: user.location ?? null,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      stats: {
        totalSessions: Number(agg?.totalSessions ?? 0),
        totalMinutes: Math.round(Number(agg?.totalMinutes ?? 0)),
        topCategoryLabel: topCategory?.categoryLabel ?? null,
        friendsCount: Number(friends?.count ?? 0),
        followersCount: Number(followersRow?.count ?? 0),
        followingCount: Number(followingRow?.count ?? 0),
      },
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al obtener el perfil" });
  }
});

// ── Expansor profile ────────────────────────────────────────────────────────

function toExpansorProfile(p: typeof expansorProfilesTable.$inferSelect) {
  return {
    userId: p.userId,
    specialties: p.specialties ?? [],
    description: p.description ?? null,
    phone: p.phone ?? null,
    email: p.email ?? null,
    instagram: p.instagram ?? null,
    photos: p.photos ?? [],
    quote: p.quote ?? null,
    updatedAt: p.updatedAt.toISOString(),
  };
}

router.get("/me/expansor-profile", requireAuth, async (req, res) => {
  const [profile] = await db
    .select()
    .from(expansorProfilesTable)
    .where(eq(expansorProfilesTable.userId, req.currentUser!.id));
  if (!profile) {
    res.status(404).json({ error: "Perfil expansor no encontrado" });
    return;
  }
  res.json(toExpansorProfile(profile));
});

router.patch("/me/expansor-profile", requireAuth, async (req, res) => {
  const me = req.currentUser!;
  if (me.role !== "expansor" && me.role !== "admin") {
    res.status(403).json({ error: "Solo los expansores pueden editar este perfil" });
    return;
  }
  const parsed = UpdateMyExpansorProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos" });
    return;
  }
  const updates: Partial<typeof expansorProfilesTable.$inferInsert> = {};
  if (parsed.data.specialties !== undefined) updates.specialties = parsed.data.specialties;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;
  if (parsed.data.phone !== undefined) updates.phone = parsed.data.phone;
  if (parsed.data.email !== undefined) updates.email = parsed.data.email;
  if (parsed.data.instagram !== undefined) updates.instagram = parsed.data.instagram;
  if (parsed.data.photos !== undefined) updates.photos = parsed.data.photos;
  if (parsed.data.quote !== undefined) updates.quote = parsed.data.quote;

  const [profile] = await db
    .insert(expansorProfilesTable)
    .values({ userId: me.id, ...updates })
    .onConflictDoUpdate({
      target: expansorProfilesTable.userId,
      set: { ...updates, updatedAt: new Date() },
    })
    .returning();
  res.json(toExpansorProfile(profile));
});

router.get("/users/:userId/expansor-profile", requireAuth, async (req, res) => {
  const userId = Number(req.params.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }
  const [profile] = await db
    .select()
    .from(expansorProfilesTable)
    .where(eq(expansorProfilesTable.userId, userId));
  if (!profile) {
    res.status(404).json({ error: "Perfil expansor no encontrado" });
    return;
  }
  res.json(toExpansorProfile(profile));
});

router.patch("/users/:userId/role", requireAuth, requireRole("admin"), async (req, res) => {
  const userId = Number(req.params.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    res.status(400).json({ error: "ID de usuario inválido" });
    return;
  }
  const parsed = SetUserRoleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos" });
    return;
  }

  try {
    const [updated] = await db
      .update(usersTable)
      .set({ role: parsed.data.role })
      .where(eq(usersTable.id, userId))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }
    res.json(toProfile(updated));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al actualizar el rol" });
  }
});

// ─── Library snapshot ─────────────────────────────────────────────────────────

router.get("/me/library", requireAuth, async (req, res) => {
  const me = req.currentUser!;
  const rows = await db
    .select()
    .from(userLibraryTable)
    .where(eq(userLibraryTable.userId, me.id))
    .limit(1);
  if (rows.length === 0) {
    res.json({
      folders: [],
      playlists: [],
      favFolders: [],
      pinnedFavoriteIds: [],
      mixerPresets: [],
      geometrixCreations: [],
    });
    return;
  }
  const r = rows[0];
  res.json({
    folders: r.folders,
    playlists: r.playlists,
    favFolders: r.favFolders,
    pinnedFavoriteIds: r.pinnedFavoriteIds,
    mixerPresets: r.mixerPresets,
    geometrixCreations: r.geometrixCreations,
  });
});

router.put("/me/library", requireAuth, async (req, res) => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  // Todos los campos son opcionales: cada campo omitido se preserva en el
  // servidor, permitiendo que módulos distintos (biblioteca, mezclador,
  // Geometrix) sincronicen solo lo suyo sin pisarse entre sí.
  const FIELDS = [
    "folders",
    "playlists",
    "favFolders",
    "pinnedFavoriteIds",
    "mixerPresets",
    "geometrixCreations",
  ] as const;
  const updates: Record<string, unknown> = {};
  for (const f of FIELDS) {
    const v = body[f];
    if (v === undefined) continue;
    if (!Array.isArray(v)) {
      res.status(400).json({ error: `Payload inválido: ${f} debe ser un array` });
      return;
    }
    updates[f] = v;
  }
  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "Payload inválido: se esperan arrays" });
    return;
  }
  const me = req.currentUser!;
  const now = new Date();
  const [row] = await db
    .insert(userLibraryTable)
    .values({ userId: me.id, ...updates, updatedAt: now })
    .onConflictDoUpdate({
      target: userLibraryTable.userId,
      set: { ...updates, updatedAt: now },
    })
    .returning();
  res.json({
    folders: row.folders,
    playlists: row.playlists,
    favFolders: row.favFolders,
    pinnedFavoriteIds: row.pinnedFavoriteIds,
    mixerPresets: row.mixerPresets,
    geometrixCreations: row.geometrixCreations,
  });
});

export default router;
