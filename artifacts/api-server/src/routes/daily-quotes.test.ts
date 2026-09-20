import { describe, expect, it } from "vitest";
import { chileDate, chooseDailyQuote } from "./daily-quotes";

const quote = (id: string) => ({ id, text: id, author: "Autor", active: true, deleted: false, seedKey: null, revision: 1, createdAt: new Date(), updatedAt: new Date() });
const assignment = (date: string, quoteId: string, cycle: number) => ({ date, quoteId, text: quoteId, author: "Autor", cycle, assignedAt: new Date() });

describe("daily quote rotation", () => {
  it("uses every active quote once before starting a new cycle", () => {
    const active = ["a", "b", "c"].map(quote);
    const history = [assignment("2025-01-03", "c", 1), assignment("2025-01-02", "b", 1), assignment("2025-01-01", "a", 1)];
    const next = chooseDailyQuote(active, history, 0);
    expect(next.cycle).toBe(2);
    expect(next.quote.id).not.toBe("c");
  });

  it("keeps the same Chile calendar date around UTC midnight", () => {
    expect(chileDate(new Date("2025-01-01T02:00:00.000Z"))).toBe("2024-12-31");
    expect(chileDate(new Date("2025-01-01T05:00:00.000Z"))).toBe("2025-01-01");
  });
});