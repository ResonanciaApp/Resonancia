export const SEARCH_DURATION_RANGES = [
  { id: "under-5", label: "Menos de 5 minutos", min: 0, max: 4 },
  { id: "5-10", label: "5 a 10 minutos", min: 5, max: 10 },
  { id: "10-15", label: "10 a 15 minutos", min: 11, max: 15 },
  { id: "15-25", label: "15 a 25 minutos", min: 16, max: 25 },
  { id: "over-25", label: "Más de 25 minutos", min: 26, max: Infinity },
] as const;

export type SearchDurationRangeId = (typeof SEARCH_DURATION_RANGES)[number]["id"];