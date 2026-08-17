// ── Definición de hitos (logros) ──────────────────────────────────────────────
// Fuente ÚNICA de los umbrales. Las pantallas y el motor leen de aquí:
// agregar un nivel nuevo = agregar una entrada, sin tocar lógica.

export type MilestoneFamily = "racha" | "dias" | "mezclas" | "geometrix";

export interface MilestoneDef {
  id: string;
  family: MilestoneFamily;
  /** Umbral dentro de la familia (días, mezclas, geometrix…). */
  threshold: number;
  icon: string;
  title: string;
  /** Texto corto para la celebración y la lista de progreso. */
  description: string;
  /** Hito destacado (celebración más grande). */
  superHito?: boolean;
}

export const MILESTONES: MilestoneDef[] = [
  {
    id: "streak-1",
    family: "racha",
    threshold: 1,
    icon: "🔥",
    title: "Primer día en resonancia",
    description: "Cumpliste tu primer día de práctica.",
  },
  {
    id: "streak-7",
    family: "racha",
    threshold: 7,
    icon: "🔥",
    title: "7 días en resonancia",
    description: "Cumpliste 7 días seguidos de práctica.",
  },
  {
    id: "days-50",
    family: "dias",
    threshold: 50,
    icon: "🌟",
    title: "50 días de práctica",
    description: "Acumulaste 50 días de práctica en total.",
    superHito: true,
  },
  { id: "mix-1",  family: "mezclas", threshold: 1,  icon: "🎶", title: "Primera mezcla",   description: "Creaste tu primera mezcla." },
  { id: "mix-5",  family: "mezclas", threshold: 5,  icon: "🎶", title: "5 mezclas",        description: "Ya llevas 5 mezclas creadas." },
  { id: "mix-10", family: "mezclas", threshold: 10, icon: "🎶", title: "10 mezclas",       description: "Ya llevas 10 mezclas creadas." },
  { id: "mix-25", family: "mezclas", threshold: 25, icon: "🎶", title: "25 mezclas",       description: "Ya llevas 25 mezclas creadas." },
  { id: "mix-50", family: "mezclas", threshold: 50, icon: "🎶", title: "50 mezclas",       description: "50 mezclas creadas. Maestría sonora.", superHito: true },
  { id: "geo-1",  family: "geometrix", threshold: 1,  icon: "🔯", title: "Primer Geometrix", description: "Guardaste tu primera creación de Geometrix." },
  { id: "geo-5",  family: "geometrix", threshold: 5,  icon: "🔯", title: "5 Geometrix",      description: "Ya llevas 5 creaciones de Geometrix." },
  { id: "geo-10", family: "geometrix", threshold: 10, icon: "🔯", title: "10 Geometrix",     description: "Ya llevas 10 creaciones de Geometrix." },
  { id: "geo-25", family: "geometrix", threshold: 25, icon: "🔯", title: "25 Geometrix",     description: "Ya llevas 25 creaciones de Geometrix." },
  { id: "geo-50", family: "geometrix", threshold: 50, icon: "🔯", title: "50 Geometrix",     description: "50 creaciones de Geometrix. Geometría maestra.", superHito: true },
];

export function getMilestone(id: string): MilestoneDef | undefined {
  return MILESTONES.find((m) => m.id === id);
}
