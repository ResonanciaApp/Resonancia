export function formatShortDate(isoString: string): string {
  const d = parseISO(isoString);
  return new Intl.DateTimeFormat("es", { day: "numeric", month: "long", year: "numeric" }).format(d);
}

export function formatFullDate(isoString: string): string {
  const d = parseISO(isoString);
  return new Intl.DateTimeFormat("es", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(d);
}

export function formatDayNumber(isoString: string): string {
  const d = parseISO(isoString);
  return new Intl.DateTimeFormat("es", { day: "numeric" }).format(d);
}

export function formatDayLetter(isoString: string): string {
  const d = parseISO(isoString);
  const weekday = new Intl.DateTimeFormat("es", { weekday: "long" }).format(d);
  return weekday.charAt(0).toUpperCase();
}

export function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return new Intl.DateTimeFormat("es", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(d);
}

export function parseISO(isoString: string): Date {
  // Editorial dates are calendar days, not UTC instants (which shift in America).
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoString)) {
    const [year, month, day] = isoString.split("-").map(Number);
    return new Date(year, month - 1, day, 12);
  }
  return new Date(isoString);
}

export function addDays(date: Date, amount: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
}

export function subDays(date: Date, amount: number): Date {
  return addDays(date, -amount);
}

export function formatISODate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
