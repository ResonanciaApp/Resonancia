import type { FeaturedMomentResponse } from "@workspace/api-client-react";

export const FEATURED_MOMENT_TIME_ZONE = "America/Santiago";

export function getChileEditorialDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: FEATURED_MOMENT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function isEligibleFeaturedMomentResponse(
  value: unknown,
): value is FeaturedMomentResponse {
  if (!value || typeof value !== "object") return false;
  const response = value as Partial<FeaturedMomentResponse>;
  if (
    typeof response.date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(response.date) ||
    response.timezone !== FEATURED_MOMENT_TIME_ZONE ||
    typeof response.nextChangeAt !== "string" ||
    !Number.isFinite(Date.parse(response.nextChangeAt)) ||
    !["automatic", "manual", "empty"].includes(response.source ?? "") ||
    !Number.isInteger(response.eligibleCount) ||
    (response.eligibleCount ?? -1) < 0 ||
    typeof response.revision !== "string" ||
    typeof response.manualMigrated !== "boolean" ||
    !(response.automaticSessionId === null || typeof response.automaticSessionId === "string") ||
    (response.source === "empty" && response.session !== null) ||
    (response.source !== "empty" && response.session === null) ||
    !(response.session === null || isEligibleFeaturedMomentSession(response.session))
  ) {
    return false;
  }
  return true;
}

export function getFeaturedMomentRefreshDelay(
  response: Pick<FeaturedMomentResponse, "nextChangeAt">,
  now = Date.now(),
): number {
  const nextChangeAt = Date.parse(response.nextChangeAt);
  return Number.isFinite(nextChangeAt) && nextChangeAt > now
    ? nextChangeAt - now
    : 60_000;
}

export function isEligibleFeaturedMomentSession(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const session = value as Record<string, unknown>;
  return (
    typeof session.id === "string" &&
    !!session.id &&
    typeof session.title === "string" &&
    !!session.title.trim() &&
    typeof session.categoryId === "string" &&
    session.categoryId !== "musica-sonidos" &&
    session.categoryId !== "reflexiones" &&
    session.isPlaceholder !== true &&
    session.status === "published"
  );
}

export function featuredMomentStatusMessage(input: {
  response: FeaturedMomentResponse | null;
  today: string;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  invalidated: boolean;
}): string | null {
  const { response, today, isLoading, isFetching, isError, invalidated } = input;
  if (!response) {
    if (isLoading || isFetching) return "Cargando selección diaria…";
    if (isError) return "No se pudo cargar Para este momento";
    return null;
  }
  if (invalidated) {
    return isError
      ? "No se pudo actualizar la selección"
      : "Actualizando selección diaria…";
  }
  if (response.date !== today) {
    return isError
      ? "Selección anterior · no se pudo actualizar"
      : "Selección anterior · actualizando";
  }
  if (response.eligibleCount === 0 || response.source === "empty") {
    return "Hoy no hay sesiones disponibles";
  }
  if (isError) return "No se pudo actualizar · mostrando selección guardada";
  if (isFetching) return "Selección guardada · actualizando";
  return null;
}