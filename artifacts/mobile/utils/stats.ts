// ── Shared stats helpers ───────────────────────────────────────────────────────
//
// Fuente ÚNICA de verdad para la racha (Tarea de auditoría):
// - Día activo = sumar >= GOAL_MINUTES minutos escuchados ese día (local).
// - Racha actual: si hoy aún no cumple la meta, se cuenta desde ayer
//   (la racha "no se rompe" hasta que termina el día).
// - Los días se comparan por clave de calendario local (nunca por diferencia
//   de timestamps: eso se rompe con cambios de hora/DST).
// Cualquier pantalla que muestre racha/semana debe importar de aquí.

export const GOAL_MINUTES = 5;

export type StatEventLike = { playedAt: string; minutes?: number };

export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return startOfDay(d);
}

/** Lunes (00:00 local) de la semana del día dado. */
export function startOfWeek(d: Date): Date {
  const copy = startOfDay(d);
  const dow = copy.getDay();
  copy.setDate(copy.getDate() + (dow === 0 ? -6 : 1 - dow));
  return copy;
}

/** Minutos escuchados agregados por día local. */
export function minutesByDay(events: StatEventLike[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const e of events) {
    const k = dayKey(new Date(e.playedAt));
    map.set(k, (map.get(k) ?? 0) + (e.minutes ?? 0));
  }
  return map;
}

function isActiveDay(byDay: Map<string, number>, d: Date): boolean {
  return (byDay.get(dayKey(d)) ?? 0) >= GOAL_MINUTES;
}

/** Racha actual: días consecutivos con la meta cumplida, empezando hoy
 *  (o ayer si hoy aún no cumple la meta). */
export function computeCurrentStreak(events: StatEventLike[]): number {
  if (!events.length) return 0;
  const byDay = minutesByDay(events);
  const today = startOfDay(new Date());
  const start = isActiveDay(byDay, today) ? 0 : 1;
  let count = 0;
  for (let i = start; i < 3650; i++) {
    if (isActiveDay(byDay, daysAgo(i))) count++;
    else break;
  }
  return count;
}

/** Racha máxima histórica (misma meta diaria que la racha actual).
 *  Encadena por calendario local avanzando día a día, sin restar timestamps. */
export function computeMaxStreak(events: StatEventLike[]): number {
  if (!events.length) return 0;
  const byDay = minutesByDay(events);
  const activeKeys = new Set<string>();
  for (const [k, m] of byDay) if (m >= GOAL_MINUTES) activeKeys.add(k);
  if (activeKeys.size === 0) return 0;

  let max = 0;
  for (const k of activeKeys) {
    const [y, mo, da] = k.split("-").map(Number);
    const prev = new Date(y, mo - 1, da);
    prev.setDate(prev.getDate() - 1);
    if (activeKeys.has(dayKey(prev))) continue; // no es inicio de cadena
    let len = 0;
    const walk = new Date(y, mo - 1, da);
    while (activeKeys.has(dayKey(walk))) {
      len++;
      walk.setDate(walk.getDate() + 1);
    }
    if (len > max) max = len;
  }
  return max;
}

/** Semana actual (Lun-Dom): qué días cumplieron la meta. */
export function computeWeekFlags(events: StatEventLike[]): {
  flags: boolean[];
  weekCount: number;
  todayIndex: number;
} {
  const byDay = minutesByDay(events);
  const today = new Date();
  const monday = startOfWeek(today);
  const todayKey = dayKey(today);
  const flags: boolean[] = [];
  let weekCount = 0;
  let todayIndex = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const met = isActiveDay(byDay, d);
    flags.push(met);
    if (met) weekCount++;
    if (dayKey(d) === todayKey) todayIndex = i;
  }
  return { flags, weekCount, todayIndex };
}

/** Días distintos con al menos un evento (estadística de uso, no racha). */
export function computeActiveDays(events: StatEventLike[]): number {
  return new Set(events.map((e) => dayKey(new Date(e.playedAt)))).size;
}

export function formatMinutes(minutes: number): string {
  if (minutes <= 0) return "0 min";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
