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
`UserProfileProvider`. Reacciona a cambios de `username`, así que cubre tanto
el arranque de la app como la edición del nombre — NO duplicar el sync en
`profile.tsx`.

**Guardas imprescindibles (un sync naïve pisa nombres reales):**
- Esperar la hidratación de AsyncStorage (`profileLoaded` en UserProfileContext)
  antes de mutar; si no, se empuja el default antes de leer el real.
- NO sincronizar el placeholder `DEFAULT_USERNAME` ("ElSeñordelosCuencos"):
  un device nuevo arranca con ese valor y pisaría el `displayName` real del server.
- Key de dedup = `${me.id}:${desired}` (incluye la cuenta) para no arrastrar el
  nombre de una cuenta a otra en el mismo device.
- En `onError` NO resetear la key (evita bucle de PATCH); el remonte en el
  próximo arranque reintenta.

**Why:** el perfil local y el server son dos fuentes distintas; sin sync, el
usuario veía el ID de Clerk como autor en el carrusel de comunidad. `requireAuth`
solo siembra el default en el INSERT (creación), nunca lo pisa por request, así
que el PATCH del cliente persiste.

**How to apply:** cualquier nueva feature social que muestre nombres usa el
`displayName` del server — confiar en que ProfileSync lo mantiene al día, no
re-implementar el sync.
