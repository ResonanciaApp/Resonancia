/**
 * A display-only snapshot reported by the authenticated owner's RevenueCat SDK.
 * This is NOT server-verified billing evidence and must never grant access.
 */
export function publicPremiumStatus(
  membership: { active: boolean; expiresAt: string | null } | null | undefined,
  now = Date.now(),
): boolean | null {
  if (!membership) return null;
  if (!membership.active) return false;
  if (membership.expiresAt === null) return true;
  const expires = Date.parse(membership.expiresAt);
  return Number.isFinite(expires) ? expires > now : null;
}
