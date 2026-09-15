type RoutineCompletionTransition = {
  activityId: string;
  dateKey: string;
  occurrenceIndex: number;
  token: number;
};

let pendingTransition: RoutineCompletionTransition | null = null;
let pendingAdditionActivityId: string | null = null;
let nextToken = 1;

export function markRoutineCompletionTransition(
  activityId: string,
  dateKey: string,
  occurrenceIndex: number,
) {
  pendingTransition = {
    activityId,
    dateKey,
    occurrenceIndex,
    token: nextToken++,
  };
}

export function consumeRoutineCompletionTransition() {
  const transition = pendingTransition;
  pendingTransition = null;
  return transition;
}

export function markRoutineAdditionTransition(activityId: string) {
  pendingAdditionActivityId = activityId;
}

export function consumeRoutineAdditionTransition() {
  const activityId = pendingAdditionActivityId;
  pendingAdditionActivityId = null;
  return activityId;
}