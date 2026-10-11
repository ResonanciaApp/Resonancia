type Identified = { id: string };

/** Shuffle a copy; category memberships, locks and images remain untouched. */
export function shufflePresets<T extends Identified>(presets: readonly T[], random = Math.random): T[] {
  const next = [...presets];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

/** Round-robin in catalog category order, skipping avatars already emitted. */
export function interleavePresets<T extends Identified & { categoryIds?: readonly string[] }>(
  presets: readonly T[],
  categories: readonly Identified[],
): T[] {
  const ids = new Set(categories.map(category => category.id));
  const queues = categories.map(category => presets.filter(item => item.categoryIds?.includes(category.id)));
  queues.push(presets.filter(item => !item.categoryIds?.some(id => ids.has(id))));
  const offsets = queues.map(() => 0);
  const seen = new Set<string>();
  const result: T[] = [];
  let added: boolean;
  do {
    added = false;
    queues.forEach((queue, index) => {
      while (offsets[index] < queue.length && seen.has(queue[offsets[index]].id)) offsets[index]++;
      const item = queue[offsets[index]++];
      if (item) {
        seen.add(item.id);
        result.push(item);
        added = true;
      }
    });
  } while (added);
  return result;
}

export function samePresetOrder(left: readonly Identified[], right: readonly Identified[]) {
  return left.length === right.length && left.every((item, index) => item.id === right[index].id);
}

export function movePresetBlock<T extends Identified>(
  presets: readonly T[],
  selectedIds: ReadonlySet<string>,
  position: string,
): { presets: T[]; changed: boolean; error: string | null } {
  const selected = presets.filter(item => selectedIds.has(item.id));
  const remaining = presets.filter(item => !selectedIds.has(item.id));
  const max = remaining.length + 1;
  const destination = Number(position);
  if (!selected.length) {
    return { presets: [...presets], changed: false, error: "Selecciona al menos un avatar." };
  }
  if (!/^\d+$/.test(position.trim()) || !Number.isSafeInteger(destination) || destination < 1 || destination > max) {
    return { presets: [...presets], changed: false, error: `Introduce una posición entera entre 1 y ${max}.` };
  }
  const next = [...remaining.slice(0, destination - 1), ...selected, ...remaining.slice(destination - 1)];
  return { presets: next, changed: !samePresetOrder(presets, next), error: null };
}

export function presetCatalogSignature(presets: readonly {
  id: string; sortOrder: number; isLocked?: boolean; label: string;
  objectPath?: string | null; builtinKey?: string | null; updatedAt?: string;
}[]) {
  return JSON.stringify(presets.map(item => [
    item.id, item.sortOrder, item.isLocked, item.label,
    item.objectPath, item.builtinKey, item.updatedAt,
  ]));
}
