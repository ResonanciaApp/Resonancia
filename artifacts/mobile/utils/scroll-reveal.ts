export type VerticalRevealInput = {
  itemY: number;
  scrollY: number;
  viewportHeight: number;
  threshold?: number;
};

export function getNestedScrollItemY(containerY: number, itemY: number): number {
  return containerY + itemY;
}

export function isVerticalItemRevealed({
  itemY,
  scrollY,
  viewportHeight,
  threshold = 0.82,
}: VerticalRevealInput): boolean {
  const safeThreshold = Math.max(0, Math.min(1, threshold));
  return itemY <= scrollY + viewportHeight * safeThreshold;
}