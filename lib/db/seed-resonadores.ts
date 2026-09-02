/**
 * Seed inicial de resonadores.
 * Uso: pnpm --filter @workspace/db tsx seed-resonadores.ts
 * Solo inserta si la tabla está vacía.
 */
import { db, resonadoresTable } from "./src";
import { sql } from "drizzle-orm";

const SEED = [
  {
    id: "luna-cosmica",
    clerkId: "user_3FNf8BwxG6rkcBWPpgFrxBzp88q",
    name: "Nicolás Blanch",
    subtipo: "Sonoterapeuta",
    bio: "Terapeuta del sonido especializado en cuencos tibetanos y frecuencias binaurales. Creo espacios de sanación donde el sonido se convierte en medicina.",
    city: "Santiago de Chile",
    country: "Chile",
    certified: true,
    specialty: ["Cuencos tibetanos", "Frecuencias binaurales", "Sanación sonora"],
    genres: ["Cuencos tibetanos", "Frecuencias binaurales", "Sonidos ancestrales", "ASMR", "Meditación profunda"],
    memberSince: "2023",
    followersCount: 1842,
    followingCount: 234,
    servicesDescription: "Ofrezco sesiones individuales y grupales de sonoterapia. Cada experiencia es diseñada para liberar bloqueos emocionales y restaurar el equilibrio energético a través de frecuencias específicas.",
    bookingUrl: "https://calendly.com/lunacosmica",
    bookingTagline: "Sesiones individuales de sonoterapia · 60 min",
    bookingPrice: "USD 45",
    bookingModality: "online",
    phone: "+54 11 4567-8901",
    email: "hola@lunacosmica.com",
    instagram: "https://instagram.com/lunacosmica",
    donationUrl: "https://cafecito.app/lunacosmica",
    sessionIds: ["1", "5", "7", "8", "9"],
    projects: [
      { platform: "spotify", label: "Nicolás Blanch en Spotify", url: "https://spotify.com" },
      { platform: "youtube", label: "Canal de YouTube", url: "https://youtube.com" },
    ],
    formacion: [
      { institucion: "Instituto de Sonología de Buenos Aires", titulo: "Diplomado en Sonoterapia", years: "2019 — 2021" },
      { institucion: "Sacred Sound Academy", titulo: "Cuencos Tibetanos Nivel III", years: "2022" },
    ],
    quote: "El sonido no entra por los oídos — entra por el alma.",
    sortOrder: 0,
  },
  {
    id: "kai-amara",
    name: "Kai Amara",
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
    bookingUrl: "https://calendly.com/kaiamara",
    bookingTagline: "Meditación personalizada individual y grupal · 50 min",
    bookingPrice: "USD 35",
    bookingModality: "ambas",
    instagram: "https://instagram.com/kaiamara",
    linktree: "https://linktr.ee/kaiamara",
    donationUrl: "https://ko-fi.com/kaiamara",
    sessionIds: ["24", "25"],
    projects: [
      { platform: "youtube", label: "Meditaciones en YouTube", url: "https://youtube.com" },
    ],
    formacion: [
      { institucion: "Mindfulness Institute México", titulo: "Instructor de Meditación Certificado", years: "2016 — 2018" },
    ],
    quote: "La meditación no es escapar de la vida, es vivirla con presencia total.",
    sortOrder: 1,
  },
  {
    id: "arbol-sagrado",
    name: "Árbol Sagrado",
    subtipo: "Músico",
    bio: "Intérprete de cuencos tibetanos y gongs planetarios. Cada concierto de cuencos es una ceremonia de sonido que conecta con lo más profundo del ser.",
    city: "Lima",
    country: "Perú",
    certified: true,
    specialty: ["Cuencos tibetanos", "Gongs planetarios", "Conciertos de sonido"],
    genres: ["Cuencos tibetanos", "Gongs", "Sonidos Ancestrales", "Música Ceremonial", "World Music"],
    memberSince: "2023",
    followersCount: 2180,
    bookingUrl: "https://calendly.com/arbolsagrado",
    bookingTagline: "Conciertos de cuencos individuales y grupales · 75 min",
    bookingPrice: "USD 60",
    bookingModality: "presencial",
    instagram: "https://instagram.com/arbolsagrado",
    sessionIds: ["32", "33", "34", "36"],
    quote: "Los cuencos recuerdan al cuerpo lo que la mente olvida.",
    sortOrder: 3,
  },
  {
    id: "flor-de-quartz",
    name: "Flor de Quartz",
    subtipo: "Sonoterapeuta",
    bio: "Facilitadora de baños de sonido con cuencos de cuarzo cristalino. Trabajo con frecuencias de alta vibración para armonizar cuerpo, mente y espíritu.",
    city: "Santiago",
    country: "Chile",
    certified: true,
    specialty: ["Cuencos de cuarzo", "Baños de sonido", "Geometría sagrada"],
    genres: ["Cuencos de cristal", "Frecuencias curativas", "Sanación sonora"],
    memberSince: "2023",
    instagram: "https://instagram.com/florquartz",
    quote: "El cristal canta lo que el alma necesita escuchar.",
    sortOrder: 4,
  },
  {
    id: "misterio-verde",
    name: "Misterio Verde",
    subtipo: "Productor",
    bio: "Productor de música ambient enteógena inspirada en la selva amazónica. Sus composiciones crean puentes entre el mundo humano y la inteligencia de la naturaleza.",
    city: "Bogotá",
    country: "Colombia",
    certified: false,
    specialty: ["Música enteógena", "Ambient orgánico", "Soundscapes naturales"],
    genres: ["Ambient", "Música Enteógena", "World Music", "Electrónica Orgánica"],
    memberSince: "2024",
    instagram: "https://instagram.com/misterioverdemusic",
    quote: "La selva ya compuso todo — yo solo la transcribo.",
    sortOrder: 5,
  },
  {
    id: "vuelo-del-condor",
    name: "Vuelo del Cóndor",
    subtipo: "Músico",
    bio: "Intérprete de instrumentos andinos ancestrales: quena, sikus, charango y zampoña. Lleva la memoria viva de los Andes a través del sonido ceremonial.",
    city: "Cusco",
    country: "Perú",
    certified: true,
    specialty: ["Instrumentos andinos", "Música ceremonial", "Tradición oral"],
    genres: ["Sonidos Ancestrales", "World Music", "Música Ceremonial", "Folk Andino"],
    memberSince: "2023",
    instagram: "https://instagram.com/vuelodecondor",
    quote: "El cóndor vuela alto porque primero escuchó la tierra.",
    sortOrder: 6,
  },
  {
    id: "raiz-profunda",
    name: "Raíz Profunda",
    subtipo: "Voz guía",
    bio: "Guía de meditación con formación en tradiciones budista y vedántica. Su voz conduce hacia estados de conciencia expandida con una presencia calmada y profunda.",
    city: "Montevideo",
    country: "Uruguay",
    certified: true,
    specialty: ["Meditación budista", "Vedanta", "Meditación de conciencia plena"],
    genres: ["Meditación guiada", "Mindfulness", "Breathwork", "Yoga Nidra"],
    memberSince: "2022",
    instagram: "https://instagram.com/raizprofundamed",
    quote: "Cuanto más profundas las raíces, más alto puede crecer el árbol.",
    sortOrder: 7,
  },
  {
    id: "pulso-de-tierra",
    name: "Pulso de Tierra",
    subtipo: "Músico",
    bio: "Percusionista ritual y maestro de tambores chamánicos. Sus ritmos evocan el latido primigenio de la Tierra y abren puertas hacia estados alterados de conciencia.",
    city: "Oaxaca",
    country: "México",
    certified: false,
    specialty: ["Tambores chamánicos", "Percusión ritual", "Ritmos curativos"],
    genres: ["Sonidos Ancestrales", "Música Ceremonial", "World Music", "Percusión ritual"],
    memberSince: "2024",
    instagram: "https://instagram.com/pulsodetierra",
    quote: "El tambor es el corazón de la Tierra, latiendo para quien quiera escuchar.",
    sortOrder: 8,
  },
] as const;

async function main() {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(resonadoresTable);

  if (Number(count) > 0) {
    console.log(`Tabla ya tiene ${count} resonadores — seed abortado.`);
    process.exit(0);
  }

  const inserted = await db
    .insert(resonadoresTable)
    // @ts-expect-error — jsonb columns need explicit typing relaxation
    .values(SEED)
    .returning({ id: resonadoresTable.id });

  console.log(`✓ Insertados ${inserted.length} resonadores:`, inserted.map((r) => r.id));
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
