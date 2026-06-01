---
name: Avatar sync (foto de perfil → server)
description: Cómo la foto de perfil local llega a avatarUrl del server y se muestra en features sociales
---

# Avatar sync

La foto de perfil vive como URI local en `UserProfileContext.photoUri` (data URL en web,
`file://` en native). Las features sociales (mezclas de la comunidad, chat, comentarios)
muestran `avatarUrl` que devuelve el server. Por eso la foto hay que **subirla** y persistir
el objectPath en el server, no basta con tenerla local.

**Flujo:** `ProfileSync` (montado en `_layout`, solo con sesión Clerk) sube la foto a Object
Storage con `uploadLocalFile` (`lib/upload.ts`, compartido con el chat) y hace
`PATCH /me { avatarUrl: objectPath }`. Para renderizar, `resolveAvatarUrl` (`lib/avatar.ts`)
mapea `/objects/...` → `/api/storage/objects/...` con `EXPO_PUBLIC_API_URL` (igual que
`getVideoSourceUri`).

**Why:** sin sync, `mix.author.avatarUrl` queda null y la foto nunca aparece para otros
viewers ni en otros dispositivos. El sync solo corre con sesión Clerk (un invitado no tiene
identidad en el server).

**How to apply:**
- Dedupe con marker en AsyncStorage `cdc_avatar_synced:${me.id}` (namespaced por cuenta) que
  guarda `{uri, path}`; se re-sube solo si cambió la foto local o el server perdió el avatar.
- Quitar foto (`photoUri` vacío) → `PATCH { avatarUrl: null }` solo si el marker indica que
  nosotros lo seteamos (no pisar avatares ajenos).
- En UI, prioridad: `resolveAvatarUrl(server avatarUrl)` → fallback `photoUri` local solo si
  `mix.isMine` (para verla al instante en el propio device) → inicial.
- `/api/storage/objects/*` no exige auth/ACL, así que `<Image>` carga el avatar sin token.
