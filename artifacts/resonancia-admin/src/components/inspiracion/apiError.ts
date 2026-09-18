type ApiErrorData = {
  error?: unknown;
  currentRevision?: unknown;
};

type ApiErrorLike = {
  status?: unknown;
  data?: unknown;
  message?: unknown;
};

export function getApiErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  const status = (error as ApiErrorLike).status;
  return typeof status === "number" ? status : undefined;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== "object") return fallback;

  const data = (error as ApiErrorLike).data;
  if (data && typeof data === "object") {
    const apiMessage = (data as ApiErrorData).error;
    if (typeof apiMessage === "string" && apiMessage.trim()) return apiMessage;
  }

  const message = (error as ApiErrorLike).message;
  return typeof message === "string" && message.trim() ? message : fallback;
}

export function getApiErrorCurrentRevision(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  const data = (error as ApiErrorLike).data;
  if (!data || typeof data !== "object") return undefined;

  const revision = (data as ApiErrorData).currentRevision;
  return typeof revision === "number" ? revision : undefined;
}