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
import { useUserProfile } from "@/context/UserProfileContext";

export function ProfileSync() {
  const { isSignedIn } = useAuth();
  const { username } = useUserProfile();
  const queryClient = useQueryClient();

  const { data: me } = useGetMe({
    query: { queryKey: getGetMeQueryKey(), enabled: isSignedIn, staleTime: 60_000 },
  });
  const updateMe = useUpdateMe();

  // Último nombre que intentamos sincronizar, para no repetir el PATCH.
  const lastSynced = useRef<string | null>(null);

  useEffect(() => {
    if (!isSignedIn || !me) return;
    const desired = username.trim();
    if (!desired || me.displayName === desired) return;
    if (lastSynced.current === desired || updateMe.isPending) return;

    lastSynced.current = desired;
    updateMe.mutate(
      { data: { displayName: desired } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetSharedMixesQueryKey() });
        },
        onError: () => {
          // Permitir reintento en el próximo render.
          lastSynced.current = null;
        },
      },
    );
  }, [isSignedIn, me, username, updateMe, queryClient]);

  return null;
}
