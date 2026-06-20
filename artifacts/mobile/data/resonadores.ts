import type { ImageSourcePropType } from "react-native";

export type ResonadorSubtipo = "Voz guía" | "Músico" | "Sonoterapeuta" | "Productor";

export type ExternalProject = {
  platform: "spotify" | "soundcloud" | "bandcamp" | "youtube" | "web";
  label: string;
  url: string;
};

export type FormacionItem = {
  institucion: string;
  titulo: string;
  years?: string;
};

export type Resonador = {
  id: string;
  clerkId?: string;
  name: string;
  photo: ImageSourcePropType;
  subtipo: ResonadorSubtipo;
  bio: string;
  city: string;
  country: string;
  specialty: string[];
  genres: string[];
  memberSince?: string;
  followersCount?: number;
  followingCount?: number;
  certified?: boolean;
  servicesDescription?: string;
  instagram?: string;
  linktree?: string;
  donationUrl?: string;
  sessionIds?: string[];
  projects?: ExternalProject[];
  formacion?: FormacionItem[];
  quote?: string;
};

export const COUNTRY_FLAGS: Record<string, string> = {
  Argentina: "🇦🇷",
  Bolivia: "🇧🇴",
  Chile: "🇨🇱",
  Colombia: "🇨🇴",
  Ecuador: "🇪🇨",
  México: "🇲🇽",
  Paraguay: "🇵🇾",
  Perú: "🇵🇪",
  Uruguay: "🇺🇾",
  Venezuela: "🇻🇪",
};

export const RESONADORES: Resonador[] = [
  {
    id: "luna-cosmica",
    clerkId: "user_3FNf8BwxG6rkcBWPpgFrxBzp88q",
    name: "Luna Cósmica",
    photo: require("@/assets/images/artists/luna-cosmica.png"),
    subtipo: "Sonoterapeuta",
    bio: "Terapeuta del sonido especializada en cuencos tibetanos y frecuencias binaurales. Creo espacios de sanación donde el sonido se convierte en medicina.",
    city: "Buenos Aires",
    country: "Argentina",
    certified: true,
    specialty: ["Cuencos tibetanos", "Frecuencias binaurales", "Sanación sonora"],
    genres: ["Cuencos tibetanos", "Frecuencias binaurales", "Sonidos ancestrales", "ASMR", "Meditación profunda"],
    memberSince: "2023",
    followersCount: 1842,
    followingCount: 234,
    servicesDescription: "Ofrezco sesiones individuales y grupales de sonoterapia. Cada experiencia es diseñada para liberar bloqueos emocionales y restaurar el equilibrio energético a través de frecuencias específicas.",
    instagram: "https://instagram.com/lunacosmica",
    donationUrl: "https://cafecito.app/lunacosmica",
    sessionIds: ["1", "5", "7", "8", "9", "10"],
    projects: [
      { platform: "spotify", label: "Luna Cósmica en Spotify", url: "https://spotify.com" },
      { platform: "youtube", label: "Canal de YouTube", url: "https://youtube.com" },
    ],
    formacion: [
      { institucion: "Instituto de Sonología de Buenos Aires", titulo: "Diplomado en Sonoterapia", years: "2019 — 2021" },
      { institucion: "Sacred Sound Academy", titulo: "Cuencos Tibetanos Nivel III", years: "2022" },
    ],
    quote: "El sonido no entra por los oídos — entra por el alma.",
  },
  {
    id: "kai-amara",
    name: "Kai Amara",
    photo: require("@/assets/images/artists/kai-amara.png"),
    subtipo: "Voz guía",
    bio: "Instructor de meditación con más de 8 años de práctica. Mi voz es el puente entre el mundo exterior y tu paz interior.",
    city: "Ciudad de México",
    country: "México",
    certified: true,
    specialty: ["Meditación guiada", "Mindfulness", "Respiración consciente"],
    genres: ["Meditación guiada", "Mindfulness", "Breathwork", "Voz meditativa", "ASMR"],
    memberSince: "2022",
    followersCount: 3210,
    followingCount: 187,
    servicesDescription: "Guío meditaciones personalizadas para individuos y empresas. También ofrezco retiros de silencio y talleres de mindfulness aplicado al estrés y la ansiedad.",
    instagram: "https://instagram.com/kaiamara",
    linktree: "https://linktr.ee/kaiamara",
    donationUrl: "https://ko-fi.com/kaiamara",
    sessionIds: ["20", "21", "22", "23", "24", "25"],
    projects: [
      { platform: "youtube", label: "Meditaciones en YouTube", url: "https://youtube.com" },
      { platform: "soundcloud", label: "SoundCloud", url: "https://soundcloud.com" },
      { platform: "web", label: "kaiamara.com", url: "https://kaiamara.com" },
    ],
    formacion: [
      { institucion: "Mindfulness Institute México", titulo: "Instructor de Meditación Certificado", years: "2016 — 2018" },
      { institucion: "Centro Zen de Oaxaca", titulo: "Retiro de formación intensiva", years: "2020" },
    ],
    quote: "La meditación no es escapar de la vida, es vivirla con presencia total.",
  },
  {
    id: "lumen-sonora",
    name: "Lumen Sonora",
    photo: require("@/assets/images/artists/lumen-sonora.png"),
    subtipo: "Productor",
    bio: "Productor de música electrónica orgánica y ambient. Fusiono sintetizadores analógicos con sonidos de la naturaleza para crear paisajes sonoros únicos.",
    city: "Medellín",
    country: "Colombia",
    certified: true,
    specialty: ["Producción musical", "Música ambient", "Síntesis analógica"],
    genres: ["Ambient", "Música Enteógena", "Electrónica Orgánica", "Drone", "Soundscape"],
    memberSince: "2022",
    followersCount: 5640,
    followingCount: 412,
    servicesDescription: "Produzco música original para proyectos de bienestar, yoga, meditación y experiencias inmersivas. También ofrezco colaboraciones con artistas y estudios de grabación.",
    instagram: "https://instagram.com/lumensonora",
    sessionIds: ["26", "27", "28", "29", "30", "31"],
    projects: [
      { platform: "spotify", label: "Lumen Sonora en Spotify", url: "https://spotify.com" },
      { platform: "bandcamp", label: "Bandcamp", url: "https://bandcamp.com" },
      { platform: "soundcloud", label: "SoundCloud", url: "https://soundcloud.com" },
    ],
    formacion: [
      { institucion: "Berklee Online", titulo: "Music Production & Technology", years: "2017 — 2019" },
      { institucion: "Red Bull Music Academy", titulo: "Electronic Music Production", years: "2021" },
    ],
    quote: "El silencio entre las notas es tan importante como las notas mismas.",
  },
  {
    id: "arbol-sagrado",
    name: "Árbol Sagrado",
    photo: require("@/assets/images/artists/arbol-sagrado.png"),
    subtipo: "Músico",
    bio: "Intérprete de cuencos tibetanos y gongs planetarios. Cada concierto de cuencos es una ceremonia de sonido que conecta con lo más profundo del ser.",
    city: "Lima",
    country: "Perú",
    certified: true,
    specialty: ["Cuencos tibetanos", "Gongs planetarios", "Conciertos de sonido"],
    genres: ["Cuencos tibetanos", "Gongs", "Sonidos Ancestrales", "Música Ceremonial", "World Music"],
    memberSince: "2023",
    followersCount: 2180,
    followingCount: 309,
    servicesDescription: "Realizo conciertos de cuencos y gongs en formato individual, grupal y ceremonial. Cada sesión es diseñada según la intención del grupo, desde la relajación profunda hasta la activación energética.",
    instagram: "https://instagram.com/arbolsagrado",
    sessionIds: ["32", "33", "34", "35", "36", "37"],
    projects: [
      { platform: "spotify", label: "Álbumes en Spotify", url: "https://spotify.com" },
      { platform: "youtube", label: "Conciertos en vivo", url: "https://youtube.com" },
      { platform: "bandcamp", label: "Discografía completa", url: "https://bandcamp.com" },
    ],
    formacion: [
      { institucion: "Tíbet Academy", titulo: "Cuencos Tibetanos Tradicionales", years: "2015 — 2017" },
      { institucion: "Peter Hess Institut", titulo: "Sound Massage Practitioner", years: "2019" },
    ],
    quote: "Los cuencos recuerdan al cuerpo lo que la mente olvida.",
  },
];

export function getResonadorById(id: string): Resonador | undefined {
  return RESONADORES.find((r) => r.id === id);
}
