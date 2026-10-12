export const JOURNEY_LIMITS = { title: 100, description: 5000 } as const;

export interface JourneyInfoDraft {
  title: string;
  description: string;
}

export type JourneyInfoErrors = Partial<Record<keyof JourneyInfoDraft, string>>;

export function validateJourneyInfo(draft: JourneyInfoDraft): JourneyInfoErrors {
  const errors: JourneyInfoErrors = {};
  for (const key of ["title", "description"] as const) {
    const v = draft[key].trim();
    if (!v) errors[key] = "Este campo no puede estar vacío";
    else if (v.length > JOURNEY_LIMITS[key]) errors[key] = `Máximo ${JOURNEY_LIMITS[key]} caracteres`;
  }
  return errors;
}

export function toJourneyDraft(content: { title: string; description: string }): JourneyInfoDraft {
  return { title: content.title, description: content.description };
}

/** Trims outer whitespace only; inner line breaks (paragraphs) are preserved. */
export function toJourneyPayload(draft: JourneyInfoDraft, revision: number) {
  return { revision, content: { title: draft.title.trim(), description: draft.description.trim() } };
}

export function sameJourneyDraft(a: JourneyInfoDraft, b: JourneyInfoDraft): boolean {
  return a.title === b.title && a.description === b.description;
}
