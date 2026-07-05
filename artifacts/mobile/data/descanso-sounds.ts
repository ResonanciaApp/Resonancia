import type { ImageSourcePropType } from "react-native";

export type DescansoSoundCategory = "binaural" | "ambiental";

export interface DescansoSound {
  id: string;
  label: string;
  categoryId: DescansoSoundCategory;
  image: ImageSourcePropType;
  audioUri: string | null;
}

/**
 * Convierte un objectPath del servidor ("/objects/...") a URL de serving
 * absoluta, igual que resolveObjectUrl en lib/remoteSoundMap.ts.
 */
function resolveTestAudioUrl(objectPath: string): string {
  const base = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
  const servingPath = objectPath.replace(/^\/objects\//, "/api/storage/objects/");
  return `${base}${servingPath}`;
}

/**
 * NOTA: audios de PRUEBA (10 min, generados sintéticamente — tonos binaurales
 * y ruido filtrado) para validar la interacción de tap+loop+timer. Reemplazar
 * por audios reales antes de producción.
 */
const TEST_AUDIO_OBJECT_PATHS: Record<string, string> = {
  "ds-1": "/objects/uploads/0eb917a4-73c1-42c7-be21-cae7bfa5ea77.m4a",
  "ds-2": "/objects/uploads/0329b968-d259-49e3-9cbb-cb3cf0384db4.m4a",
  "ds-3": "/objects/uploads/53050647-e373-4857-ae3d-65ff52db62fa.m4a",
  "ds-4": "/objects/uploads/8abac15c-3df6-4372-a80d-3a6e32b3304b.m4a",
  "ds-5": "/objects/uploads/b9dcf035-bee8-4fc3-9400-35acaae3df18.m4a",
  "ds-6": "/objects/uploads/c5c79f3e-ac2e-4487-b64f-c130de2b386b.m4a",
  "ds-7": "/objects/uploads/07f7a2fe-3b8b-43d2-a774-2c9b2b2533b1.m4a",
  "ds-8": "/objects/uploads/97950be7-19e3-41c4-9241-f8f1c967f1ab.m4a",
  "ds-9": "/objects/uploads/a673732b-11c6-4561-bedf-ae59a8d9c1e8.m4a",
  "ds-10": "/objects/uploads/03ea8682-0218-4452-bb99-3625c3999e69.m4a",
  "ds-11": "/objects/uploads/7d14a174-2ee1-4a7e-9b71-9c38b59064b2.m4a",
  "ds-12": "/objects/uploads/90c87c1f-a66d-4b4c-8aff-c9f37244c9a6.m4a",
  "ds-13": "/objects/uploads/913a39ad-5b01-43ac-a33e-a6295c770a4d.m4a",
  "ds-14": "/objects/uploads/03d13c1c-a175-45f4-afdb-92f4dc9d2395.m4a",
  "ds-15": "/objects/uploads/955de046-8d5e-4008-b3d6-5fdc3564bccf.m4a",
  "ds-16": "/objects/uploads/3a0a08d8-0858-4b34-bbfb-fd74dea48a5e.m4a",
  "ds-17": "/objects/uploads/22eca25b-d994-46b2-ad98-6bb11da2da6f.m4a",
  "ds-18": "/objects/uploads/9e02a89b-2d8b-4726-8db1-d85bdce55a14.m4a",
  "ds-19": "/objects/uploads/7e609db3-1acd-4db9-8ed9-40d328fb8ffe.m4a",
  "ds-20": "/objects/uploads/ca387c15-4f26-4d0b-8971-52bffdf37387.m4a",
  "ds-21": "/objects/uploads/ec029843-3279-49ec-939d-ffb3d4a72672.m4a",
  "ds-22": "/objects/uploads/9304bac2-a377-4618-a966-ac75631a610b.m4a",
  "ds-23": "/objects/uploads/76bf06a8-2d66-45b5-82b8-6215ba4cdb24.m4a",
  "ds-24": "/objects/uploads/7647e752-733f-447a-baf6-367dadc6817c.m4a",
};

function testAudio(id: string): string {
  return resolveTestAudioUrl(TEST_AUDIO_OBJECT_PATHS[id]);
}

export const DESCANSO_SOUNDS: DescansoSound[] = [
  /* ── Sonidos Binaurales ── */
  {
    id: "ds-1",
    label: "Onda Delta 2Hz",
    categoryId: "binaural",
    image: require("../assets/images/descanso-sounds/sound-1.png"),
    audioUri: testAudio("ds-1"),
  },
  {
    id: "ds-2",
    label: "Onda Theta 6Hz",
    categoryId: "binaural",
    image: require("../assets/images/descanso-sounds/sound-2.png"),
    audioUri: testAudio("ds-2"),
  },
  {
    id: "ds-3",
    label: "Onda Alfa 10Hz",
    categoryId: "binaural",
    image: require("../assets/images/descanso-sounds/sound-3.png"),
    audioUri: testAudio("ds-3"),
  },
  {
    id: "ds-4",
    label: "Sueño profundo 3Hz",
    categoryId: "binaural",
    image: require("../assets/images/descanso-sounds/sound-4.png"),
    audioUri: testAudio("ds-4"),
  },
  {
    id: "ds-5",
    label: "Relajación 8Hz",
    categoryId: "binaural",
    image: require("../assets/images/descanso-sounds/sound-5.png"),
    audioUri: testAudio("ds-5"),
  },
  {
    id: "ds-6",
    label: "Calma mental 5Hz",
    categoryId: "binaural",
    image: require("../assets/images/descanso-sounds/sound-6.png"),
    audioUri: testAudio("ds-6"),
  },
  {
    id: "ds-7",
    label: "Descanso total 1Hz",
    categoryId: "binaural",
    image: require("../assets/images/descanso-sounds/sound-7.png"),
    audioUri: testAudio("ds-7"),
  },
  {
    id: "ds-8",
    label: "Foco sereno 12Hz",
    categoryId: "binaural",
    image: require("../assets/images/descanso-sounds/sound-8.png"),
    audioUri: testAudio("ds-8"),
  },
  {
    id: "ds-9",
    label: "Equilibrio 7Hz",
    categoryId: "binaural",
    image: require("../assets/images/descanso-sounds/sound-9.png"),
    audioUri: testAudio("ds-9"),
  },
  {
    id: "ds-10",
    label: "Transición al sueño 4Hz",
    categoryId: "binaural",
    image: require("../assets/images/descanso-sounds/sound-10.png"),
    audioUri: testAudio("ds-10"),
  },
  {
    id: "ds-11",
    label: "Silencio interior 2.5Hz",
    categoryId: "binaural",
    image: require("../assets/images/descanso-sounds/sound-11.png"),
    audioUri: testAudio("ds-11"),
  },
  {
    id: "ds-12",
    label: "Vibración nocturna 9Hz",
    categoryId: "binaural",
    image: require("../assets/images/descanso-sounds/sound-12.png"),
    audioUri: testAudio("ds-12"),
  },

  /* ── Ambientales ── */
  {
    id: "ds-13",
    label: "Lluvia suave",
    categoryId: "ambiental",
    image: require("../assets/images/descanso-sounds/sound-13.png"),
    audioUri: testAudio("ds-13"),
  },
  {
    id: "ds-14",
    label: "Océano nocturno",
    categoryId: "ambiental",
    image: require("../assets/images/descanso-sounds/sound-14.png"),
    audioUri: testAudio("ds-14"),
  },
  {
    id: "ds-15",
    label: "Bosque al amanecer",
    categoryId: "ambiental",
    image: require("../assets/images/descanso-sounds/sound-15.png"),
    audioUri: testAudio("ds-15"),
  },
  {
    id: "ds-16",
    label: "Río en piedras",
    categoryId: "ambiental",
    image: require("../assets/images/descanso-sounds/sound-16.png"),
    audioUri: testAudio("ds-16"),
  },
  {
    id: "ds-17",
    label: "Cascada suave",
    categoryId: "ambiental",
    image: require("../assets/images/descanso-sounds/sound-17.png"),
    audioUri: testAudio("ds-17"),
  },
  {
    id: "ds-18",
    label: "Grillos nocturnos",
    categoryId: "ambiental",
    image: require("../assets/images/descanso-sounds/sound-18.png"),
    audioUri: testAudio("ds-18"),
  },
  {
    id: "ds-19",
    label: "Chimenea",
    categoryId: "ambiental",
    image: require("../assets/images/descanso-sounds/sound-19.png"),
    audioUri: testAudio("ds-19"),
  },
  {
    id: "ds-20",
    label: "Tormenta lejana",
    categoryId: "ambiental",
    image: require("../assets/images/descanso-sounds/sound-20.png"),
    audioUri: testAudio("ds-20"),
  },
  {
    id: "ds-21",
    label: "Viento entre hojas",
    categoryId: "ambiental",
    image: require("../assets/images/descanso-sounds/sound-21.png"),
    audioUri: testAudio("ds-21"),
  },
  {
    id: "ds-22",
    label: "Ciudad lejana",
    categoryId: "ambiental",
    image: require("../assets/images/descanso-sounds/sound-22.png"),
    audioUri: testAudio("ds-22"),
  },
  {
    id: "ds-23",
    label: "Pájaros tropicales",
    categoryId: "ambiental",
    image: require("../assets/images/descanso-sounds/sound-23.png"),
    audioUri: testAudio("ds-23"),
  },
  {
    id: "ds-24",
    label: "Tren nocturno",
    categoryId: "ambiental",
    image: require("../assets/images/descanso-sounds/sound-24.png"),
    audioUri: testAudio("ds-24"),
  },
];
