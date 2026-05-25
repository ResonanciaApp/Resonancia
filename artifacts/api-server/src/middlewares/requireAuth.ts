import type { RequestHandler } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable, type User } from "@workspace/db";
import { eq } from "drizzle-orm";

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
      [user] = await db
        .insert(usersTable)
        .values({
          clerkUserId,
          username,
          displayName: username,
        })
        .returning();
    }

    req.currentUser = user;
    next();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error de autenticación" });
  }
};
