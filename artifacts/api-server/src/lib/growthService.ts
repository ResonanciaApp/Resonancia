import { and, eq, sql } from "drizzle-orm";
import {
  db, growthCatalogTable, growthWalletsTable, growthGrantsTable,
  growthAvatarUnlocksTable, coverPresetsTable, playbackHistoryTable, usersTable,
} from "@workspace/db";
import { GrowthError, reconcileReached, growthIdentity } from "./growthRules";
import { adoptGrowthEditorial } from "./growthEditorial";
import { adoptLegacyGrowthWorlds } from "./growthWorlds";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function readGrowthCatalog(tx: Tx | typeof db = db) {
  const [catalog] = await tx.select().from(growthCatalogTable).where(eq(growthCatalogTable.id, "main"));
  if (!catalog) throw new GrowthError(503, "Tu camino no está inicializado");
  return { revision: catalog.revision, worlds: catalog.worlds ?? adoptLegacyGrowthWorlds(catalog.stages), stages: catalog.stages.map(stage => adoptGrowthEditorial(stage)), updatedAt: catalog.updatedAt.toISOString() };
}

async function reconcile(tx: Tx, userId: number) {
  await tx.insert(growthWalletsTable).values({ userId }).onConflictDoNothing();
  const [wallet] = await tx.select().from(growthWalletsTable)
    .where(eq(growthWalletsTable.userId, userId)).for("update");
  const result = await tx.execute(sql`
    SELECT count(*)::integer AS days FROM (
      SELECT (${playbackHistoryTable.playedAt} AT TIME ZONE 'America/Santiago')::date
      FROM ${playbackHistoryTable}
      WHERE ${playbackHistoryTable.userId} = ${userId}
        AND ${playbackHistoryTable.playedAt} <= now()
        AND (${wallet.countFromDay}::date IS NULL
          OR (${playbackHistoryTable.playedAt} AT TIME ZONE 'America/Santiago')::date >= ${wallet.countFromDay}::date)
      GROUP BY 1
      HAVING sum(${playbackHistoryTable.minutes}) >= 3 OR bool_or(${playbackHistoryTable.completed})
    ) active_days
  `);
  const maxDays = Math.max(wallet.maxDays, wallet.baseDays + Number(result.rows[0]?.days ?? 0));
  const catalog = await readGrowthCatalog(tx);
  const reached = reconcileReached(catalog.stages, wallet.reached, maxDays);
  await tx.update(growthWalletsTable).set({ maxDays, reached })
    .where(eq(growthWalletsTable.userId, userId));
  const reachedIds = new Set(reached.map(s => s.id));
  for (const stage of catalog.stages) {
    if (!reachedIds.has(stage.id)) continue;
    for (const reward of stage.rewards.filter(r => r.enabled)) {
      await tx.insert(growthGrantsTable).values({
        userId, rewardId: reward.id, stageId: stage.id, amount: reward.amount,
      }).onConflictDoNothing();
    }
  }
  const grants = await tx.select().from(growthGrantsTable).where(eq(growthGrantsTable.userId, userId));
  const unlocked = await tx.select().from(growthAvatarUnlocksTable)
    .where(eq(growthAvatarUnlocksTable.userId, userId));
  return {
    ownerClerkUserId: (await tx.select({ clerkUserId: usersTable.clerkUserId }).from(usersTable).where(eq(usersTable.id, userId)))[0].clerkUserId,
    totalActiveDays: maxDays,
    balance: grants.reduce((sum, grant) => sum + grant.amount, 0) - unlocked.length,
    unlockedAvatarIds: unlocked.map(u => u.avatarId),
    reachedStageIds: [...reachedIds],
    grantedRewards: grants.map(grant => ({ rewardId: grant.rewardId, amount: grant.amount })),
    currentStage: growthIdentity(catalog.stages, reached),
  };
}

export async function getGrowthProgress(userId: number) {
  return db.transaction(tx => reconcile(tx, userId));
}

export async function unlockGrowthAvatar(userId: number, avatarId: string) {
  return db.transaction(async tx => {
    const progress = await reconcile(tx, userId); // holds this user's wallet lock until commit
    if (progress.unlockedAvatarIds.includes(avatarId)) return progress;
    const [preset] = await tx.select().from(coverPresetsTable)
      .where(and(eq(coverPresetsTable.id, avatarId), eq(coverPresetsTable.scope, "profile")))
      .for("update");
    if (!preset) throw new GrowthError(404, "El avatar ya no está disponible");
    if (!preset.isLocked) throw new GrowthError(400, "Este avatar ya es libre y no necesita un desbloqueo");
    if (progress.balance < 1) throw new GrowthError(409, "No tienes desbloqueos disponibles");
    await tx.insert(growthAvatarUnlocksTable).values({ userId, avatarId });
    return {
      ...progress,
      balance: progress.balance - 1,
      unlockedAvatarIds: [...progress.unlockedAvatarIds, avatarId],
    };
  });
}

export async function ownsGrowthAvatar(userId: number, avatarId: string, executor: Tx | typeof db = db) {
  const [owned] = await executor.select({ avatarId: growthAvatarUnlocksTable.avatarId })
    .from(growthAvatarUnlocksTable)
    .where(and(eq(growthAvatarUnlocksTable.userId, userId), eq(growthAvatarUnlocksTable.avatarId, avatarId)));
  return !!owned;
}
