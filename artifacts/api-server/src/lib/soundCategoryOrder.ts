export function reorderSoundCategories<T extends { id: string }>(
  ordered: readonly T[],
  movingId: string,
  requestedIndex: number,
): T[] | null {
  const next = [...ordered];
  const sourceIndex = next.findIndex((category) => category.id === movingId);
  if (sourceIndex < 0) return null;
  const targetIndex = Math.max(0, Math.min(requestedIndex, next.length - 1));
  const [source] = next.splice(sourceIndex, 1);
  next.splice(targetIndex, 0, source);
  return next;
}