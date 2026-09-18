/**
 * Runtime deletion barrier. The server delete flow must invoke clear before its
 * broad AsyncStorage cleanup/logout. A revoked owner cannot enqueue new writes,
 * and every already-started write drains before the private key is removed.
 */
export function createInspirationAccountLifecycle() {
  const revoked = new Set<string>();
  const listeners = new Map<string, Set<() => void>>();
  const writes = new Map<string, Set<Promise<unknown>>>();

  return {
    isRevoked(owner: string | null) { return owner !== null && revoked.has(owner); },
    register(owner: string, stop: () => void) {
      if (revoked.has(owner)) { stop(); return () => undefined; }
      const group = listeners.get(owner) ?? new Set<() => void>();
      group.add(stop);
      listeners.set(owner, group);
      return () => {
        group.delete(stop);
        if (!group.size) listeners.delete(owner);
      };
    },
    trackWrite(owner: string | null, write: Promise<unknown>) {
      if (!owner) return;
      // This is called synchronously when a transaction is enqueued. Its own
      // execution guard rejects revoked owners before starting storage work.
      const group = writes.get(owner) ?? new Set<Promise<unknown>>();
      group.add(write);
      writes.set(owner, group);
      const settled = () => {
        group.delete(write);
        if (!group.size) writes.delete(owner);
      };
      void write.then(settled, settled);
    },
    async clear(owner: string, remove: () => Promise<void>) {
      revoked.add(owner); // synchronous barrier, before any await
      for (const stop of listeners.get(owner) ?? []) stop();
      listeners.delete(owner);
      // Unmounted providers' writes are tracked too; listener cleanup cannot
      // orphan an in-flight setItem that would otherwise recreate the key.
      while (writes.get(owner)?.size) {
        await Promise.allSettled([...writes.get(owner)!]);
      }
      await remove();
    },
  };
}

export const inspirationAccountLifecycle = createInspirationAccountLifecycle();