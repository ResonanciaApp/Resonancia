---
name: Portadas bundleadas de playlists
description: Regla de persistencia para portadas predeterminadas incluidas en el bundle móvil.
---

Las portadas predeterminadas incluidas en el bundle deben persistirse mediante un identificador estable; la fuente local se resuelve desde ese ID al renderizar. Las URI producidas por el runtime quedan reservadas para imágenes personalizadas.

**Why:** Las URI de assets bundleados pueden cambiar entre actualizaciones, instalaciones, plataformas y dispositivos. Sincronizarlas en la biblioteca puede dejar portadas rotas o impedir reconocer la selección actual.

**How to apply:** Toda nueva colección de portadas locales debe definir IDs semánticos estables, guardar solo el ID en el modelo sincronizado y hacer que todas las superficies que muestran la portada resuelvan el asset desde ese ID.