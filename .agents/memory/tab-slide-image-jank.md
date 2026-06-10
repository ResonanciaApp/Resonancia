---
name: Tab-slide image grid jank
description: Por qué una grilla de imágenes que anima al cambiar de tab no debe remontarse por key; usar animación por prop + cachePolicy memory-disk
---

# Grilla de imágenes con animación de slide entre tabs

**Regla:** Para animar la transición de una grilla de imágenes al cambiar de tab,
NO uses `key={animKey}` en el contenedor animado (remonta todos los hijos). Anima
por **prop** (`animKey`) con `useLayoutEffect([animKey, dir])` que resetea los
`Animated.Value` y reanima, dejando que la grilla reconcilie por `key={item.id}`.
Además, en `<Image>` de expo-image usa `cachePolicy="memory-disk"` (+ `transition={0}`).

**Why:** En `musica.tsx` (Mi Música), `ContentSlide` se montaba con `key={contentAnimKey}`
→ cada tap a un main tab desmontaba/remontaba las ~50 cards; con el `cachePolicy` por
defecto ("disk") cada JPEG bundleado se re-decodificaba → imágenes "lateadas" (escalonadas).
expo-image `memory-disk` mantiene los bitmaps decodificados en RAM (los ~40 JPEGs del mixer
pesan ~1.3 MB comprimidos, costo de RAM trivial), así al montar aparecen instantáneas; y al
reconciliar en vez de remontar, los sonidos compartidos entre tabs ni siquiera pierden su Image.

**How to apply:** Cualquier pantalla con grilla de imágenes que haga slide/fade al cambiar de
sección. Sub-tabs en musica.tsx ya funcionaban bien porque NO bumpean `contentAnimKey`.
Pendiente: `musica2.tsx` y `musica3.tsx` (rutas ocultas, `href:null`) conservan el patrón viejo
de remontaje-por-key; aplicar lo mismo solo si se reviven.
