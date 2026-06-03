import type { RequestHandler } from "express";
import type { UserRole } from "@workspace/db";

/**
 * Restrict a route to users with one of the given roles.
 * Must run AFTER `requireAuth` so that `req.currentUser` is populated.
 * Responds 401 if there is no authenticated user and 403 if the user's
 * role is not in the allowed set.
 */
export function requireRole(...roles: UserRole[]): RequestHandler {
  return (req, res, next) => {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }
    if (!roles.includes(user.role)) {
      res.status(403).json({ error: "No autorizado" });
      return;
    }
    next();
  };
}
