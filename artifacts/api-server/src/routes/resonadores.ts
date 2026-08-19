import { Router, type IRouter } from "express";
import { asc, eq } from "drizzle-orm";
import {
  db,
  resonadoresTable,
  insertResonadorSchema,
  updateResonadorSchema,
  type ResonadorRow,
} from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";

const router: IRouter = Router();

function serialize(r: ResonadorRow) {
  return {
    id: r.id,
    clerkId: r.clerkId,
    name: r.name,
    photoUrl: r.photoUrl,
    coverPhotoUrl: r.coverPhotoUrl,
    subtipo: r.subtipo,
    bio: r.bio,
    city: r.city,
    country: r.country,
    specialty: r.specialty,
    genres: r.genres,
    memberSince: r.memberSince,
    followersCount: r.followersCount,
    followingCount: r.followingCount,
    certified: r.certified,
    servicesDescription: r.servicesDescription,
    bookingUrl: r.bookingUrl,
    bookingTagline: r.bookingTagline,
    bookingPrice: r.bookingPrice,
    bookingModality: r.bookingModality,
    phone: r.phone,
    email: r.email,
    instagram: r.instagram,
    linktree: r.linktree,
    donationUrl: r.donationUrl,
    sessionIds: r.sessionIds,
    projects: r.projects,
    formacion: r.formacion,
    quote: r.quote,
    photos: r.photos,
    status: r.status,
    sortOrder: r.sortOrder,
  };
}

// ── Endpoints públicos ────────────────────────────────────────────────────────

// GET /resonadores — catálogo publicado
router.get("/resonadores", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(resonadoresTable)
      .where(eq(resonadoresTable.status, "published"))
      .orderBy(asc(resonadoresTable.sortOrder), asc(resonadoresTable.name));
    res.json({ resonadores: rows.map(serialize) });
  } catch (err) {
    req.log.error({ err }, "error listing resonadores");
    res.status(500).json({ error: "Error al obtener resonadores" });
  }
});

// GET /resonadores/:id
router.get("/resonadores/:id", async (req, res) => {
  const id = String(req.params.id);
  try {
    const [row] = await db
      .select()
      .from(resonadoresTable)
      .where(eq(resonadoresTable.id, id))
      .limit(1);
    if (!row || row.status !== "published") {
      res.status(404).json({ error: "Resonador no encontrado" });
      return;
    }
    res.json(serialize(row));
  } catch (err) {
    req.log.error({ err }, "error fetching resonador");
    res.status(500).json({ error: "Error al obtener el resonador" });
  }
});

// ── Admin CRUD ────────────────────────────────────────────────────────────────

// GET /admin/resonadores
router.get("/admin/resonadores", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(resonadoresTable)
      .orderBy(asc(resonadoresTable.sortOrder), asc(resonadoresTable.name));
    res.json({ resonadores: rows.map(serialize) });
  } catch (err) {
    req.log.error({ err }, "error listing resonadores (admin)");
    res.status(500).json({ error: "Error al obtener resonadores" });
  }
});

// POST /admin/resonadores
router.post("/admin/resonadores", requireAuth, requireRole("admin"), async (req, res) => {
  const parsed = insertResonadorSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos", details: parsed.error.issues });
    return;
  }
  try {
    const [existing] = await db
      .select({ id: resonadoresTable.id })
      .from(resonadoresTable)
      .where(eq(resonadoresTable.id, parsed.data.id))
      .limit(1);
    if (existing) {
      res.status(409).json({ error: "Ya existe un resonador con ese ID" });
      return;
    }
    const [created] = await db.insert(resonadoresTable).values(parsed.data).returning();
    req.log.info({ id: created.id }, "resonador created");
    res.status(201).json(serialize(created));
  } catch (err) {
    req.log.error({ err }, "error creating resonador");
    res.status(500).json({ error: "Error al crear el resonador" });
  }
});

// PATCH /admin/resonadores/:id
router.patch("/admin/resonadores/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const id = String(req.params.id);
  const parsed = updateResonadorSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos", details: parsed.error.issues });
    return;
  }
  if (Object.keys(parsed.data).length === 0) {
    res.status(400).json({ error: "No hay campos para actualizar" });
    return;
  }
  try {
    const [updated] = await db
      .update(resonadoresTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(resonadoresTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Resonador no encontrado" });
      return;
    }
    req.log.info({ id }, "resonador updated");
    res.json(serialize(updated));
  } catch (err) {
    req.log.error({ err }, "error updating resonador");
    res.status(500).json({ error: "Error al actualizar el resonador" });
  }
});

// DELETE /admin/resonadores/:id
router.delete("/admin/resonadores/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const id = String(req.params.id);
  try {
    const [deleted] = await db
      .delete(resonadoresTable)
      .where(eq(resonadoresTable.id, id))
      .returning({ id: resonadoresTable.id });
    if (!deleted) {
      res.status(404).json({ error: "Resonador no encontrado" });
      return;
    }
    req.log.info({ id }, "resonador deleted");
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "error deleting resonador");
    res.status(500).json({ error: "Error al eliminar el resonador" });
  }
});

// POST /admin/resonadores/seed — inserta los 10 resonadores iniciales si la tabla está vacía
router.post("/admin/resonadores/seed", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const [{ count }] = await db
      .select({ count: db.$count(resonadoresTable) })
      .from(resonadoresTable);
    if (Number(count) > 0) {
      res.status(409).json({ error: "La tabla ya tiene datos. Seed abortado.", count: Number(count) });
      return;
    }
    const seed = getSeedData();
    const inserted = await db.insert(resonadoresTable).values(seed).returning({ id: resonadoresTable.id });
    req.log.info({ count: inserted.length }, "resonadores seeded");
    res.status(201).json({ seeded: inserted.length, ids: inserted.map((r) => r.id) });
  } catch (err) {
    req.log.error({ err }, "error seeding resonadores");
    res.status(500).json({ error: "Error al hacer seed de resonadores" });
  }
});

function getSeedData() {
  return [
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
      servicesDescription: "Guío meditaciones personalizadas para individuos y empresas. También ofrezco retiros de silencio y talleres de mindfulness aplicado al estrés y la ansiedad.",
      bookingUrl: "https://calendly.com/kaiamara",
      bookingTagline: "Meditación personalizada individual y grupal · 50 min",
      bookingPrice: "USD 35",
      bookingModality: "ambas",
      phone: "+52 55 1234-5678",
      email: "kai@kaiamara.com",
      instagram: "https://instagram.com/kaiamara",
      linktree: "https://linktr.ee/kaiamara",
      donationUrl: "https://ko-fi.com/kaiamara",
      sessionIds: ["20", "21", "22", "24", "25"],
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
      sortOrder: 1,
    },
    {
      id: "lumen-sonora",
      name: "Lumen Sonora",
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
      sortOrder: 2,
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
      followingCount: 309,
      servicesDescription: "Realizo conciertos de cuencos y gongs en formato individual, grupal y ceremonial. Cada sesión es diseñada según la intención del grupo, desde la relajación profunda hasta la activación energética.",
      bookingUrl: "https://calendly.com/arbolsagrado",
      bookingTagline: "Conciertos de cuencos individuales y grupales · 75 min",
      bookingPrice: "USD 60",
      bookingModality: "presencial",
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
      followersCount: 1290,
      followingCount: 178,
      servicesDescription: "Ofrezco sesiones de baño de sonido con cuencos de cuarzo cristalino, individuales y grupales. Especializada en limpiezas energéticas y activación de chakras.",
      instagram: "https://instagram.com/florquartz",
      quote: "El cristal canta lo que el alma necesita escuchar.",
      sortOrder: 4,
    },
    {
      id: "misterio-verde",
      name: "Misterio Verde",
      subtipo: "Productor",
      bio: "Productor de music ambient enteógena inspirada en la selva amazónica. Sus composiciones crean puentes entre el mundo humano y la inteligencia de la naturaleza.",
      city: "Bogotá",
      country: "Colombia",
      certified: false,
      specialty: ["Música enteógena", "Ambient orgánico", "Soundscapes naturales"],
      genres: ["Ambient", "Música Enteógena", "World Music", "Electrónica Orgánica"],
      memberSince: "2024",
      followersCount: 874,
      followingCount: 203,
      servicesDescription: "Composición de música personalizada para ceremonias, retiros y experiencias inmersivas en la naturaleza. También disponible para colaboraciones con facilitadores y chamanes.",
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
      followersCount: 1560,
      followingCount: 290,
      servicesDescription: "Conciertos y ceremonias de música andina para grupos, retiros espirituales y eventos culturales. Cada interpretación honra la tradición de los pueblos originarios de los Andes.",
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
      followersCount: 2340,
      followingCount: 145,
      servicesDescription: "Sesiones de meditación guiada individual y grupal. Especializado en yoga nidra, meditación vipassana adaptada y retiros de silencio.",
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
      followersCount: 980,
      followingCount: 167,
      servicesDescription: "Ceremonias de tambor chamánico para grupos e individuos. Talleres de percusión ritual y viajes de tambor para reconexión con la naturaleza y los ciclos de la vida.",
      instagram: "https://instagram.com/pulsodetierra",
      quote: "El tambor es el corazón de la Tierra, latiendo para quien quiera escuchar.",
      sortOrder: 8,
    },
  ];
}

export default router;
