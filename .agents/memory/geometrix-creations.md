---
name: Geometrix "Mis creaciones"
description: Cómo se guardan/reabren composiciones de Geometrix como datos (receta) y dos gotchas durables
---

# Geometrix "Mis creaciones" (composiciones guardadas)

Una "creación" es SOLO la receta (capas activas, ajustes por capa, master/fondo,
audio elegido), no imagen/video. Se redibuja en vivo idéntica. Local-first (AsyncStorage).

## Regla: degradados/brillo viven en el módulo data compartido
Los resolvers de degradado y brillo (STROKE_GRADIENTS, BG_GRADIENTS, gradientColors,
bgGradientColors, scaleHex, brightnessFactor, scaleColors, HOME_GRADIENT) viven en
`data/geometrix-creations.ts`, NO en la pantalla del editor.

**Why:** los previews de "Mis creaciones" deben usar EXACTAMENTE la misma lógica que
el editor o la miniatura miente (fondo/gradiente/brillo de la receta ignorados). Un
code review marcó esto como fallo funcional cuando estaban duplicados en el editor.

**How to apply:** si tocás la lógica de degradado/brillo, hacelo en el módulo data;
editor y pantalla la importan. No re-duplicar en la pantalla.

## Gotcha: param de ruta `load` se limpia a "" (no undefined)
Geometrix es un tab montado; se abre una creación pasando `params.load = id` y el
efecto la restaura. Tras restaurar, limpiar con `router.setParams({ load: "" })`.

**Why:** `undefined` no limpia de forma fiable en expo-router, y si el param queda en
el mismo id, reabrir la MISMA creación no cambia `params.load` → el efecto no vuelve a
dispararse. Con "" → id cambia siempre y reabrir funciona.
