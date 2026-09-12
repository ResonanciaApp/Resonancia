export async function commitPracticeNotificationUpdate<T>({
  current,
  next,
  persist,
  applyNext,
  restoreCurrent,
}: {
  current: T;
  next: T;
  persist: (value: T) => Promise<void>;
  applyNext: () => Promise<void>;
  restoreCurrent: () => Promise<void>;
}): Promise<T> {
  await persist(next);
  try {
    await applyNext();
    return next;
  } catch (error) {
    await persist(current).catch(() => {});
    await restoreCurrent().catch(() => {});
    throw error;
  }
}