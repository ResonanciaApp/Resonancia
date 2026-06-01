/**
 * resolveAvatarUrl — convierte el `avatarUrl` que devuelve el server en una URL
 * cargable por <Image>.
 * ─────────────────────────────────────────────────────────────────
 * - null/"" → null (el caller muestra la inicial como fallback).
 * - data:/http(s): → se devuelve tal cual.
 * - objectPath de storage ("/objects/...") → ruta de serving del API
 *   ("/api/storage/objects/...") usando EXPO_PUBLIC_API_URL.
 */
export function resolveAvatarUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^(https?:|data:)/i.test(path)) return path;

  const base = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
  const servingPath = path.startsWith("/objects/")
    ? path.replace(/^\/objects\//, "/api/storage/objects/")
    : path.startsWith("/")
      ? path
      : `/${path}`;
  return `${base}${servingPath}`;
}
