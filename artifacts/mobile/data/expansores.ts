import type { ArtistLink } from "./artists";

export type Expansor = {
  id: string;
  name: string;
  photo: import("react-native").ImageSourcePropType;
  bio: string;
  city: string;
  country: string;
  /** Región de Chile, ej: "Metropolitana" */
  region?: string;
  specialty: string[];
  certified?: boolean;
  links?: ArtistLink[];
};

export const EXPANSORES: Expansor[] = [
  {
    id: "ana-sofia-luna",
    name: "Ana Sofía Luna",
    photo: require("@/assets/images/meditation-person.png"),
    bio: "Practicante de sonoterapia con cuencos tibetanos desde 2018. Ofrece sesiones individuales y grupales en Bogotá, acompañando procesos de relajación profunda y equilibrio energético.",
    city: "Bogotá",
    country: "Colombia",
    specialty: ["Cuencos Tibetanos", "Meditación"],
    certified: true,
  },
  {
    id: "carlos-medina",
    name: "Carlos Medina",
    photo: require("@/assets/images/crystal-bowls.png"),
    bio: "Terapeuta de sonido especializado en cuencos de cristal cuántico. Sus sesiones integran frecuencias reparadoras con respiración consciente para liberar bloqueos emocionales.",
    city: "Ciudad de México",
    country: "México",
    specialty: ["Cuencos de Cristal", "Gong"],
    certified: true,
    links: [{ label: "Instagram", url: "https://instagram.com" }],
  },
  {
    id: "valeria-rios",
    name: "Valeria Ríos",
    photo: require("@/assets/images/meditation-person.png"),
    bio: "Facilitadora de círculos de sonido y meditación. Lleva más de cinco años guiando experiencias de sanación colectiva con cuencos tibetanos y campanas.",
    city: "Buenos Aires",
    country: "Argentina",
    specialty: ["Cuencos Tibetanos", "Campanas"],
    certified: true,
  },
  {
    id: "martin-paz",
    name: "Martín Paz",
    photo: require("@/assets/images/crystal-bowls.png"),
    bio: "Músico y terapeuta de sonido. Combina el poder del gong con cuencos de cuarzo en retiros de fin de semana y sesiones privadas enfocadas en el descanso profundo.",
    city: "Lima",
    country: "Perú",
    specialty: ["Gong", "Cuencos de Cuarzo"],
    certified: false,
    links: [{ label: "YouTube", url: "https://youtube.com" }],
  },
  {
    id: "daniela-vega",
    name: "Daniela Vega",
    photo: require("@/assets/images/meditation-person.png"),
    bio: "Instructora de yoga y sonoterapia. Integra los baños de sonido con prácticas de yin yoga para una experiencia de relajación total mente-cuerpo.",
    city: "Santiago",
    country: "Chile",
    specialty: ["Cuencos Tibetanos", "Yoga"],
    certified: true,
  },
  {
    id: "andres-morales",
    name: "Andrés Morales",
    photo: require("@/assets/images/crystal-bowls.png"),
    bio: "Experto en frecuencias sagradas y cuencos de metal. Realiza talleres de iniciación y sesiones privadas de sonoterapia en centros de bienestar de Medellín.",
    city: "Medellín",
    country: "Colombia",
    specialty: ["Cuencos de Metal", "Cuencos Tibetanos"],
    certified: true,
  },
];

export function getExpansorById(id?: string): Expansor | undefined {
  if (!id) return undefined;
  return EXPANSORES.find((e) => e.id === id);
}
