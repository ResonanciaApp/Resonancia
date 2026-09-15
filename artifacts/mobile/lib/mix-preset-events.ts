type MixPresetDeletedListener = (presetId: string) => void;

const deletedListeners = new Set<MixPresetDeletedListener>();

export function notifyMixPresetDeleted(presetId: string): void {
  deletedListeners.forEach((listener) => listener(presetId));
}

export function subscribeToMixPresetDeleted(listener: MixPresetDeletedListener): () => void {
  deletedListeners.add(listener);
  return () => deletedListeners.delete(listener);
}