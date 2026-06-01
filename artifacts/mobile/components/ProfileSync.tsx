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

export function ProfileSync() {
  const { isSignedIn } = useAuth();
  const { username, profileLoaded } = useUserProfile();
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
    // No sincronizar el placeholder: solo nombres realmente elegidos.
    if (!desired || desired === DEFAULT_USERNAME) return;
    if (me.displayName === desired) return;

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

  return null;
}
