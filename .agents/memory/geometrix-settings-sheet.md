---
name: Geometrix per-geometry settings sheet (preview + reset)
description: Acoplamientos no obvios del panel de "ajustes personalizados" por geometría en geometrix.tsx — tamaño del preview ligado al alto medido del sheet, y alcance de "modificado/restablecer".
---

# Geometrix — sheet de ajustes por geometría

## El tamaño/posición de la vista previa DERIVA del alto medido del sheet
`previewSize` y el anclaje del preview (`bottom: sheetHeight + 12`) se calculan a
partir de `sheetHeight`, medido con `onLayout` del bottom sheet del Modal. Por eso
sheet más alto = preview más chico y más arriba. Nota: `previewSize` queda topado
por el ANCHO (no por el alto) para cualquier sheet ≲55% de la pantalla → ahí el
preview está en su tamaño máximo.

Las tres opciones y por qué la ganadora es "medir-y-congelar":
- `maxHeight` (alto guiado por contenido): al desplegar una sección el sheet CRECE
  → el preview se achica y se mueve hacia arriba. ❌ rompe "preview constante".
- `height` fijo en % (p.ej. `"68%"`): el preview es CONSTANTE, pero si el % es
  alto el preview queda chico y, con secciones colapsadas, sobra fondo abajo
  (gran vacío). ❌ preview chico + vacío.
- **Medir-y-congelar (actual):** estado `frozenSheetH`. Al abrir, el sheet se mide
  SIN alto fijo (content-driven) con el ScrollView interno content-sized (sin
  flex) → mide el contenido COLAPSADO; en `onLayout` se congela ese alto
  (`prev == null ? h : prev`). Luego el sheet usa `height: frozenSheetH` y el
  ScrollView pasa a `flex:1` (scroll al desplegar). ✅ preview MÁXIMO (sheet
  colapsado ≈47% < 55%) + cero vacío (sheet = alto del contenido) + preview
  constante al desplegar (alto fijo, el contenido scrollea).
**Gotchas del patrón:** resetear `frozenSheetH` a null al cerrar para re-medir,
pero el `useEffect` debe ir GUARDADO con `if (settingsGeoId == null)` o, al abrir,
pisa la altura recién medida por `onLayout` (orden effect-vs-layout) → loop. Las
dos fases (medición y congelado) tienen el MISMO alto → sin flicker.
**Why:** el preview flota absoluto encima del sheet; su única referencia es el
alto del sheet. Para tenerlo grande + constante + sin vacío hay que ajustar el
sheet al contenido colapsado y congelar ESE alto, no usar un % fijo.

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
