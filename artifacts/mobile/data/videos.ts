import type { ImageSourcePropType } from "react-native";

/**
 * Sección de videos pregrabados.
 *
 * Los archivos de video viven en Object Storage (no se bundlean en assets
 * porque pesan demasiado). Se suben vía presigned URL y se sirven desde
 * `GET /api/storage/objects/<path>` (ese endpoint soporta range requests, lo
 * que permite buscar/seekear y hacer streaming progresivo del video).
 *
 * Para agregar un video nuevo:
 *  1. Subir el archivo a Object Storage → guardar el `objectPath` que devuelve
 *     (ej: "/objects/uploads/<uuid>").
 *  2. Copiar el thumbnail a `assets/images/videos/` (o reutilizar un placeholder).
 *  3. Agregar el objeto a `VIDEOS` con el próximo ID disponible.
 *  4. Marcar `isPremium: true` si el video es solo para premium.
 */
export type VideoItem = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  durationLabel: string;
  thumbnail: ImageSourcePropType;
  /** objectPath de Object Storage ("/objects/...") o una URL absoluta. */
  objectPath: string;
  isPremium?: boolean;
  isNew?: boolean;
};

export const VIDEOS: VideoItem[] = [
  {
    id: "1",
    title: "Cuenco en movimiento",
    subtitle: "Visual sonoro",
    description:
      "Un breve visual del cuenco tibetano en movimiento, ideal para acompañar tu práctica de respiración y enfoque.",
    durationLabel: "0:04",
    thumbnail: require("@/assets/images/videos/video-1.jpg"),
    objectPath: "/objects/uploads/032d9237-beea-4d88-8c58-c84ea7b500a6",
  },
  {
    id: "2",
    title: "Prueba de video 2",
    subtitle: "Visual sonoro",
    description:
      "Video de prueba para validar el carrusel de la sección de Videos.",
    durationLabel: "0:22",
    thumbnail: require("@/assets/images/videos/video-2.jpg"),
    objectPath: "/objects/uploads/61890768-8f25-42f2-88a0-b389056b471a",
  },
  {
    id: "3",
    title: "Prueba de video 3",
    subtitle: "Visual sonoro",
    description:
      "Video de prueba para validar el carrusel de la sección de Videos.",
    durationLabel: "0:24",
    thumbnail: require("@/assets/images/videos/video-3.jpg"),
    objectPath: "/objects/uploads/49bb34bb-fbce-4d71-a914-b5ee6d04d8d8",
  },
];

export function getVideoById(id: string): VideoItem | undefined {
  return VIDEOS.find((v) => v.id === id);
}

/**
 * Construye la URI absoluta para reproducir un video.
 * - Si `objectPath` ya es una URL absoluta (http/https), se devuelve tal cual.
 * - Si es un objectPath de storage ("/objects/..."), se mapea a la ruta de
 *   serving del API ("/api/storage/objects/...") usando EXPO_PUBLIC_API_URL.
 */
export function getVideoSourceUri(video: VideoItem): string {
  const path = video.objectPath;
  if (/^https?:\/\//i.test(path)) return path;

  const base = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
  const servingPath = path.startsWith("/objects/")
    ? path.replace(/^\/objects\//, "/api/storage/objects/")
    : path.startsWith("/")
      ? path
      : `/${path}`;
  return `${base}${servingPath}`;
}
