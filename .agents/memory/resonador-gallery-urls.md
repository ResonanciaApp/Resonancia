---
name: Resonador gallery URL resolution
description: Cómo se resuelven las URLs de fotos del resonador en la app mobile
---

## Regla

Todo campo de imagen de `ApiResonador` debe pasar por `resolveResonadorUrl()` en `apiToResonador()` antes de usarse en un `<Image>`.

- `photoUrl` → `resolveResonadorUrl(r.photoUrl)`
- `coverPhotoUrl` → `resolveResonadorUrl(r.coverPhotoUrl)`
- `photos[]` → `r.photos.map(p => resolveResonadorUrl(p) ?? p)`

**Por qué:** Los objectPaths en la BD tienen formato `/objects/resonadores/…`. React Native necesita una URL absoluta; el valor crudo no resuelve nada y se muestra como fondo vacío.

**Prioridad de foto de perfil:** DB photo > asset bundleado > default.
```typescript
photo:
  (photoUrl ? { uri: photoUrl } : null) ??
  staticEntry?.photo ??
  RESONADORES[0].photo,
```
La prioridad anterior era al revés (bundle ganaba siempre), impidiendo que las fotos subidas desde el admin se vieran en la app.
