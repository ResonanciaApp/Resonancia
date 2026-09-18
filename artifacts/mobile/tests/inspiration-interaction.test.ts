import assert from "node:assert/strict";
import test from "node:test";
import { initialInspirationDate, settledInspirationIndex, commitInspirationDate } from "../lib/inspiration-interaction.ts";
import { parseISO, formatISODate, formatDayNumber, addDays } from "../lib/date-utils.ts";

const days = ["2026-12-28", "2026-12-29", "2026-12-30", "2026-12-31", "2027-01-01", "2027-01-02", "2027-01-03"];
test("entry selects today or explicit date and a new week starts at its first date", () => {
  assert.equal(initialInspirationDate(days, undefined, "2027-01-01"), "2027-01-01");
  assert.equal(initialInspirationDate(days, "2026-12-29", "2027-01-01"), "2026-12-29");
  assert.equal(initialInspirationDate(days, undefined, "2027-01-11"), days[0]);
});
test("page commit rejects partial drags, out-of-bounds bounce and invalid geometry", () => {
  assert.equal(settledInspirationIndex(180, 360, 7), null);
  assert.equal(settledInspirationIndex(359.7, 360, 7), 1);
  assert.equal(settledInspirationIndex(-40, 360, 7), null);
  assert.equal(settledInspirationIndex(2520, 360, 7), null);
  assert.equal(settledInspirationIndex(0, 0, 7), null);
  assert.equal(settledInspirationIndex(NaN, 360, 7), null);
});
test("canceled gesture and refreshed same-day data do not replay the entrance", () => {
  assert.deepEqual(commitInspirationDate(days[2], days[2], 4), { selected: days[2], entrance: 4 });
  assert.deepEqual(commitInspirationDate(days[2], days[3], 4), { selected: days[3], entrance: 5 });
});
test("resizing uses the new page width and keeps selected day", () => {
  assert.equal(settledInspirationIndex(3 * 720, 720, 7), 3);
  assert.equal(settledInspirationIndex(3 * 360, 360, 7), 3);
});
test("editorial dates never shift to the previous day across timezone/DST/year boundaries", () => {
  const previous = process.env.TZ;
  try {
    for (const zone of ["America/Los_Angeles", "America/New_York", "Pacific/Auckland", "Europe/Madrid"]) {
      process.env.TZ = zone;
      for (const date of ["2026-03-08", "2026-11-01", "2026-12-31", "2027-01-01"]) {
        assert.equal(formatISODate(parseISO(date)), date, zone);
        assert.equal(formatDayNumber(date), String(Number(date.slice(-2))), zone);
      }
      assert.equal(formatISODate(addDays(parseISO("2026-12-31"), 1)), "2027-01-01", zone);
      assert.equal(formatISODate(addDays(parseISO("2026-03-08"), 1)), "2026-03-09", zone);
    }
  } finally { if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous; }
});