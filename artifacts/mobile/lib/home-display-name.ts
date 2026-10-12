export function homeNameCandidates(name: string): string[] {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [""];
  return words.map((_, index) => {
    const count = words.length - index;
    const prefix = words.slice(0, count).join(" ");
    return index === 0 ? prefix : `${prefix.replace(/,+$/, "")},`;
  });
}

export function fitHomeName(candidates: string[], widths: Record<string, number>, available: number) {
  return candidates.find(text => widths[text] !== undefined && widths[text] <= available)
    ?? candidates[candidates.length - 1];
}
