---
name: Tablet Android — hijos de ScrollView horizontal nunca montan
description: En la tablet Samsung del usuario, TODO contenido de ScrollView/FlatList horizontal es invisible/no-tappable; vertical y filas fijas funcionan; iPhone OK
---
Síntoma (15-ago-2026): en la tablet Samsung barata (800x1285, scale 1.5), los hijos de CUALQUIER scrollable horizontal (ScrollView, FlatList) jamás disparan onLayout ni se ven — incluso Views de color puro sin estilos. Filas fijas (flexDirection row) idénticas sí se ven. Afecta pills de duración, carruseles, chips de Biblioteca, VideoCards. iPhone con el mismo JS funciona.

Descartado: datos vacíos, MaskedView, RTL, collapsable={false}, wrapper único no colapsable, removeClippedSubviews={false}, FlatList vs ScrollView. No es JS: es el componente nativo HorizontalScrollView de Fabric en esa APK/dispositivo.

Estado: deps verificadas sanas (expo 54.0.36, RN 0.81.5, expo-asset 12.x pineado); la APK del 15-ago (2b8e33fc) ya era de árbol limpio y aun así falla. Último intento: `expo prebuild -p android --clean` (android/ podía venir del período híbrido SDK57) + rebuild EAS (build 9d23f6a2). Si la APK nueva sigue mal → es bug de Fabric específico del dispositivo; opciones restantes: bump RN a 0.81.6, o workaround global reemplazando scrollables horizontales (reanimated 4 impide desactivar New Arch).

Diagnósticos temporales pendientes de limpiar cuando se resuelva: filas de cuadritos de colores + logs [diag] en inicio8.tsx, BibliotecaScreen.tsx, _layout.tsx.

**How to apply:** si reaparecen "secciones invisibles" solo en Android barato, sospechar esto primero; probar con Views de color dentro/fuera de un scrollable horizontal.
