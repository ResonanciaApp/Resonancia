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
    id: "tibetan-bowls",
    title: "Tibetan Bowls",
    subtitle: "Ancient resonance for deep healing",
    icon: "circle",
    sessionCount: 3,
    color: "#C69B4F",
    gradient: ["#3C2415", "#24160F"],
  },
  {
    id: "crystal-bowls",
    title: "Crystal Bowls",
    subtitle: "Pure quartz frequencies",
    icon: "triangle",
    sessionCount: 2,
    color: "#A8D8E8",
    gradient: ["#1A2C3C", "#24160F"],
  },
  {
    id: "gong-sounds",
    title: "Gong Sounds",
    subtitle: "Primordial vibration & release",
    icon: "disc",
    sessionCount: 1,
    color: "#D4A853",
    gradient: ["#3A2010", "#24160F"],
  },
  {
    id: "guided-meditations",
    title: "Guided Meditations",
    subtitle: "Voice-led inner journeys",
    icon: "eye",
    sessionCount: 1,
    color: "#9B8FC7",
    gradient: ["#1E1A2E", "#24160F"],
  },
  {
    id: "sleep-rest",
    title: "Sleep & Rest",
    subtitle: "Deep delta frequencies for sleep",
    icon: "moon",
    sessionCount: 3,
    color: "#7BB8D4",
    gradient: ["#0D1B2A", "#24160F"],
  },
  {
    id: "breathwork",
    title: "Breathwork",
    subtitle: "Breathe your way to calm",
    icon: "wind",
    sessionCount: 1,
    color: "#88C9A1",
    gradient: ["#0F2018", "#24160F"],
  },
  {
    id: "anxiety-relief",
    title: "Anxiety Relief",
    subtitle: "Soothing frequencies for the mind",
    icon: "heart",
    sessionCount: 1,
    color: "#E8A0A0",
    gradient: ["#2A0F0F", "#24160F"],
  },
  {
    id: "conscious-pauses",
    title: "Conscious Pauses",
    subtitle: "Short resets throughout your day",
    icon: "pause-circle",
    sessionCount: 2,
    color: "#C4B89A",
    gradient: ["#2A2010", "#24160F"],
  },
  {
    id: "focus-presence",
    title: "Focus & Presence",
    subtitle: "Alpha waves for clarity",
    icon: "target",
    sessionCount: 1,
    color: "#F0C96E",
    gradient: ["#2A1E00", "#24160F"],
  },
  {
    id: "sound-healing",
    title: "Sound Healing",
    subtitle: "Full-body energetic renewal",
    icon: "activity",
    sessionCount: 2,
    color: "#D4956A",
    gradient: ["#2A1508", "#24160F"],
  },
];
