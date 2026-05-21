export type Category = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  sessionCount: number;
  color: string;
  gradient: [string, string];
};

export const CATEGORIES: Category[] = [
  {
    id: "guided-meditations",
    title: "Meditaciones Guiadas",
    subtitle: "Meditaciones con con sonidos de cuencos y gongs",
    icon: "eye",
    sessionCount: 12,
    color: "#C69B4F",
    gradient: ["#3C2415", "#24160F"],
  },
];
