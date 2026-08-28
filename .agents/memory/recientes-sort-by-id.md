---
name: Recientes / Nuevas Sesiones ordering
description: Cómo deben ordenarse y refrescarse las listas "más recientes / nuevas" para que una sesión nueva de DB salga primera
---

# Listas "más recientes / nuevas" en mobile

Regla: las superficies que muestran "lo más nuevo" deben:

1. Sesiones con `isNew: true` → primero.
2. Sesiones del admin (IDs `usr_*`, no numéricos) → ordenadas por `createdAt DESC`.
3. Sesiones bundleadas (IDs numéricos) → ordenadas por `parseInt(id)` descendente.
4. Recalcular con dependencia en `version` de `useCatalog()`.

**Why:** Las sesiones subidas por admin tienen IDs `usr_xxxxxxxxx` (texto). `parseInt("usr_...")` devuelve `NaN`, haciendo el sort inestable. `createdAt` (ISO string) es la única fuente confiable para ordenarlas entre sí. El campo debe propagarse en **ambos pasos** de `applyCatalogSnapshot`: paso 1 (actualizar in-place) Y paso 2 (push de nuevas). Si solo se agrega en paso 2, las sesiones ya en SESSIONS desde el snapshot anterior nunca reciben `createdAt`.

**How to apply:**
```js
if (sort === "nuevas") return [...arr].sort((a, b) => {
  if (a.isNew && !b.isNew) return -1;
  if (!a.isNew && b.isNew) return 1;
  const aNum = parseInt(a.id); const bNum = parseInt(b.id);
  const aIsNum = !isNaN(aNum);  const bIsNum = !isNaN(bNum);
  if (!aIsNum && bIsNum)  return -1; // usr_* antes que numéricos
  if (aIsNum  && !bIsNum) return  1;
  if (!aIsNum && !bIsNum) {
    const aT = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bT = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bT - aT;
  }
  return bNum - aNum;
});
```
Y en `applyCatalogSnapshot` paso 1: `local.createdAt = r.createdAt ?? undefined;`
La API debe incluir `createdAt: s.createdAt.toISOString()` en `serializeSession`.

Las colecciones de Dormir también usan `createdAt DESC` para poner la última
sesión subida al frente de cada carrusel. No depender solo de `parseInt(id)`:
los IDs de sesiones creadas desde el admin suelen ser `usr_*`.
