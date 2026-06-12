---
name: Reanimated slide-push sin glitch (New Architecture)
description: Patrón para animar un pill que empuja a un sibling sin glitch de texto en RN New Architecture / Fabric.
---

# Pill que empuja sibling — sin glitch de texto (Reanimated New Architecture)

## El problema
En New Architecture (SDK 54 / Fabric), animar `width` en un `RAnimated.View` que contiene texto con `overflow: hidden` produce artifacts de clip (texto visible en la clip boundary durante cada frame). Cuanto más texto, más visible el glitch.

## La solución correcta: spacer vacío + pill con opacity pura

Separar layout de visual en dos elementos hermanos:

```
[Sesiones chip] → [sesSegSpacer (RAnimated)] → [Música chip]
                         ↕ width: 0→188
                   [sesSegPill (RAnimated, dentro del spacer)]
                         ↕ opacity: 0→1
```

### Spacer (`sesSegSpacer`)
- `RAnimated.View` sin contenido ni texto
- `width` animado 0→targetW (empuja al sibling)
- `overflow: 'visible'` explícito — el pill dentro desborda sin clip
- `marginLeft: -gap` donde `gap` = el gap del flex row — **crucial** para cancelar el gap que flexbox inserta antes del spacer al montar/desmontar (evita el mini-snap)
- Sin texto = sin Yoga text-reflow = sin glitch posible

### Pill (`sesSegPill`)
- `RAnimated.View` dentro del spacer
- `width` FIJO (ej. 220px), **nunca animado**
- `marginLeft: -32` para solaparse con el chip anterior
- `opacity` animado 0→1 (único cambio visual, sin clip boundary)
- `overflow: 'hidden'` solo para recortar fondos activos de botones (el clip es estático = sin artifact)

## Cálculo de targetW

`targetW = pillWidth - solapamiento = 220 - 32 = 188`

## Timing recomendado

**Open:**
```js
spacerWidthSV.value = withTiming(188, { duration: 200 });        // spacer empuja primero
pillOpacitySV.value = withDelay(100, withTiming(1, { duration: 140 })); // pill aparece cuando hay espacio
```

**Close:**
```js
pillOpacitySV.value = withTiming(0, { duration: 120 });          // pill desaparece primero
spacerWidthSV.value = withDelay(100, withTiming(0, { duration: 160 }, cb)); // spacer arrastra Música de vuelta
```

## Gap cancel (evita el mini-snap al montar/desmontar)

Un spacer de width=0 en un flex row con `gap: N` todavía ocupa N px extra (el gap antes del spacer). Al desmontar, Música salta N px.

**Fix:** `marginLeft: -N` en el spacer cancela ese gap exactamente.

```js
sesSegSpacer: {
  height: 32,
  overflow: 'visible',
  marginLeft: -6,  // gap del flex row = 6px en el chip row de Inicio
},
```

## Por qué NO funcionaron los otros enfoques

| Enfoque | Problema |
|---|---|
| `width` animado en wrapper con `overflow:hidden` | Clip boundary se mueve sobre el texto → glitch en New Arch |
| `LayoutAnimation` | Música salta en close |
| `marginRight: -188` (pill con 0 net space) | Música queda debajo del pill semi-transparente |
| `withDelay` opacity antes del clip | Mejora pero no elimina: 1 frame de overlap entre opacity≈0 y clip |

**Why:** En New Architecture, `overflow:hidden` + `width` animado produce clip artifacts porque Fabric actualiza el clip rect en un frame independiente del paint. La única solución robusta es que el clip sea ESTÁTICO (tamaño fijo) y que el spacer que empuja no tenga texto.
