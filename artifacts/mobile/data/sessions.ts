export type Session = {
  id: string;
  title: string;
  subtitle: string;
  categoryId: string;
  categoryLabel: string;
  duration: number;
  durationLabel: string;
  description: string;
  benefits: string[];
  instruments: string[];
  image: ReturnType<typeof require>;
  isFeatured?: boolean;
  isNew?: boolean;
  frequency?: string;
};

export const SESSIONS: Session[] = [
  {
    id: "1",
    title: "Hola",
    subtitle: "Meditación Primordial",
    categoryId: "guided-meditations",
    categoryLabel: "Meditaciones Guiadas",
    duration: 30,
    durationLabel: "30 min",
    description:
      "Harmonize your energy and reconnect with stillness through deep vibrational resonance. Ancient Tibetan bowls guide you inward toward profound inner peace.",
    benefits: ["Deep relaxation", "Mental clarity", "Stress release", "Energetic balance"],
    instruments: ["Tibetan singing bowls", "Hand pan", "Bell"],
    image: require("@/assets/images/4b.jpg"),
    isFeatured: true,
  },
  {
    id: "2",
    title: "Golden Sleep",
    subtitle: "Deep Rest Session",
    categoryId: "sleep-rest",
    categoryLabel: "Sleep & Deep Rest",
    duration: 45,
    durationLabel: "45 min",
    description:
      "Drift into the most restorative sleep of your life. Gentle crystal bowl frequencies and golden tones dissolve tension and invite deep, healing rest.",
    benefits: ["Improved sleep", "Anxiety relief", "Full body relaxation", "Dream depth"],
    instruments: ["Crystal singing bowls", "Drone harmonics", "Soft nature sounds"],
    image: require("@/assets/images/crystal-bowls.png"),
    isFeatured: true,
  },
  {
    id: "3",
    title: "Cosmic Gong Bath",
    subtitle: "Transformational Gong Session",
    categoryId: "gong-sounds",
    categoryLabel: "Gong Sounds",
    duration: 60,
    durationLabel: "60 min",
    description:
      "Immerse yourself in the primordial vibration of the gong. Waves of deep resonance wash through every cell, releasing what no longer serves.",
    benefits: ["Deep emotional release", "Nervous system reset", "Trauma healing", "Expanded awareness"],
    instruments: ["Paiste gong", "Tibetan bowls", "Chimes"],
    image: require("@/assets/images/8b.jpg"),
    isFeatured: true,
  },
  {
    id: "4",
    title: "Morning Presence",
    subtitle: "Guided Meditation",
    categoryId: "guided-meditations",
    categoryLabel: "Guided Meditations",
    duration: 15,
    durationLabel: "15 min",
    description:
      "Begin your day anchored in clarity and grace. A gentle guided journey to awaken your senses, set your intention, and meet the day from your deepest self.",
    benefits: ["Mental clarity", "Intention setting", "Calm focus", "Emotional groundedness"],
    instruments: ["Tibetan singing bowls", "Soft voice guidance"],
    image: require("@/assets/images/meditation-person.png"),
  },
  {
    id: "5",
    title: "Crystal Clarity",
    subtitle: "Crystal Bowl Session",
    categoryId: "crystal-bowls",
    categoryLabel: "Crystal Bowls",
    duration: 25,
    durationLabel: "25 min",
    description:
      "Pure quartz crystal bowls emit frequencies that resonate with your body's own crystalline structures, bringing profound clarity and harmonic coherence.",
    benefits: ["Energetic alignment", "Clarity of mind", "Heart opening", "Cellular resonance"],
    instruments: ["Crystal singing bowls", "Tingsha bells"],
    image: require("@/assets/images/crystal-bowls.png"),
    frequency: "432 Hz",
    isNew: true,
  },
  {
    id: "6",
    title: "Breath of Peace",
    subtitle: "Breathwork Session",
    categoryId: "breathwork",
    categoryLabel: "Breathwork",
    duration: 12,
    durationLabel: "12 min",
    description:
      "Regulate your nervous system with conscious breathing techniques. Bowls provide a supportive sonic field as you breathe your way to calm and presence.",
    benefits: ["Nervous system regulation", "Anxiety relief", "Oxygen balance", "Instant calm"],
    instruments: ["Crystal bowls", "Ambient drone"],
    image: require("@/assets/images/meditation-person.png"),
  },
  {
    id: "7",
    title: "Anxiety Dissolve",
    subtitle: "Emotional Healing",
    categoryId: "anxiety-relief",
    categoryLabel: "Anxiety Relief",
    duration: 20,
    durationLabel: "20 min",
    description:
      "Gentle, warm frequencies designed to soothe an anxious mind. Let the sound carry away tension, worry, and overwhelm — returning you to safe ground.",
    benefits: ["Anxiety reduction", "Nervous system calm", "Emotional safety", "Present moment awareness"],
    instruments: ["Tibetan bowls", "Crystal bowls", "Gentle hum"],
    image: require("@/assets/images/hero-bowl.png"),
  },
  {
    id: "8",
    title: "Still Waters",
    subtitle: "Conscious Pause",
    categoryId: "conscious-pauses",
    categoryLabel: "Conscious Pauses",
    duration: 5,
    durationLabel: "5 min",
    description:
      "A pocket of stillness in your day. Five minutes to return to yourself, to breathe, and to remember what truly matters.",
    benefits: ["Quick reset", "Mindful pause", "Stress relief", "Clarity"],
    instruments: ["Tibetan singing bowl", "Silence"],
    image: require("@/assets/images/tibetan-bowl.png"),
  },
  {
    id: "9",
    title: "Deep Delta Sleep",
    subtitle: "Sleep Frequency Session",
    categoryId: "sleep-rest",
    categoryLabel: "Sleep & Deep Rest",
    duration: 60,
    durationLabel: "60 min",
    description:
      "Delta brainwave entrainment through carefully tuned bowl frequencies. Fall into the deepest, most restorative sleep as your mind releases all activity.",
    benefits: ["Delta brainwave induction", "Full nervous system rest", "Growth hormone release", "Deep healing"],
    instruments: ["Crystal bowls", "Tibetan bowls", "Low drone"],
    image: require("@/assets/images/cosmic-bg.png"),
    frequency: "Delta 0.5–4 Hz",
  },
  {
    id: "10",
    title: "Grounded Clarity",
    subtitle: "Focus & Presence",
    categoryId: "focus-presence",
    categoryLabel: "Focus & Presence",
    duration: 20,
    durationLabel: "20 min",
    description:
      "Sharpen attention and settle into the present moment. Alpha-wave frequencies gently focus the mind while releasing scattered thoughts.",
    benefits: ["Improved focus", "Productivity", "Mental stillness", "Creative flow"],
    instruments: ["Crystal bowls", "Bell", "Tibetan bowl"],
    image: require("@/assets/images/meditation-person.png"),
    frequency: "Alpha 8–14 Hz",
    isNew: true,
  },
  {
    id: "11",
    title: "Sound Healing Journey",
    subtitle: "Full Immersive Session",
    categoryId: "sound-healing",
    categoryLabel: "Sound Healing",
    duration: 50,
    durationLabel: "50 min",
    description:
      "A complete sound healing journey moving through all energy centers. Tibetan and crystal bowls, gong, and chimes weave a tapestry of total renewal.",
    benefits: ["Full body healing", "Energetic cleansing", "Emotional release", "Deep renewal"],
    instruments: ["Tibetan bowls", "Crystal bowls", "Paiste gong", "Chimes", "Bell"],
    image: require("@/assets/images/hero-bowl.png"),
    isFeatured: true,
  },
  {
    id: "12",
    title: "Moonrise Rest",
    subtitle: "Sleep Soundscape",
    categoryId: "sleep-rest",
    categoryLabel: "Sleep & Deep Rest",
    duration: 90,
    durationLabel: "90 min",
    description:
      "A long-form night journey of crystalline tones, soft bowls, and gentle cosmic ambience. Sleep deeper than you have in years.",
    benefits: ["Extended deep sleep", "Dream support", "Complete relaxation", "Melatonin support"],
    instruments: ["Crystal bowls", "Ambient field recordings", "Soft gong"],
    image: require("@/assets/images/cosmic-bg.png"),
  },
  {
    id: "13",
    title: "Tibetan Sunrise",
    subtitle: "Morning Bowl Ritual",
    categoryId: "tibetan-bowls",
    categoryLabel: "Tibetan Bowls",
    duration: 18,
    durationLabel: "18 min",
    description:
      "Greet the morning with ancient Tibetan resonance. Strike the day open with pure tones that awaken the soul before the mind begins its chatter.",
    benefits: ["Morning grounding", "Energetic awakening", "Clarity", "Presence"],
    instruments: ["Tibetan singing bowls", "Hand bell"],
    image: require("@/assets/images/tibetan-bowl.png"),
  },
  {
    id: "14",
    title: "Harmonic Release",
    subtitle: "Sound Healing Session",
    categoryId: "sound-healing",
    categoryLabel: "Sound Healing",
    duration: 35,
    durationLabel: "35 min",
    description:
      "Let the harmonics do what words cannot. Release held emotions, tension, and energetic blocks through the intelligent intelligence of sound.",
    benefits: ["Emotional release", "Tension relief", "Energetic flow", "Body awareness"],
    instruments: ["Crystal bowls", "Tibetan bowls", "Gong", "Voice"],
    image: require("@/assets/images/hero-bowl.png"),
  },
  {
    id: "15",
    title: "Sacred Pause",
    subtitle: "Midday Reset",
    categoryId: "conscious-pauses",
    categoryLabel: "Conscious Pauses",
    duration: 8,
    durationLabel: "8 min",
    description:
      "Your midday sanctuary. A brief, powerful reset that drops you out of doing and back into being. Perfect for between meetings or creative work.",
    benefits: ["Midday reset", "Stress relief", "Mental clarity", "Presence"],
    instruments: ["Tibetan bowl", "Bell"],
    image: require("@/assets/images/tibetan-bowl.png"),
    isNew: true,
  },
];

export function getSessionsByCategory(categoryId: string): Session[] {
  return SESSIONS.filter((s) => s.categoryId === categoryId);
}

export function getFeaturedSessions(): Session[] {
  return SESSIONS.filter((s) => s.isFeatured);
}

export function getSessionById(id: string): Session | undefined {
  return SESSIONS.find((s) => s.id === id);
}

export function getSleepSessions(): Session[] {
  return SESSIONS.filter((s) => s.categoryId === "sleep-rest");
}

export function getShortSessions(): Session[] {
  return SESSIONS.filter((s) => s.duration <= 15);
}
