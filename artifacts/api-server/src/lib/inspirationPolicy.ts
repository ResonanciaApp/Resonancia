import { z } from "zod";
import type { InspirationContent, inspirationsTable } from "@workspace/db";

export class InspirationError extends Error {
  constructor(public status: number, message: string, public currentRevision?: number) { super(message); }
}
export const inspirationDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((s) => {
  const d = new Date(`${s}T12:00:00Z`);
  return !Number.isNaN(d.valueOf()) && d.toISOString().slice(0, 10) === s && s >= "1900-01-01" && s <= "2200-12-31";
}, "Fecha inválida");
export function inspirationClock(value: unknown, now = new Date()) {
  if (value !== undefined && (typeof value !== "string" || value.length > 100)) throw new InspirationError(400, "Zona horaria inválida");
  const timeZone = value === undefined ? "UTC" : value as string;
  // Reject numeric-offset zones: the contract requires a named IANA zone.
  if (/^[+-]/.test(timeZone) || !timeZone) throw new InspirationError(400, "Zona horaria inválida");
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
    const get = (type: string) => parts.find((p) => p.type === type)!.value;
    return { timeZone, today: `${get("year")}-${get("month")}-${get("day")}` };
  } catch { throw new InspirationError(400, "Zona horaria inválida"); }
}
export function inspirationWeekDates(date: string) {
  inspirationDate.parse(date);
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const n = new Date(d); n.setUTCDate(n.getUTCDate() + i);
    return n.toISOString().slice(0, 10);
  });
}
export const defaultInspirationSettings = {
  revision: 0, sectionTitle: "Inspiración diaria", readMoreLabel: "Leer más",
  discoverMoreLabel: "Descubre más", notesLabel: "Mis notas",
};
export const emptyInspirationContent: InspirationContent = {
  quote: "", author: null, reflection: "", imagePath: null,
  imagePositionX: 50, imagePositionY: 50, overlayOpacity: .35, sessionId: null,
};
type Row = typeof inspirationsTable.$inferSelect;
export function inspirationAvailable(row: Row | undefined, today: string): row is Row & { published: InspirationContent } {
  return !!row && !row.deleted && !!row.published && row.date <= today;
}
export function inspirationDay(row: Row | undefined, date: string, today: string, timeZone: string, origin: string) {
  const neutral = { date, status: date > today ? "future" as const : "unavailable" as const, id: null, revision: null, content: null };
  if (!inspirationAvailable(row, today)) return neutral;
  const { imagePath: _path, ...content } = row.published;
  return {
    date, status: "available" as const, id: row.id, revision: row.publishedRevision,
    content: { ...content, imageUrl: `${origin}/api/inspirations/${row.id}/image?timeZone=${encodeURIComponent(timeZone)}&revision=${row.publishedRevision}` },
  };
}
export function requireInspirationRevision(actual: number, expected: number) {
  if (actual !== expected) throw new InspirationError(409, "Hay cambios en otro dispositivo. Recarga y conserva tu versión para resolver el conflicto.", actual);
}
export function validImageSignature(bytes: Buffer, type: string) {
  if (type === "image/png") return bytes.length >= 24 && bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) && bytes.toString("ascii",12,16) === "IHDR" && bytes.readUInt32BE(16) > 0 && bytes.readUInt32BE(20) > 0;
  if (type === "image/jpeg") return bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (type === "image/webp") return bytes.length >= 16 && bytes.toString("ascii",0,4) === "RIFF" && bytes.toString("ascii",8,12) === "WEBP" && ["VP8 ", "VP8L", "VP8X"].includes(bytes.toString("ascii",12,16));
  return false;
}