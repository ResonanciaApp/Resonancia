import type { RequestHandler } from "express";
import { clerkClient, getAuth } from "@clerk/express";
import { db, usersTable, type User } from "@workspace/db";
import { eq } from "drizzle-orm";
import { recordCommunityEvent } from "../lib/communityActivity";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      currentUser?: User;
    }
  }
}

/**
 * Generate a default username from the Clerk user id.
 * Users can rename it later via PATCH /me.
 */
function defaultUsername(clerkUserId: string): string {
  const slug = clerkUserId.replace(/^user_/, "").toLowerCase().slice(0, 10);
  return `user_${slug}`;
}

/**
 * Clerk user ids that should always be treated as admins. Configured out of
 * band via the `ADMIN_CLERK_USER_IDS` secret (comma-separated) so that the
 * first admin can never be self-assigned from the app.
 */
function adminClerkUserIds(): Set<string> {
  return new Set(
    (process.env.ADMIN_CLERK_USER_IDS ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  );
}

/**
 * Ensure there is a row in `users` for the Clerk-authenticated request,
 * creating it just-in-time on first call. Attaches `req.currentUser`.
 * Responds 401 if the request is not authenticated.
 */
export const requireAuth: RequestHandler = async (req, res, next) => {
  const auth = getAuth(req);
  const clerkUserId = auth?.userId;
  if (!clerkUserId) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }

  try {
    let [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.clerkUserId, clerkUserId))
      .limit(1);

    if (!user) {
      const username = defaultUsername(clerkUserId);
      let email: string | null = null;
      try {
        const clerkUser = await clerkClient.users.getUser(clerkUserId);
        email = clerkUser.primaryEmailAddress?.emailAddress ?? null;
      } catch (err) {
        req.log.warn({ err }, "could not fetch email from Clerk");
      }
      [user] = await db
        .insert(usersTable)
        .values({
          clerkUserId,
          username,
          displayName: username,
          email,
        })
        .returning();

      // Fire-and-forget: welcome event in community feed.
      void recordCommunityEvent(user.id, "user_joined");
    } else if (!user.email) {
      // Backfill del email para usuarios creados antes de guardarlo.
      try {
        const clerkUser = await clerkClient.users.getUser(clerkUserId);
        const email = clerkUser.primaryEmailAddress?.emailAddress ?? null;
        if (email) {
          [user] = await db
            .update(usersTable)
            .set({ email })
            .where(eq(usersTable.id, user.id))
            .returning();
        }
      } catch (err) {
        req.log.warn({ err }, "could not backfill email from Clerk");
      }
    }

    // Promote configured admins (idempotent; never demotes).
    if (user.role !== "admin" && adminClerkUserIds().has(clerkUserId)) {
      [user] = await db
        .update(usersTable)
        .set({ role: "admin" })
        .where(eq(usersTable.id, user.id))
        .returning();
    }

    req.currentUser = user;
    next();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error de autenticación" });
  }
};
