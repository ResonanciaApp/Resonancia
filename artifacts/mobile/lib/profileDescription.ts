export const MAX_PROFILE_DESCRIPTION_LENGTH = 300;

/** Match the native input limit, preserve line breaks and never split a surrogate pair. */
export function limitProfileDescription(value: string): string {
  return value.replace(/\r\n?/g, "\n").slice(0, MAX_PROFILE_DESCRIPTION_LENGTH).replace(/[\uD800-\uDBFF]$/, "");
}