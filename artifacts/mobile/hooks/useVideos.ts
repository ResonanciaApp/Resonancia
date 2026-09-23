import { useListVideos, getListVideosQueryKey } from "@workspace/api-client-react";
import type { CatalogVideo as ApiVideo } from "@workspace/api-client-react";
import type { VideoItem } from "@/data/videos";

const CDN_HOST = process.env.EXPO_PUBLIC_BUNNY_CDN_HOSTNAME || "vz-881ead65-839.b-cdn.net";
const API_BASE = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

/** Convierte un objectPath de storage en URL absoluta cargable por <Image>. */
function resolveStorageUrl(objectPath: string): string {
  const servingPath = objectPath.startsWith("/objects/")
    ? objectPath.replace(/^\/objects\//, "/api/storage/objects/")
    : objectPath.startsWith("/")
      ? objectPath
      : `/${objectPath}`;
  return `${API_BASE}${servingPath}`;
}

/**
 * Convierte un video de la API al tipo VideoItem que usa la app.
 * - HLS: `https://<CDN_HOST>/<bunnyVideoId>/playlist.m3u8`
 * - Thumbnail: objectPath de Object Storage (URL absoluta) o thumbnail de Bunny CDN
 */
export function apiVideoToItem(v: ApiVideo): VideoItem {
  const thumbnail = v.thumbnailObjectPath
    ? { uri: resolveStorageUrl(v.thumbnailObjectPath) }
    : CDN_HOST
      ? { uri: `https://${CDN_HOST}/${v.bunnyVideoId}/thumbnail.jpg?v=2` }
      : require("@/assets/images/videos/video-1.jpg");

  return {
    id: String(v.id),
    title: v.title,
    subtitle: v.subtitle,
    description: v.description,
    durationLabel: v.durationLabel,
    bunnyVideoId: v.bunnyVideoId,
    thumbnail,
    isPremium: v.isPremium,
    isNew: v.isNew,
    sortOrder: v.sortOrder,
    author: v.author,
    guideId: (v as ApiVideo & { guideId?: string }).guideId,
    theme: v.theme as VideoItem["theme"],
  };
}

/**
 * Hook que devuelve la lista de videos:
 * La API es la fuente editorial: una respuesta vacía o un error no debe
 * resucitar videos locales de prueba ni sus etiquetas.
 */
export function useVideos(): {
  videos: VideoItem[];
  isLoading: boolean;
  isError: boolean;
} {
  const { data, isLoading, isError } = useListVideos({
    query: { queryKey: getListVideosQueryKey(), retry: 1, staleTime: 5 * 60 * 1000 },
  });

  const apiVideos = data?.videos;

  if (apiVideos) {
    return {
      videos: apiVideos.map(apiVideoToItem),
      isLoading: false,
      isError: false,
    };
  }

  return {
    videos: [],
    isLoading,
    isError,
  };
}

/**
 * Busca un video por ID (string) en la lista de la API o en los estáticos.
 * Se usa desde video/[id].tsx.
 */
export function useVideoById(id: string | undefined): {
  video: VideoItem | undefined;
  isLoading: boolean;
} {
  const { videos, isLoading } = useVideos();
  return {
    video: id ? videos.find((v) => v.id === id) : undefined,
    isLoading,
  };
}

/**
 * Construye la URI de reproducción para un video.
 * Prioridad: Bunny HLS → Object Storage legacy
 */
export function getVideoSourceUri(video: VideoItem): string {
  if (video.bunnyVideoId && CDN_HOST) {
    return `https://${CDN_HOST}/${video.bunnyVideoId}/playlist.m3u8`;
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
