import type { ImageSourcePropType } from "react-native";

/** Temas reales de video (deben coincidir con CATALOG_VIDEO_THEMES en @workspace/db). */
export const VIDEO_THEMES = ["Movimiento", "Respiración", "Naturaleza", "Música"] as const;
export type VideoTheme = (typeof VIDEO_THEMES)[number];

/**
 * Sección de videos pregrabados.
 *
 * ## Sistema de reproducción
 *
 * ### Bunny.net Stream (recomendado, producción)
 * Cada video tiene un `bunnyVideoId` (el GUID que asigna Bunny al subirlo).
 * Bunny sirve HLS adaptativo (`playlist.m3u8`) desde su CDN global → carga
 * rápida en Latam/España y costo ~10-20× menor que Object Storage genérico.
 *
 * Variables de entorno requeridas (Replit Secrets):
 *   EXPO_PUBLIC_BUNNY_CDN_HOSTNAME  — ej: "vz-xxxxxxxx.b-cdn.net"
 *
 * Para agregar un video nuevo con Bunny:
 *   1. Subir el archivo en el panel de Bunny Stream → copiar el GUID.
 *   2. Copiar el thumbnail a `assets/images/videos/`.
 *   3. Agregar el objeto a `VIDEOS` con `bunnyVideoId: "<guid>"`.
 *   4. Marcar `isPremium: true` si aplica.
 *
 * ### Object Storage (legado / fallback)
 * Videos viejos usan `objectPath` y se sirven desde
 * `GET /api/storage/objects/<path>` (soporta range → seek/streaming).
 * Seguirán funcionando mientras no se migre el archivo a Bunny.
 *
 * Para agregar un video nuevo con Object Storage (legacy):
 *   1. Subir vía presigned URL → guardar el `objectPath`.
 *   2. Copiar thumbnail.
 *   3. Agregar con `objectPath: "/objects/uploads/<uuid>"`.
 */
export type VideoItem = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  durationLabel: string;
  thumbnail: ImageSourcePropType;
  /**
   * GUID del video en Bunny.net Stream (ej: "abc123-...").
   * Si está presente y EXPO_PUBLIC_BUNNY_CDN_HOSTNAME está configurado,
   * tiene prioridad sobre `objectPath`.
   */
  bunnyVideoId?: string;
  /**
   * objectPath de Object Storage ("/objects/...") o URL absoluta.
   * Modo legado: se usa cuando `bunnyVideoId` no está o el CDN no está
   * configurado. Al menos uno de bunnyVideoId/objectPath debe estar presente.
   */
  objectPath?: string;
  isPremium?: boolean;
  isNew?: boolean;
  /** Nombre del usuario o cuenta que subió el video. */
  author?: string;
  /** Puntuación promedio (0-5). Si no está presente, la UI muestra un valor placeholder. */
  rating?: number;
  /** Tema real del video (uno de VIDEO_THEMES). Null/undefined = sin tema asignado, no aparece en ningún chip. */
  theme?: VideoTheme | null;
  /** ID del guiador (data/guides.ts) que presenta el video. Sin guideId → sin acciones "Seguir/Ver perfil". */
  guideId?: string;
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
    author: "Casa del Cuenco",
    theme: "Movimiento",
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
    author: "Casa del Cuenco",
    theme: "Respiración",
    guideId: "sofia-ramirez",
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
    author: "Casa del Cuenco",
    theme: "Naturaleza",
    guideId: "mateo-luz",
  },
];

export function getVideoById(id: string): VideoItem | undefined {
  return VIDEOS.find((v) => v.id === id);
}

/**
 * Construye la URI de reproducción para un video.
 *
 * Prioridad:
 * 1. Bunny.net HLS — si `bunnyVideoId` + `EXPO_PUBLIC_BUNNY_CDN_HOSTNAME` configurados.
 *    Formato: `https://<cdn-host>/<guid>/playlist.m3u8`
 *    expo-video reproduce HLS nativo (AVPlayer en iOS, ExoPlayer en Android).
 * 2. Object Storage legacy — `objectPath` mapeado a la ruta del API con range requests.
 */
export function getVideoSourceUri(video: VideoItem): string {
  const cdnHost = process.env.EXPO_PUBLIC_BUNNY_CDN_HOSTNAME;
  if (video.bunnyVideoId && cdnHost) {
    return `https://${cdnHost}/${video.bunnyVideoId}/playlist.m3u8`;
  }

  const path = video.objectPath ?? "";
  if (/^https?:\/\//i.test(path)) return path;

  const base = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
  const servingPath = path.startsWith("/objects/")
    ? path.replace(/^\/objects\//, "/api/storage/objects/")
    : path.startsWith("/")
      ? path
      : `/${path}`;
  return `${base}${servingPath}`;
}
