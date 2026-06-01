/**
 * ProfileSync — empuja el nombre de usuario local al `displayName` del server.
 * ─────────────────────────────────────────────────────────────────
 * El perfil (nombre) vive en AsyncStorage (UserProfileContext), pero las
 * features sociales (mezclas de la comunidad, amigos, comentarios) muestran
 * el `displayName` que guarda el server. Al crear la cuenta, el server pone
 * un nombre por defecto derivado del ID de Clerk (ej. "user_3ecvn1xpkv").
 *
 * Este componente, cuando hay sesión de Clerk, sincroniza el nombre elegido
 * por el usuario hacia el server para que aparezca en lugar del ID.
 * No renderiza nada.
 * ─────────────────────────────────────────────────────────────────
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import {
  getGetMeQueryKey,
  getGetSharedMixesQueryKey,
  useGetMe,
  useUpdateMe,
} from "@workspace/api-client-react";

import { useAuth } from "@/context/AuthContext";
import { DEFAULT_USERNAME, useUserProfile } from "@/context/UserProfileContext";
import { uploadLocalFile } from "@/lib/upload";

const AVATAR_MARKER_KEY = "cdc_avatar_synced";

/** contentType + nombre de archivo para subir el avatar (data URL o file URI). */
function avatarMeta(uri: string): { contentType: string; fileName: string } {
  if (uri.startsWith("data:")) {
    const mime = uri.slice(5, uri.indexOf(";")) || "image/jpeg";
    const ext = mime.split("/")[1] || "jpg";
    return { contentType: mime, fileName: `avatar.${ext}` };
  }
  const ext = uri.split("?")[0].split(".").pop()?.toLowerCase() || "jpg";
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    heic: "image/heic",
  };
  return { contentType: map[ext] ?? "image/jpeg", fileName: `avatar.${ext}` };
}

export function ProfileSync() {
  const { isSignedIn } = useAuth();
  const { username, photoUri, profileLoaded } = useUserProfile();
  const queryClient = useQueryClient();

  const { data: me } = useGetMe({
    query: { queryKey: getGetMeQueryKey(), enabled: isSignedIn, staleTime: 60_000 },
  });
  const updateMe = useUpdateMe();

  // Última combinación cuenta+nombre que intentamos sincronizar, para no
  // repetir el PATCH ni entrar en bucle de reintentos. Incluye el id de la
  // cuenta para no arrastrar el nombre de una cuenta a otra en el mismo device.
  const lastSynced = useRef<string | null>(null);

  useEffect(() => {
    // Esperar a que el perfil local termine de hidratar desde AsyncStorage:
    // si no, podríamos empujar el valor por defecto antes de leer el real.
    if (!isSignedIn || !me || !profileLoaded) return;
    const desired = username.trim();
    if (!desired || me.displayName === desired) return;

    // El server arranca con un displayName auto-generado del ID de Clerk
    // (ej. "user_3ecvn1xpkv", con displayName === username). En ese estado SÍ
    // queremos reemplazarlo aunque el nombre local sea el placeholder.
    const serverIsAutoDefault =
      me.displayName === me.username && /^user_[a-z0-9]+$/.test(me.displayName);
    // No pisar un nombre real del server con el placeholder local (multi-device).
    if (desired === DEFAULT_USERNAME && !serverIsAutoDefault) return;

    const key = `${me.id}:${desired}`;
    if (lastSynced.current === key || updateMe.isPending) return;

    // Marcamos antes de mutar. En error NO reseteamos la key (evita un bucle
    // de PATCH); el próximo arranque de la app remonta el componente y reintenta.
    lastSynced.current = key;
    updateMe.mutate(
      { data: { displayName: desired } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetSharedMixesQueryKey() });
        },
      },
    );
  }, [isSignedIn, me, username, profileLoaded, updateMe, queryClient]);

  // ── Sync de avatar ───────────────────────────────────────────────────────
  // La foto vive como URI local (data URL en web, file:// en native). Las
  // features sociales muestran `avatarUrl` del server, así que subimos la foto
  // a Object Storage y guardamos el objectPath. Un marker en AsyncStorage evita
  // re-subir la misma foto en cada arranque.
  const avatarSyncing = useRef(false);
  const avatarMarker = useRef<{ uri: string; path: string } | null>(null);
  const avatarMarkerLoaded = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function syncAvatar() {
      if (!isSignedIn || !me || !profileLoaded) return;
      if (avatarSyncing.current) return;

      // Marker namespaced por cuenta (multi-usuario en el mismo dispositivo).
      const markerKey = `${AVATAR_MARKER_KEY}:${me.id}`;
      if (!avatarMarkerLoaded.current) {
        try {
          const raw = await AsyncStorage.getItem(markerKey);
          avatarMarker.current = raw ? JSON.parse(raw) : null;
        } catch {
          avatarMarker.current = null;
        }
        avatarMarkerLoaded.current = true;
      }
      const marker = avatarMarker.current;

      // El usuario quitó la foto: si nosotros habíamos seteado el avatar del
      // server, lo limpiamos. No tocamos un avatar que no hayamos puesto.
      if (!photoUri) {
        if (!marker || !me.avatarUrl) return;
        avatarSyncing.current = true;
        try {
          await updateMe.mutateAsync({ data: { avatarUrl: null } });
          avatarMarker.current = null;
          await AsyncStorage.removeItem(markerKey);
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetSharedMixesQueryKey() });
        } catch {
          // reintentamos en el próximo arranque
        } finally {
          avatarSyncing.current = false;
        }
        return;
      }

      // Ya sincronizado: misma foto local y el server todavía la tiene.
      if (marker && marker.uri === photoUri && me.avatarUrl === marker.path) return;

      avatarSyncing.current = true;
      try {
        const { contentType, fileName } = avatarMeta(photoUri);
        const objectPath = await uploadLocalFile(photoUri, contentType, fileName, 1);
        if (cancelled) return;
        await updateMe.mutateAsync({ data: { avatarUrl: objectPath } });
        avatarMarker.current = { uri: photoUri, path: objectPath };
        await AsyncStorage.setItem(markerKey, JSON.stringify(avatarMarker.current));
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetSharedMixesQueryKey() });
      } catch {
        // Falló la subida: reintentamos en el próximo arranque (no en bucle).
      } finally {
        avatarSyncing.current = false;
      }
    }
    syncAvatar();
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, me, photoUri, profileLoaded, updateMe, queryClient]);

  return null;
}
