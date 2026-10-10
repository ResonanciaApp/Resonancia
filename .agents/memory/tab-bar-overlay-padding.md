---
name: Tab bar overlay padding
description: La tab bar inferior de (tabs) es un overlay absoluto; las pantallas que llenan el alto deben despejarla manualmente
---

La tab bar inferior (`artifacts/mobile/app/(tabs)/_layout.tsx`, `CustomTabBar`)
es `position: "absolute"; bottom: 0` con fondo translúcido. NO empuja el
contenido: cualquier pantalla `flex:1` se extiende DEBAJO de ella, así que
contenido pegado al fondo queda tapado/recortado.

**Regla:** una pantalla que ancla algo al fondo (lienzo a pantalla completa,
fila pegada abajo) debe reservar el alto de la tab bar ella misma. La fórmula
(misma que usa `_layout.tsx`):

```
const bottomPb = Platform.OS === "web" ? 8 : insets.bottom; // useSafeAreaInsets
const tabBarHeight = 56 + Math.round(bottomPb / 2) + bottomPb;
```

Aplicar como `paddingBottom: tabBarHeight` en el contenedor flex, o anclar
elementos con `position:"absolute"; bottom: tabBarHeight + N`.

**Why:** sin esto el contenido del fondo se ve "cortado" por la tab bar; pasó
en Geometrix (lienzo + thumbnails). No hay context/hook compartido que exponga
el alto, por eso se recalcula localmente (deuda menor: la fórmula queda
duplicada con `_layout.tsx`; si cambia una, sincronizar la otra).
