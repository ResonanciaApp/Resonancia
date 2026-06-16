---
name: MiniPlayer carousel scrollable
description: Cómo hacer que los thumbnails apilados del mezclador sean scrolleables horizontalmente cuando están desplegados.
---

# MiniPlayer carousel — carrusel scrolleable horizontal

## Regla

Cuando los hijos de un `ScrollView` horizontal son `position:absolute`, el `ScrollView` no puede inferir el ancho del contenido por sí solo. Hay que pasarlo explícitamente en `contentContainerStyle={{ width: <number> }}`. Sin ese width el scroll no funciona.

## Cómo se aplica (MiniPlayer.tsx)

- `Animated.View` (frame, ancho animado con JS driver, overflow:hidden) → `ScrollView horizontal` (ref=scrollRef, `scrollEnabled={stackOpen}`, `contentContainerStyle={{ width: carouselContentW, height: STACK_SIZE }}`) → thumbnails `position:absolute` con `translateX` por driver nativo.
- `scrollEnabled` se activa solo cuando `stackOpen=true` para que el tap-para-abrir no interfiera con el gesto de scroll.
- Al colapsar: `scrollRef.current?.scrollTo({ x: 0, animated: false })` — sin animar para que los thumbnails apilados sean visibles de inmediato.
- Al cambiar `n` (sonido añadido/quitado): idem reset, para que un offset que quedó más allá del nuevo contenido no muestre espacio vacío.

**Why:** animated:true en el collapse mostraba un flash de espacio vacío antes de que el spring de ancho terminara; los hijos absolute sin width en contentContainer hacen que ScrollView piense que el contenido tiene tamaño 0.

## Archivos de respaldo (snapshot del fix)

- `components/MixerSheet.bak`
- `context/MixerContext.bak`
- `components/MiniPlayer.bak`
