---
name: Geometrix live-rotation sync effect dependency
description: Por qué el useEffect que sincroniza el ángulo en vivo de Geometrix debe depender del escalar manualAngle, no de getSettings.
---

# Geometrix — sync del ángulo en vivo NO debe depender de `getSettings`

## Regla
El `useEffect` que sincroniza `liveRot`/`rotActive` con el ángulo confirmado del
objetivo debe depender del **escalar `manualAngle` de ESE objetivo**
(`targetManualAngle = rotTargetSettings?.manualAngle ?? 0`) + `pinchTargetId`,
NUNCA de `getSettings` ni del objeto `settings`.

## Why
`getSettings` es `useCallback(..., [settings])` → su referencia cambia con
CUALQUIER mutación de settings (zoom, offset, otra geometría). El gesto de pinch
corre en `Gesture.Simultaneous` junto a la rotación, así que al soltar dos dedos
`pinchGesture.onEnd` SIEMPRE commitea zoom (`commitZoom` crea objeto nuevo aunque
el valor no cambie) → `setSettings` → si el effect depende de `getSettings`, se
dispara y pisa la rotación en vuelo: pone `rotActive=0` y lee el `manualAngle`
VIEJO (el `commitAngle` de la rotación puede no estar aplicado todavía en ese
render, sobre todo si los dos `runOnJS` no se batchean). Resultado visible: la
geometría "gira rápido y vuelve a la posición / a veces cambia". El snap que se
había agregado antes solo enmascaraba esto; era un bug preexistente.

## How to apply
- Dependé del valor concreto que el effect necesita reconciliar (el escalar
  `manualAngle`), no de un callback/objeto que cambia por motivos ajenos.
- Así el swap atómico (liveRot = nuevo ángulo + rotActive=0 en el MISMO tick,
  tras el re-render con el nuevo manualAngle) sigue funcionando sin "pop", pero
  los commits de zoom/offset/otras capas ya no re-disparan el effect.
- LOS TRES effects de sync tenían el mismo bug y se arreglaron igual: rotación
  (`liveRot`/`rotActive` ← `targetManualAngle`), zoom/pinch (`livePinch`/
  `pinchActive` ← `targetZoom`) y drag (`liveDragX/Y`/`dragActive` ← `targetOffsetX/Y`).
  Los escalares se derivan UNA vez de `pinchTargetSettings = getSettings(pinchTargetId)`.
  Si tocás uno, revisá los tres: comparten el patrón y el mismo gesto físico
  (Gesture.Simultaneous) commitea los tres al soltar dos dedos.
- Patrón general en este archivo gigante: cualquier effect que escriba shared
  values de un gesto en vuelo y dependa de `settings`/`getSettings` es sospechoso
  de clobber cuando otro gesto simultáneo commitea en el mismo gesto físico.
