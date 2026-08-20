import { createHash } from "node:crypto";

/**
 * Stable one-way identifier used by account-deletion tombstones.
 * Clerk ids are high-entropy values; the namespace prevents cross-system hash
 * correlation while keeping the API independent from a retained raw identity.
 */
export function accountIdentityHash(clerkUserId: string): string {
  return createHash("sha256")
    .update(`resonancia-account-deletion-v1:${clerkUserId}`)
    .digest("hex");
}