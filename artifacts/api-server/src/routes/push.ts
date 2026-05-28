import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, pushTokensTable } from "@workspace/db";
import {
  RegisterPushTokenBody as RegisterBody,
  UnregisterPushTokenBody as UnregisterBody,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

// POST /push/register — upsert a device token for the current user.
router.post("/push/register", requireAuth, async (req, res) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos" });
    return;
  }
  const me = req.currentUser!;
  try {
    await db
      .insert(pushTokensTable)
      .values({
        userId: me.id,
        token: parsed.data.token,
        platform: parsed.data.platform,
      })
      .onConflictDoUpdate({
        target: pushTokensTable.token,
        set: {
          userId: me.id,
          platform: parsed.data.platform,
          lastSeenAt: new Date(),
        },
      });
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error" });
  }
});

// POST /push/unregister — remove a token (used on logout).
router.post("/push/unregister", requireAuth, async (req, res) => {
  const parsed = UnregisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos" });
    return;
  }
  const me = req.currentUser!;
  try {
    await db
      .delete(pushTokensTable)
      .where(
        and(
          eq(pushTokensTable.token, parsed.data.token),
          eq(pushTokensTable.userId, me.id),
        ),
      );
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error" });
  }
});

export default router;
