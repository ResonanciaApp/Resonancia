import type { RequestHandler } from "express";
import { getAuth } from "@clerk/express";
import { db, accountDeletionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { accountIdentityHash } from "../lib/accountDeletion";

/**
 * Once deletion has been requested, reject every authenticated API operation
 * except another DELETE /me retry. This prevents requireAuth from recreating
 * the local user while Clerk revocation or storage cleanup is still pending.
 */
export const accountDeletionGuard: RequestHandler = async (req, res, next) => {
  const clerkUserId = getAuth(req)?.userId;
  if (!clerkUserId) {
    next();
    return;
  }

  if (req.method === "DELETE" && req.path === "/api/me") {
    next();
    return;
  }

  try {
    const [deletion] = await db
      .select({ status: accountDeletionsTable.status })
      .from(accountDeletionsTable)
      .where(eq(accountDeletionsTable.identityHash, accountIdentityHash(clerkUserId)))
      .limit(1);
    if (!deletion) {
      next();
      return;
    }

    res.status(423).json({
      error:
        deletion.status === "completed"
          ? "Esta cuenta fue eliminada"
          : "La eliminación de esta cuenta está en curso",
    });
  } catch (error) {
    req.log.error({ err: error }, "Failed to check account deletion tombstone");
    res.status(503).json({ error: "No se pudo verificar el estado de la cuenta" });
  }
};