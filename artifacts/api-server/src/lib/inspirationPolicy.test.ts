import { describe, expect, it } from "vitest";
import sharp from "sharp";
import {
  inspirationClock, inspirationWeekDates, inspirationDate, inspirationDay,
  emptyInspirationContent, requireInspirationRevision,
} from "./inspirationPolicy";
import { validateInspirationImage } from "./inspirationImage";

describe("inspiration publication policy", () => {
  it("uses the server instant across midnight, year boundaries and DST", () => {
    const now = new Date("2027-01-01T00:30:00Z");
    expect(inspirationClock("America/Los_Angeles", now).today).toBe("2026-12-31");
    expect(inspirationClock("Pacific/Kiritimati", now).today).toBe("2027-01-01");
    expect(inspirationClock("America/New_York", new Date("2026-03-08T06:59:59Z")).today).toBe("2026-03-08");
    expect(inspirationClock("America/New_York", new Date("2026-03-08T07:00:01Z")).today).toBe("2026-03-08");
    expect(() => inspirationClock("2099-01-01")).toThrow();
    expect(() => inspirationClock("+14:00")).toThrow();
    expect(() => inspirationClock(["UTC"])).toThrow();
  });
  it("derives seven Monday–Sunday slots including cross-year and leap dates", () => {
    expect(inspirationWeekDates("2027-01-01")).toEqual(["2026-12-28","2026-12-29","2026-12-30","2026-12-31","2027-01-01","2027-01-02","2027-01-03"]);
    expect(inspirationWeekDates("2028-02-29")).toHaveLength(7);
    expect(inspirationDate.safeParse("2027-02-29").success).toBe(false);
    expect(inspirationDate.safeParse("2026-13-01").success).toBe(false);
  });
  it("never serializes future or withdrawn editorial fields and uses only published snapshots", () => {
    const row = { id: "b6f996da-5ed1-4630-a3ba-b887311e1fc2", date: "2027-01-01", revision: 4, draft: { ...emptyInspirationContent, quote: "secret draft" }, published: { ...emptyInspirationContent, quote: "published", imagePath: "/objects/private" }, publishedRevision: 2, deleted: false, updatedAt: new Date() };
    const future = inspirationDay(row, row.date, "2026-12-31", "UTC", "https://example.org");
    expect(future).toEqual({ date: row.date, status: "future", id: null, revision: null, content: null });
    expect(JSON.stringify(future)).not.toMatch(/secret|published|objects/);
    const live = inspirationDay(row, row.date, "2027-01-01", "UTC", "https://example.org");
    expect(live.content?.quote).toBe("published");
    expect(live.revision).toBe(2);
    expect(live.content?.imageUrl).toContain("https://example.org/api/inspirations/");
    expect(live.content).not.toHaveProperty("imagePath");
    expect(inspirationDay({ ...row, deleted: true }, row.date, "2027-01-01", "UTC", "").content).toBeNull();
    expect(inspirationDay({ ...row, published: null }, row.date, "2027-01-01", "UTC", "").content).toBeNull();
  });
  it("revision conflicts include the current revision", () => {
    expect(() => requireInspirationRevision(3, 1)).toThrow(expect.objectContaining({ status: 409, currentRevision: 3 }));
  });
  it("decodes valid images, rejects spoofed/truncated image data", async () => {
    const png = await sharp({ create: { width: 16, height: 16, channels: 3, background: "#888" } }).png().toBuffer();
    await expect(validateInspirationImage(png, "image/png")).resolves.toBeUndefined();
    await expect(validateInspirationImage(png, "image/jpeg")).rejects.toThrow();
    await expect(validateInspirationImage(png.subarray(0, 25), "image/png")).rejects.toThrow();
    await expect(validateInspirationImage(Buffer.from("<svg/>"), "image/png")).rejects.toThrow();
  });
});