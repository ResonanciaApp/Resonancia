---
name: Profile name sync to server
description: Por qué el nombre del perfil local debe empujarse al displayName del server para features sociales
---

El nombre que el usuario ve/edita en su perfil vive en AsyncStorage
(`UserProfileContext.username`). Las features sociales (mezclas de la
comunidad, amigos, comentarios) muestran el `displayName` que guarda el
server en `usersTable`.

Al crear la cuenta (`requireAuth.ts`), el server setea `username` y
`displayName` a un default derivado del ID de Clerk (ej. "user_3ecvn1xpkv").
Si el nombre local no se sincroniza, las features sociales muestran ese ID.

**Regla:** cuando haya sesión de Clerk, el `username` local debe empujarse al
`displayName` del server (PATCH /me vía `useUpdateMe`) e invalidar `getMe` +
`getSharedMixes`. Lo hace el componente renderless `ProfileSync`
(`components/ProfileSync.tsx`), montado en `_layout` dentro de
`UserProfileProvider`. Es idempotente (ref `lastSynced`).

**Why:** el perfil local y el server son dos fuentes distintas; sin sync, el
usuario veía el ID de Clerk como autor en el carrusel de comunidad.

**How to apply:** cualquier nueva feature social que muestre nombres usa el
`displayName` del server — confiar en que ProfileSync lo mantiene al día, no
re-implementar el sync.
