/** Keep at most two explicit lines; Profile also caps visual wrapping at two. */
export function limitProfileDescriptionLines(value: string): string {
  return value.replace(/\r\n?/g, "\n").split("\n").slice(0, 2).join("\n");
}