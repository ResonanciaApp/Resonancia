export function resolvePinnedFeaturedValue({
  currentValue,
  requestedValue,
  status,
  isPlaceholder,
}: {
  currentValue: boolean;
  requestedValue: boolean | undefined;
  status: string;
  isPlaceholder: boolean;
}): { valid: true; value: boolean } | { valid: false } {
  const isPinnable = status === "published" && !isPlaceholder;
  if (requestedValue === true && !isPinnable) {
    return { valid: false };
  }
  return {
    valid: true,
    value: isPinnable && (requestedValue ?? currentValue),
  };
}