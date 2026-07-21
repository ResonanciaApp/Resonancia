---
name: Tab screen renames (Crea/Medita/Universo)
description: Nombres actuales de las 3 pantallas principales renombradas — evitar confundir con nombres viejos en código/comentarios
---

Las pantallas principales del tab bar fueron renombradas (05 jul 2026):

| Route | Nombre viejo | Nombre nuevo |
|---|---|---|
| `musica` (Mezclador) | Mezclador | **Crear** (pasó brevemente por "Crea" antes de fijarse en "Crear") |
| `explore` | Meditación | **Medita** |
| `biblioteca` | Mi Espacio | **Universo** |
| `profile` | Perfil | **Biblioteca** (21 jul 2026; icono books.vertical — la ruta `biblioteca` está en HIDDEN_ROUTES, no hay duplicado visible) |

**Why:** decisión de producto del usuario para simplificar/renombrar el branding de las secciones principales.

Además, dentro de la pantalla `profile` (ProfileScreenBase, modo no-dedicado): título "Perfil" → **"Biblioteca"** y la sub-tab "Biblioteca" → **"Mi Espacio"** (21 jul 2026). El engranaje de configuraciones salió del header de esa pantalla y ahora vive en Mi Perfil (modo dedicado) junto al lápiz de editar.

**How to apply:** los labels viven en `app/(tabs)/_layout.tsx` (objeto `TAB_META` + `Tabs.Screen options={{ title }}`) y el título grande dentro de cada pantalla (`musica.tsx`, `explore.tsx`, `biblioteca.tsx` usan `styles.pageTitle`/`styles.headerTitle`). Los nombres de archivo/ruta (`musica`, `explore`, `biblioteca`) y nombres internos de componentes (`MezcladorScreen`, etc.) NO se renombraron — solo los textos visibles al usuario. No confundir menciones de "Meditación"/"Mezclador" en datos de contenido (subtítulos de sesiones, tags, categorías) con los nombres de pantalla — esas son coincidencias de dominio, no bugs.
