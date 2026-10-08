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
import { useEffect, useRef, useState } from "react";

import {
  getGetMeQueryKey,
  getMe,
  getGetSharedMixesQueryKey,
  getGetPublicUserProfileQueryKey,
  useGetMe,
  useUpdateMe,
} from "@workspace/api-client-react";

import { useAuth } from "@/context/AuthContext";
import { DEFAULT_USERNAME, useUserProfile } from "@/context/UserProfileContext";
import { uploadLocalFile } from "@/lib/upload";
import { useSubscription } from "@/lib/revenuecat";
import { biographyFingerprint, recoverBiography } from "@/lib/profileBiographySync";

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
  const { isSignedIn, clerkUserId } = useAuth();
  const { username, lastName, location, description, lifeMotto, biographyOwnerId, biographySyncedValue, photoUri, avatarPresetId, profileLoaded, updateProfile } = useUserProfile();
  const { subscriptionStatus, customerInfo } = useSubscription();
  const [biographyRecovered, setBiographyRecovered] = useState<number | null>(null);
  const [biographyRetry, setBiographyRetry] = useState(0);
  const biographyPending = useRef(false);
  const membershipPending = useRef(false);
  const lastMembershipSynced = useRef<string | null>(null);
  const currentAccount = useRef(clerkUserId);
  currentAccount.current = clerkUserId;
  const latestBiography = useRef("");
  latestBiography.current = JSON.stringify([description.trim(), lifeMotto.trim()]);
  const biographyRetryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (biographyRetryTimer.current) clearTimeout(biographyRetryTimer.current);
    };
  }, []);
  const latestAvatarPresetId = useRef(avatarPresetId);
  latestAvatarPresetId.current = avatarPresetId;
  const queryClient = useQueryClient();

  const { data: me } = useGetMe({
    query: { queryKey: getGetMeQueryKey(), enabled: isSignedIn, staleTime: 60_000 },
  });
  const updateMe = useUpdateMe();

  useEffect(() => {
    if (isSignedIn && clerkUserId) void queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
  }, [isSignedIn, clerkUserId, queryClient]);

  // Preserve pending edits, but recover updates made on another device.
  useEffect(() => {
    if (!isSignedIn || !clerkUserId || !me || me.clerkUserId !== clerkUserId || !profileLoaded) return;
    const recovered = recoverBiography({ description, lifeMotto, biographyOwnerId, biographySyncedValue }, me, clerkUserId);
    if (recovered) updateProfile(recovered);
    if (biographyRecovered !== me.id) setBiographyRecovered(me.id);
  }, [isSignedIn, clerkUserId, me, profileLoaded, description, lifeMotto, biographyOwnerId, biographySyncedValue, biographyRecovered, updateProfile]);

  useEffect(() => {
    if (!isSignedIn || !clerkUserId || !me || me.clerkUserId !== clerkUserId || biographyOwnerId !== clerkUserId || !profileLoaded || biographyRecovered !== me.id || biographyPending.current) return;
    if (biographySyncedValue === biographyFingerprint(description, lifeMotto)) return;
    const desired = { longDescription: description.trim() || null, lifeMotto: lifeMotto.trim() || null };
    if (desired.longDescription === (me.longDescription ?? null) && desired.lifeMotto === (me.lifeMotto ?? null)) return;
    biographyPending.current = true;
    let succeeded = false;
    const sentBiography = JSON.stringify([description.trim(), lifeMotto.trim()]);
    void updateMe.mutateAsync({ data: desired }).then((updated) => {
      succeeded = true;
      if (currentAccount.current !== clerkUserId) return;
      queryClient.setQueryData(getGetMeQueryKey(), updated);
      updateProfile({ biographySyncedValue: sentBiography });
      void queryClient.invalidateQueries({ queryKey: getGetPublicUserProfileQueryKey(me.id) });
    }).catch((error) => {
      console.warn("[ProfileSync] No se pudo publicar la biografía", error);
      if (mounted.current && currentAccount.current === clerkUserId) {
        if (biographyRetryTimer.current) clearTimeout(biographyRetryTimer.current);
        biographyRetryTimer.current = setTimeout(() => setBiographyRetry((tick) => tick + 1), 15_000);
      }
    }).finally(() => {
      biographyPending.current = false;
      if (mounted.current && (succeeded || latestBiography.current !== sentBiography)) setBiographyRetry((tick) => tick + 1);
    });
  }, [isSignedIn, clerkUserId, me, biographyOwnerId, biographySyncedValue, profileLoaded, biographyRecovered, description, lifeMotto, biographyRetry, queryClient, updateProfile]);

  useEffect(() => {
    if (!isSignedIn || !clerkUserId || !me || me.clerkUserId !== clerkUserId || subscriptionStatus === "unknown" || !customerInfo || membershipPending.current) return;
    const entitlement = customerInfo.entitlements.active.premium;
    const snapshot = {
      active: subscriptionStatus === "active",
      expiresAt: entitlement?.expirationDate ?? null,
    };
    const key = `${me.id}:${snapshot.active}:${snapshot.expiresAt}`;
    if (lastMembershipSynced.current === key) return;
    membershipPending.current = true;
    void updateMe.mutateAsync({ data: { publicMembership: snapshot } }).then(() => {
      lastMembershipSynced.current = key;
      void queryClient.invalidateQueries({ queryKey: getGetPublicUserProfileQueryKey(me.id) });
    }).catch((error) => {
      console.warn("[ProfileSync] No se pudo publicar la insignia", error);
    }).finally(() => { membershipPending.current = false; });
  }, [isSignedIn, clerkUserId, me, subscriptionStatus, customerInfo, queryClient]);

  // Última combinación cuenta+nombre que intentamos sincronizar, para no
  // repetir el PATCH ni entrar en bucle de reintentos. Incluye el id de la
  // cuenta para no arrastrar el nombre de una cuenta a otra en el mismo device.
  const lastSynced = useRef<string | null>(null);

  useEffect(() => {
    // Esperar a que el perfil local termine de hidratar desde AsyncStorage:
    // si no, podríamos empujar el valor por defecto antes de leer el real.
    if (!isSignedIn || !me || me.clerkUserId !== clerkUserId || !profileLoaded) return;
    const desired = [username.trim(), lastName.trim()].filter(Boolean).join(" ");
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
  }, [isSignedIn, clerkUserId, me, username, lastName, profileLoaded, updateMe, queryClient]);

  // ── Sync de location ─────────────────────────────────────────────────────
  const lastLocationSynced = useRef<string | null>(null);
  useEffect(() => {
    if (!isSignedIn || !me || !profileLoaded) return;
    const desired = location?.trim() ?? null;
    const serverLocation = me.location ?? null;
    if (desired === serverLocation) return;
    const key = `${me.id}:loc:${desired ?? ""}`;
    if (lastLocationSynced.current === key || updateMe.isPending) return;
    lastLocationSynced.current = key;
    updateMe.mutate(
      { data: { location: desired } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() }) },
    );
  }, [isSignedIn, me, location, profileLoaded, updateMe, queryClient]);

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

      // A preset is a stable catalog reference, not a resolved URL. Keep the
      // server's avatarUrl empty so catalog replacements follow the slot.
      if (avatarPresetId) {
        if (me.avatarPresetId === avatarPresetId && !me.avatarUrl) return;
        avatarSyncing.current = true;
        try {
          await updateMe.mutateAsync({
            data: { avatarPresetId },
          });
          avatarMarker.current = null;
          await AsyncStorage.removeItem(markerKey);
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetSharedMixesQueryKey() });
        } catch (error) {
          if ((error as { data?: { code?: string } }).data?.code === "AVATAR_LOCKED") {
            const current = await getMe().catch(() => null);
            if (current && latestAvatarPresetId.current === avatarPresetId) {
              updateProfile({ avatarPresetId: current.avatarPresetId ?? null, photoUri: current.avatarUrl ?? null });
              queryClient.setQueryData(getGetMeQueryKey(), current);
            }
          }
          // Transient failures retain the offline choice for the next sync.
        } finally {
          avatarSyncing.current = false;
        }
        return;
      }

      // El usuario quitó la foto: si nosotros habíamos seteado el avatar del
      // server, lo limpiamos. No tocamos un avatar que no hayamos puesto.
      if (!photoUri) {
        if (!me.avatarPresetId && (!marker || !me.avatarUrl)) return;
        avatarSyncing.current = true;
        try {
          // The API treats avatarUrl and avatarPresetId as mutually exclusive
          // payload modes, even when the other field is null.
          await updateMe.mutateAsync({
            data: me.avatarPresetId ? { avatarPresetId: null } : { avatarUrl: null },
          });
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
      if (marker && marker.uri === photoUri && me.avatarUrl === marker.path && !me.avatarPresetId) return;

      avatarSyncing.current = true;
      try {
        // Preset remoto del catálogo: ya está alojado en App Storage, por lo
        // que no debe volver a subirse como si fuera un archivo local.
        if (/^(https?:|\/objects\/)/i.test(photoUri)) {
          await updateMe.mutateAsync({ data: { avatarUrl: photoUri } });
          avatarMarker.current = { uri: photoUri, path: photoUri };
          await AsyncStorage.setItem(markerKey, JSON.stringify(avatarMarker.current));
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetSharedMixesQueryKey() });
          return;
        }
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
  }, [avatarPresetId, isSignedIn, me, photoUri, profileLoaded, updateMe, queryClient]);

  return null;
}
