export type RoutineCompletionBannerEvent =
  | {
      id: number;
      kind: "completed";
      previousCount: number;
      nextCount: number;
    }
  | {
      id: number;
      kind: "added";
    };

export function enqueueRoutineCompletion(
  queue: RoutineCompletionBannerEvent[],
  event: Extract<RoutineCompletionBannerEvent, { kind: "completed" }>,
): RoutineCompletionBannerEvent[] {
  if (queue.length === 0) return [event];
  if (queue[0].kind !== "completed") return [...queue, event];
  return [
    queue[0],
    ...queue.slice(1).filter((queued) => queued.kind !== "completed"),
    event,
  ];
}

export function hasPendingRoutineCompletion(
  queue: RoutineCompletionBannerEvent[],
): boolean {
  return (
    queue[0]?.kind === "completed" &&
    queue.slice(1).some((event) => event.kind === "completed")
  );
}

export function claimRoutineCompletion(
  inFlightKeys: Set<string>,
  completionKey: string,
): boolean {
  if (inFlightKeys.has(completionKey)) return false;
  inFlightKeys.add(completionKey);
  return true;
}