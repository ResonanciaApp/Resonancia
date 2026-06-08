---
name: Modal bottom sheet rounded corners (iOS)
description: Cómo evitar que las esquinas redondeadas de un bottom sheet aparezcan cuadradas/solapadas en iOS.
---

## Regla

Un bottom sheet dentro de `<Modal transparent>` necesita:

1. **Container `flex: 1, justifyContent: "flex-end"`** — posiciona el sheet al fondo sin depender del backdrop como spacer.
2. **Backdrop como `StyleSheet.absoluteFill`** — cubre la pantalla COMPLETA incluyendo la franja de las esquinas redondeadas del sheet.

```jsx
<Modal transparent animationType="slide">
  <View style={{ flex: 1, justifyContent: "flex-end" }}>
    <Pressable
      style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.55)" }]}
      onPress={onClose}
    />
    {/* previewWrap u otros absolute children aquí */}
    <View style={styles.sheet}>...</View>
  </View>
</Modal>
```

**Por qué:** el patrón incorrecto usa `sheetBackdrop: { flex: 1 }` que solo ocupa el espacio **por encima** del sheet. Las esquinas cortadas por `borderRadius` caen en la franja del sheet (no cubierta por el backdrop flex:1), dejando visible el contenido de la pantalla principal sin overlay — aparecen como esquinas cuadradas blancas/claras.

**Cómo aplicar:** todo bottom sheet con `borderTopRadius` dentro de Modal transparent debe usar este patrón. El `absoluteFill` en el backdrop garantiza cobertura sin importar la altura del sheet.

## Qué NO funciona

- `borderRadius` en `LinearGradient` con `absoluteFill` — puede generar artefactos blancos en esquinas (redundante si el parent tiene `overflow: "hidden"`).
- Wrapper `<View style={{ flex: 1, backgroundColor: "transparent" }}>` — no corrige el problema del backdrop.
- `animationType="none"` — evita el problema de animación pero no del backdrop incompleto.
