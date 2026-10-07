import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, notificationsTable, usersTable } from "@workspace/db";
import { SendUserVibrationParams } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { sendPushToUsers } from "../lib/push";

const router: IRouter = Router();

router.post("/users/:userId/vibrations", requireAuth, async (req, res) => {
  const parsed = SendUserVibrationParams.safeParse(req.params);
  if (!parsed.success || !Number.isSafeInteger(parsed.data.userId)) {
    res.status(400).json({ error: "Usuario inválido" });
    return;
  }
  const me = req.currentUser!;
  const userId = parsed.data.userId;
  if (userId === me.id) {
    res.status(400).json({ error: "No puedes enviarte una vibración" });
    return;
  }
  try {
    const [recipient] = await db.select({ id: usersTable.id })
      .from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!recipient) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }
    // The inbox write is authoritative; a push failure must not lose the notice.
    await db.insert(notificationsTable).values({
      userId,
      actorUserId: me.id,
      type: "vibration",
      message: "te envió una vibración",
    });
    void sendPushToUsers([userId], {
      title: "Nueva vibración",
      body: `${me.displayName || me.username} te envió una vibración`,
      data: { kind: "vibration", fromUserId: me.id },
    });
    res.status(201).json({ sent: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "No se pudo enviar la vibración" });
  }
});

export default router;
