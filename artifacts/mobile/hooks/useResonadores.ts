/**
 * useResonadores — fuente de datos de resonadores.
 *
 * Prioridad:
 *   1. GET /resonadores (API/BD) si devuelve datos
 *   2. Fallback a RESONADORES estático (data/resonadores.ts)
 *
 * Para las fotos: la foto de la BD tiene prioridad. Si no hay foto en la BD,
 * usa la imagen bundleada como fallback. Si tampoco hay bundle, usa la imagen
 * por defecto del primer resonador.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth as useClerkAuth } from "@clerk/expo";
import {
  RESONADORES,
  type Resonador,
  type ExternalProject,
  type FormacionItem,
} from "@/data/resonadores";

const API_BASE = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

// ── Tipo de la respuesta de la API ────────────────────────────────────────────
interface ApiResonador {
  id: string;
  clerkId: string | null;
  name: string;
  photoUrl: string | null;
  coverPhotoUrl: string | null;
  subtipo: string;
  bio: string;
  city: string;
  country: string;
  specialty: string[];
  genres: string[];
  memberSince: string | null;
  followersCount: number | null;
  followingCount: number | null;
  certified: boolean;
  servicesDescription: string | null;
  bookingUrl: string | null;
  bookingTagline: string | null;
  bookingPrice: string | null;
  bookingModality: string | null;
  phone: string | null;
  email: string | null;
  instagram: string | null;
  linktree: string | null;
  donationUrl: string | null;
  sessionIds: string[];
  projects: ExternalProject[];
  formacion: FormacionItem[];
  quote: string | null;
  photos: string[];
}

export function resolveResonadorUrl(path: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const servingPath = path.startsWith("/objects/")
    ? path.replace(/^\/objects\//, "/api/storage/objects/")
    : path.startsWith("/")
      ? path
      : `/${path}`;
  return `${API_BASE}${servingPath}`;
}

// Índice de fotos bundleadas para lookup O(1)
const STATIC_MAP = new Map<string, Resonador>(RESONADORES.map((r) => [r.id, r]));

function apiToResonador(r: ApiResonador): Resonador {
  const staticEntry = STATIC_MAP.get(r.id);
  const photoUrl = resolveResonadorUrl(r.photoUrl);
  const coverUrl = resolveResonadorUrl(r.coverPhotoUrl);

  return {
    id: r.id,
    clerkId: r.clerkId ?? undefined,
    name: r.name,
    // DB photo takes priority; bundled asset is fallback; last resort = default
    photo:
      (photoUrl ? { uri: photoUrl } : null) ??
      staticEntry?.photo ??
      RESONADORES[0].photo,
    coverPhoto:
      (coverUrl ? { uri: coverUrl } : null) ??
      staticEntry?.coverPhoto ??
      undefined,
    subtipo: r.subtipo as Resonador["subtipo"],
    bio: r.bio,
    city: r.city,
    country: r.country,
    specialty: r.specialty,
    genres: r.genres,
    memberSince: r.memberSince ?? undefined,
    followersCount: r.followersCount ?? undefined,
    followingCount: r.followingCount ?? undefined,
    certified: r.certified,
    servicesDescription: r.servicesDescription ?? undefined,
    bookingUrl: r.bookingUrl ?? undefined,
    bookingTagline: r.bookingTagline ?? undefined,
    bookingPrice: r.bookingPrice ?? undefined,
    bookingModality: r.bookingModality as Resonador["bookingModality"],
    phone: r.phone ?? undefined,
    email: r.email ?? undefined,
    instagram: r.instagram ?? undefined,
    linktree: r.linktree ?? undefined,
    donationUrl: r.donationUrl ?? undefined,
    sessionIds: r.sessionIds,
    projects: r.projects,
    formacion: r.formacion,
    quote: r.quote ?? undefined,
    photos: r.photos,
  };
}

async function fetchResonadores(): Promise<Resonador[]> {
  const res = await fetch(`${API_BASE}/api/resonadores`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { resonadores: ApiResonador[] };
  return data.resonadores.map(apiToResonador);
}

async function fetchMyResonadorProfile(token: string): Promise<ApiResonador> {
  const res = await fetch(`${API_BASE}/api/me/resonador-profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw Object.assign(new Error(err.error ?? `HTTP ${res.status}`), { status: res.status });
  }
  return res.json() as Promise<ApiResonador>;
}

// ── Hook principal ────────────────────────────────────────────────────────────

export function useResonadores(): {
  resonadores: Resonador[];
  isLoading: boolean;
  isError: boolean;
} {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["resonadores"],
    queryFn: fetchResonadores,
    staleTime: 10 * 60_000,
    retry: 1,
  });

  if (data && data.length > 0) {
    return { resonadores: data, isLoading: false, isError: false };
  }

  // Fallback al catálogo estático mientras carga o si hay error
  return {
    resonadores: isLoading ? [] : RESONADORES,
    isLoading,
    isError,
  };
}

// ── Hook por ID ───────────────────────────────────────────────────────────────

export function useResonadorById(id: string | undefined): {
  resonador: Resonador | undefined;
  isLoading: boolean;
} {
  const { resonadores, isLoading } = useResonadores();
  return {
    resonador: id ? resonadores.find((r) => r.id === id) : undefined,
    isLoading,
  };
}

// ── Hook del perfil propio del resonador ──────────────────────────────────────

export function useMyResonadorProfile(): {
  profile: ApiResonador | null;
  isLoading: boolean;
  isOwner: boolean;
  updateMyProfile: (fields: Partial<ApiResonador>) => Promise<ApiResonador>;
} {
  const { getToken, isSignedIn } = useClerkAuth();
  const qc = useQueryClient();

  const { data: profile = null, isLoading } = useQuery({
    queryKey: ["my-resonador-profile"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("No autenticado");
      return fetchMyResonadorProfile(token);
    },
    enabled: !!isSignedIn,
    staleTime: 5 * 60_000,
    retry: (failureCount, error) => {
      // 404 = no tiene perfil, no reintentar
      const e = error as { status?: number };
      if (e?.status === 404) return false;
      return failureCount < 2;
    },
  });

  const mutation = useMutation({
    mutationFn: async (fields: Partial<ApiResonador>) => {
      const token = await getToken();
      if (!token) throw new Error("No autenticado");
      const res = await fetch(`${API_BASE}/api/me/resonador-profile`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(fields),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      return res.json() as Promise<ApiResonador>;
    },
    onSuccess: (updated) => {
      qc.setQueryData(["my-resonador-profile"], updated);
      // Invalidar el catálogo para que refleje los cambios
      void qc.invalidateQueries({ queryKey: ["resonadores"] });
    },
  });

  return {
    profile,
    isLoading,
    isOwner: !!profile,
    updateMyProfile: mutation.mutateAsync,
  };
}
