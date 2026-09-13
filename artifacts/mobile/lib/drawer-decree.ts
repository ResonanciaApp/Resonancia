const DECREE_STORAGE_PREFIX = "@resonance/drawer-decree";

type DecreeListener = (decree: string) => void;

const listeners = new Map<string, Set<DecreeListener>>();

export function getDrawerDecreeStorageKey(userId?: string | null) {
  return `${DECREE_STORAGE_PREFIX}:${userId ?? "local"}`;
}

export function publishDrawerDecree(storageKey: string, decree: string) {
  listeners.get(storageKey)?.forEach((listener) => listener(decree));
}

export function subscribeToDrawerDecree(
  storageKey: string,
  listener: DecreeListener,
) {
  const keyListeners = listeners.get(storageKey) ?? new Set<DecreeListener>();
  keyListeners.add(listener);
  listeners.set(storageKey, keyListeners);

  return () => {
    keyListeners.delete(listener);
    if (keyListeners.size === 0) listeners.delete(storageKey);
  };
}