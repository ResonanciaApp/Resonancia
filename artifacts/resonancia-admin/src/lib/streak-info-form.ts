export const STREAK_CARD_IDS = ["current", "accumulated", "longest", "completed"] as const;
export type StreakCardId = (typeof STREAK_CARD_IDS)[number];

export const STREAK_LIMITS = {
  title: 100,
  description: 1000,
  cardTitle: 100,
  cardDescription: 2000,
} as const;

export const STREAK_CARD_LABELS: Record<StreakCardId, string> = {
  current: "Racha actual",
  accumulated: "Días acumulados",
  longest: "Racha más larga",
  completed: "Semanas completas",
};

export interface StreakInfoDraft {
  title: string;
  description: string;
  cards: { id: StreakCardId; title: string; description: string }[];
}

export type StreakInfoErrors = Record<string, string>;

function checkText(errors: StreakInfoErrors, key: string, value: string, max: number) {
  if (!value.trim()) errors[key] = "Este campo no puede estar vacío";
  else if (value.length > max) errors[key] = `Máximo ${max} caracteres`;
}

export function validateStreakInfo(draft: StreakInfoDraft): StreakInfoErrors {
  const errors: StreakInfoErrors = {};
  checkText(errors, "title", draft.title, STREAK_LIMITS.title);
  checkText(errors, "description", draft.description, STREAK_LIMITS.description);
  const ids = draft.cards.map((c) => c.id);
  if (ids.length !== STREAK_CARD_IDS.length || STREAK_CARD_IDS.some((id, i) => ids[i] !== id)) {
    errors.cards = "Las tarjetas no coinciden con las cuatro esperadas";
  }
  draft.cards.forEach((card, i) => {
    checkText(errors, `cards.${i}.title`, card.title, STREAK_LIMITS.cardTitle);
    checkText(errors, `cards.${i}.description`, card.description, STREAK_LIMITS.cardDescription);
  });
  return errors;
}

/** Sorts server cards into canonical order, keeping server text verbatim. */
export function toDraft(content: {
  title: string;
  description: string;
  cards: { id: string; title: string; description: string }[];
}): StreakInfoDraft {
  return {
    title: content.title,
    description: content.description,
    cards: STREAK_CARD_IDS.map((id) => {
      const c = content.cards.find((x) => x.id === id);
      return { id, title: c?.title ?? "", description: c?.description ?? "" };
    }),
  };
}

export function toPayload(draft: StreakInfoDraft, revision: number) {
  return {
    revision,
    content: {
      title: draft.title.trim(),
      description: draft.description.trim(),
      cards: draft.cards.map((c) => ({ id: c.id, title: c.title.trim(), description: c.description.trim() })),
    },
  };
}

export function sameDraft(a: StreakInfoDraft, b: StreakInfoDraft): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function errorStatus(error: unknown): number | undefined {
  if (typeof error === "object" && error !== null && "status" in error) {
    const s = (error as { status?: unknown }).status;
    return typeof s === "number" ? s : undefined;
  }
  return undefined;
}
