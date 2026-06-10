---
name: Geometrix per-geometry settings sheet (preview + reset)
description: Acoplamientos no obvios del panel de "ajustes personalizados" por geometría en geometrix.tsx — tamaño del preview ligado al alto medido del sheet, y alcance de "modificado/restablecer".
---

# Geometrix — sheet de ajustes por geometría

## El tamaño/posición de la vista previa DERIVA del alto medido del sheet
`previewSize` y el anclaje del preview (`bottom: sheetHeight + 12`) se calculan a
partir de `sheetHeight`, que se mide con `onLayout` del bottom sheet del Modal de
ajustes. Por eso:
- Si el sheet usa `maxHeight` (alto guiado por contenido), al desplegar una
  sección el sheet CRECE → `sheetHeight` cambia → el preview se achica y se mueve
  hacia arriba.
- Para que el preview SIEMPRE mantenga su tamaño/posición, el sheet debe tener
  alto FIJO mientras se edita una geometría (`settingsGeo && { height: "68%" }`),
  y el ScrollView interno `flex: 1` para que el contenido empuje hacia abajo y
  scrollee dentro del alto fijo (no hacia arriba).
**Why:** el preview flota absoluto encima del sheet, no dentro; su única
referencia es el alto del sheet. Las dos piezas viven lejos en el archivo (cálculo
de `previewSize` vs. estilo inline del sheet) → fácil de romper sin querer.

## "Modificado/Restablecer" por geometría = solo parámetros del PANEL
`isGeoModified(id)` y `resetGeometry(id)` IGNORAN las claves de transformación por
gesto (`TRANSFORM_KEYS`: scale, zoom, manualAngle, offsetX, offsetY).
- Mover/rotar/zoom una geometría NO marca "modificada" ni muestra el botón
  "Restablecer" (junto a la flechita/caret de la miniatura).
- Restablecer restaura los defaults de los params visuales pero PRESERVA la
  transformación (no teletransporta la geometría al centro).
- `isGeoModified` compara el objeto FUSIONado (`{...defaults, ...settings[id]}`)
  contra defaults, no `settings[id]` crudo: las creaciones guardadas pueden tener
  settings PARCIALES (faltan claves nuevas) y una clave ausente debe contar como
  su default, no como "modificada" (si no, el botón aparece de la nada).
**Why:** el botón vive en el contexto de "ajustes personalizados"; las
transformaciones son gesto del lienzo, no del panel.
