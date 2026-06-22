---
name: Object Storage — URLs absolutas en React Native
description: Las URLs relativas de Object Storage no funcionan en RN; usar EXPO_PUBLIC_API_URL como base.
---

## Regla

En React Native, `<Image source={{ uri: "/api/storage/objects/..." }}>` **no funciona** (URL relativa). Siempre construir URL absoluta.

**Why:** RN no tiene contexto de "dominio base" como un browser; la URL relativa se interpreta literalmente y falla.

## Patrón correcto (igual que avatar.ts)

```ts
const API_BASE = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

function resolveStorageUrl(objectPath: string): string {
  const servingPath = objectPath.startsWith("/objects/")
    ? objectPath.replace(/^\/objects\//, "/api/storage/objects/")
    : objectPath.startsWith("/") ? objectPath : `/${objectPath}`;
  return `${API_BASE}${servingPath}`;
}
```

## Aplica a

- Thumbnails de videos (`useVideos.ts`)
- Avatares de usuario (`lib/avatar.ts`) — ya usa este patrón
- Sonidos remotos (`lib/remoteSoundMap.ts`) — ya usa este patrón
- Cualquier `<Image>` o `<Audio>` que venga de objectPath del servidor
