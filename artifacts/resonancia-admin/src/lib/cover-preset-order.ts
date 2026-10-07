type Identified = { id: string };

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
