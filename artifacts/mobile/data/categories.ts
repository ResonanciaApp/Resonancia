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
    title: "Guided Meditations",
    subtitle: "Meditate with bowls and sacred sound",
    icon: "eye",
    sessionCount: 12,
    color: "#C69B4F",
    gradient: ["#3C2415", "#24160F"],
  },
  {
    id: "sound-healing",
    title: "Sound Healing",
    subtitle: "Immersive journeys of vibration and resonance",
    icon: "radio",
    sessionCount: 18,
    color: "#D6A85B",
    gradient: ["#3C2415", "#18110C"],
  },
  {
    id: "conscious-pauses",
    title: "Conscious Pauses",
    subtitle: "Short moments to return to yourself",
    icon: "pause-circle",
    sessionCount: 8,
    color: "#B07A36",
    gradient: ["#24160F", "#18110C"],
  },
  {
    id: "gong-sounds",
    title: "Gong Sounds",
    subtitle: "Deep transformational frequencies",
    icon: "disc",
    sessionCount: 10,
    color: "#A76A2A",
    gradient: ["#3C2415", "#24160F"],
  },
  {
    id: "sleep-rest",
    title: "Sleep & Deep Rest",
    subtitle: "For profound and restorative sleep",
    icon: "moon",
    sessionCount: 15,
    color: "#C69B4F",
    gradient: ["#18110C", "#0e0a06"],
  },
  {
    id: "crystal-bowls",
    title: "Crystal Bowls",
    subtitle: "Pure harmonic frequencies",
    icon: "zap",
    sessionCount: 14,
    color: "#EDE1D3",
    gradient: ["#3C2415", "#24160F"],
  },
  {
    id: "tibetan-bowls",
    title: "Tibetan Bowl Journeys",
    subtitle: "Ancient resonance for inner balance",
    icon: "circle",
    sessionCount: 16,
    color: "#D6A85B",
    gradient: ["#24160F", "#18110C"],
  },
  {
    id: "breathwork",
    title: "Breathwork",
    subtitle: "Regulate your nervous system",
    icon: "wind",
    sessionCount: 9,
    color: "#B07A36",
    gradient: ["#3C2415", "#18110C"],
  },
  {
    id: "anxiety-relief",
    title: "Anxiety Relief",
    subtitle: "Gentle sessions for emotional calm",
    icon: "heart",
    sessionCount: 11,
    color: "#C69B4F",
    gradient: ["#3C2415", "#24160F"],
  },
  {
    id: "focus-presence",
    title: "Focus & Presence",
    subtitle: "For clarity and grounded attention",
    icon: "target",
    sessionCount: 7,
    color: "#D6A85B",
    gradient: ["#24160F", "#18110C"],
  },
];
