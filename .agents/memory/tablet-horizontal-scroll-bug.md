---
name: Null-stub de specs_DEPRECATED rompía listas horizontales en Android
description: RESUELTO — el resolutor de Metro que anula specs_DEPRECATED/components dejaba invisible/no-tappable todo ScrollView/FlatList horizontal SOLO en Android
---
Regla: el interceptor de metro.config.js que redirige `src/private/specs_DEPRECATED/components/` a un null-stub necesita EXCEPCIONES para todo componente nativo que se use de verdad. Ya excluidos: RCTModalHostView, Switch/AndroidSwitch, **AndroidHorizontalScrollContentView** (contenedor de TODO scrollable horizontal en Android), AndroidSwipeRefreshLayout, ActivityIndicatorView.

**Why:** (15-ago-2026) en la tablet Samsung todos los hijos de scrollables horizontales jamás montaban (sin onLayout, invisibles, no-tappables) — pills, carruseles, chips. iPhone OK porque iOS usa otro componente (no está en esa carpeta). Se desperdició un rebuild EAS completo + prebuild --clean creyendo que era la APK: era JS puro (Metro). Los archivos reales en node_modules estaban intactos; solo el resolutor los anulaba.

**How to apply:** si un componente nativo "renderiza nada en silencio" solo en una plataforma, revisar PRIMERO las excepciones del null-stub en metro.config.js antes de sospechar de la APK/dispositivo. Para probar: Views de color puro dentro vs fuera del contenedor sospechoso.
