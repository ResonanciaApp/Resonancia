---
name: Chip row layout shift on select
description: Cambiar fontWeight al seleccionar un chip ensancha el elemento y empuja los chips adyacentes a la derecha.
---

## Regla

En chips animados con `translateX` (selección+fade), el `fontWeight` del texto **no debe cambiar** entre el estado normal y seleccionado. Solo cambiar el color es seguro.

**Why:** Un cambio de peso de fuente (ej. 500→700) modifica el ancho del chip en el layout nativo antes de que `useNativeDriver: true` pueda ocultarlo. Los chips a la derecha se desplazan visualmente durante el fade-out, aunque su propio `opacity` esté animando hacia 0.

**How to apply:**
- `chipText`: definir el peso final (ej. `fontWeight: "600"`) en el estado base.
- `chipTextSel`: solo `{ color: "..." }`, sin `fontWeight`.
- Si se necesita resaltar visualmente el seleccionado, hacerlo con color de fondo (LinearGradient/backgroundColor) o color de texto, nunca con peso.

## Referencia de implementación correcta (categorías)

```ts
chipText:    { fontSize: 13, fontWeight: "600", color: TEXT },
chipTextSel: { color: "#1B060F" },            // sin fontWeight
```

## Contexto adicional: ScrollView del chip row

El chip row horizontal debe tener `paddingHorizontal` en `contentContainerStyle` (no en el View padre). Si el padre tiene `paddingHorizontal` y el ScrollView no, iOS puede ajustar el `contentInset` al cambiar `scrollEnabled`, causando un desplazamiento adicional. Estructura correcta:

```tsx
// Padre: sin paddingHorizontal
<View style={styles.stickyHeader}>
  // Fila título: paddingHorizontal en su propio style
  <View style={[styles.headerRow, { paddingHorizontal: H_PAD }]}>...</View>
  // Chip row: paddingHorizontal en contentContainerStyle del ScrollView
  <ScrollView contentContainerStyle={{ paddingHorizontal: H_PAD, ... }}>
    {chips}
  </ScrollView>
</View>
```
