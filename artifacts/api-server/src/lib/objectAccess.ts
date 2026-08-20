import { and, eq, sql } from "drizzle-orm";
import { db, uploadsTable, type UserRole } from "@workspace/db";

export type ObjectReadAccess = "public" | "private" | "denied";

/**
 * Database-backed access policy for objects stored under PRIVATE_OBJECT_DIR.
 *
 * Public access is derived only from published/active catalog references.
 * Otherwise access is limited to the upload owner, an admin/moderator, a
 * direct-message participant, or authenticated users viewing a community
 * avatar. Unknown and unreferenced paths fail closed.
 */
export async function resolveObjectReadAccess({
  objectPath,
  clerkUserId,
}: {
  objectPath: string;
  clerkUserId?: string;
}): Promise<ObjectReadAccess> {
  const result = await db.execute(sql`
    WITH requester AS (
      SELECT id, role
      FROM users
      WHERE clerk_user_id = ${clerkUserId ?? null}
      LIMIT 1
    )
    SELECT
      (
        EXISTS (
          SELECT 1
          FROM catalog_sessions s
          WHERE s.status = 'published'
            AND (s.image_url = ${objectPath} OR s.image_key = ${objectPath})
        )
        OR EXISTS (
          SELECT 1
          FROM catalog_audio_files a
          JOIN catalog_sessions s ON s.id = a.session_id
          WHERE s.status = 'published' AND a.url = ${objectPath}
        )
        OR EXISTS (
          SELECT 1
          FROM mixer_sounds s
          WHERE s.is_active = true
            AND (s.object_path = ${objectPath} OR s.thumbnail_object_path = ${objectPath})
        )
        OR EXISTS (
          SELECT 1
          FROM descanso_sounds s
          WHERE s.is_active = true
            AND (
              s.audio_object_path = ${objectPath}
              OR s.thumbnail_object_path = ${objectPath}
            )
        )
        OR EXISTS (
          SELECT 1
          FROM catalog_videos v
          WHERE v.status = 'published' AND v.thumbnail_object_path = ${objectPath}
        )
        OR EXISTS (
          SELECT 1
          FROM catalog_playlists p
          WHERE p.is_active = true AND p.cover_url = ${objectPath}
        )
        OR EXISTS (
          SELECT 1
          FROM resonadores r
          WHERE r.status = 'published'
            AND (
              r.photo_url = ${objectPath}
              OR r.cover_photo_url = ${objectPath}
              OR ${objectPath} = ANY(r.photos)
            )
            AND EXISTS (
              SELECT 1
              FROM uploads media_upload
              JOIN users uploader ON uploader.id = media_upload.user_id
              LEFT JOIN users linked_owner ON linked_owner.clerk_user_id = r.clerk_id
              WHERE media_upload.object_path = ${objectPath}
                AND (
                  media_upload.user_id = linked_owner.id
                  OR uploader.role IN ('admin', 'moderador')
                )
            )
        )
        OR EXISTS (
          SELECT 1
          FROM users profile
          JOIN uploads avatar_upload
            ON avatar_upload.user_id = profile.id
            AND avatar_upload.object_path = ${objectPath}
          WHERE profile.avatar_url = ${objectPath}
        )
      ) AS is_public,
      EXISTS (
        SELECT 1
        FROM uploads u
        JOIN requester r ON r.id = u.user_id
        WHERE u.object_path = ${objectPath}
      ) AS is_owner,
      EXISTS (
        SELECT 1 FROM requester r
        WHERE r.role IN ('admin', 'moderador')
      ) AS is_privileged,
      EXISTS (
        SELECT 1
        FROM direct_messages m
        JOIN requester r ON r.id = m.sender_id OR r.id = m.recipient_id
        JOIN uploads attachment_upload
          ON attachment_upload.object_path = m.attachment_url
          AND attachment_upload.user_id = m.sender_id
        WHERE m.attachment_url = ${objectPath}
      ) AS is_message_participant
  `);

  const row = result.rows[0] as
    | {
        is_public?: boolean;
        is_owner?: boolean;
        is_privileged?: boolean;
        is_message_participant?: boolean;
      }
    | undefined;

  if (row?.is_public) return "public";
  if (
    row?.is_owner ||
    row?.is_privileged ||
    row?.is_message_participant
  ) {
    return "private";
  }
  return "denied";
}

export function isPrivateObjectReference(value: string | null | undefined): value is string {
  return typeof value === "string" && value.startsWith("/objects/");
}

/**
 * A user may publish/share a private object only if they own its upload record,
 * have an editorial role, or the object is already legitimately public.
 */
export async function canUserReferenceObject({
  objectPath,
  userId,
  clerkUserId,
  role,
}: {
  objectPath: string;
  userId: number;
  clerkUserId: string;
  role: UserRole;
}): Promise<boolean> {
  if (!isPrivateObjectReference(objectPath)) return true;
  if (role === "admin" || role === "moderador") return true;

  const [owned] = await db
    .select({ id: uploadsTable.id })
    .from(uploadsTable)
    .where(
      and(
        eq(uploadsTable.userId, userId),
        eq(uploadsTable.objectPath, objectPath),
      ),
    )
    .limit(1);
  if (owned) return true;

  return (
    (await resolveObjectReadAccess({ objectPath, clerkUserId })) === "public"
  );
}

/**
 * Final publication check used when editorial approval turns a pending object
 * into anonymous-readable content. The upload must belong to the content owner
 * or to a privileged editor.
 */
export async function canPublishObjectReference({
  objectPath,
  expectedOwnerId,
}: {
  objectPath: string;
  expectedOwnerId: number | null;
}): Promise<boolean> {
  if (!isPrivateObjectReference(objectPath)) return true;

  const result = await db.execute(sql`
    SELECT EXISTS (
      SELECT 1
      FROM uploads u
      JOIN users uploader ON uploader.id = u.user_id
      WHERE u.object_path = ${objectPath}
        AND (
          u.user_id = ${expectedOwnerId}
          OR uploader.role IN ('admin', 'moderador')
        )
    ) AS is_trusted
  `);
  return Boolean((result.rows[0] as { is_trusted?: boolean } | undefined)?.is_trusted);
}