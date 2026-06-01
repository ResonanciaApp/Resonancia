---
name: Avatar sync (foto de perfil → server)
description: Por qué la foto de perfil local debe subirse al server para verse en features sociales
---

# Avatar sync

La foto de perfil vive como URI local en el contexto de perfil (data URL en web,
`file://` en native). Las features sociales (mezclas de la comunidad, chat, comentarios)
muestran el `avatarUrl` que devuelve el server. Por eso la foto hay que **subirla** a
Object Storage y persistir el objectPath en el server; no basta con tenerla local.

**Why:** sin sync, el avatar del autor queda null y la foto nunca aparece para otros
viewers ni en otros dispositivos. El sync solo corre **con sesión de Clerk** — un invitado
no tiene identidad en el server, así que aunque tenga la foto local, no se sube y no se
vincula a su cuenta. Esto fue exactamente el bloqueante real (no un bug): el usuario
probaba como invitado en web; recién al iniciar sesión y subir/confirmar la foto en el
device logueado, el avatar llegó al server.

**How to apply:**
- El sync es un efecto de fondo gateado por `isSignedIn && me && profileLoaded && photoUri`.
  Si falta cualquiera (típicamente la sesión), no sube nada — es esperado, no falla.
- Dedupe con un marker en AsyncStorage namespaced por cuenta; re-sube solo si cambió la
  foto local o el server perdió el avatar. Quitar la foto → PATCH avatarUrl=null, pero solo
  si nosotros lo habíamos seteado (no pisar avatares ajenos).
- En UI: prioridad server avatar → fallback foto local solo si la mezcla es mía → inicial.
  Las `<Image>` que cargan avatares de storage necesitan `onError` con estado para caer al
  icono/inicial si la URL está caída o expirada.
- Reusa el mismo flujo de presigned URL que el chat (no dupliques el upload).
- `/api/storage/objects/*` no exige auth/ACL, así que `<Image>` carga el avatar sin token.
