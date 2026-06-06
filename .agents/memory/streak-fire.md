---
name: Streak fire animation (NotificationBell)
description: Product decisions behind the home-screen streak/fire indicator and its trigger semantics
---

# Racha (fuego) en el ícono superior derecho del Inicio

El ícono del Inicio (`components/NotificationBell.tsx`) es el indicador de racha.

**Definición de la racha (decisión de producto del usuario):**
- "Completar la racha del día" = escuchar al menos `GOAL_MINUTES` (hoy 5) ese día.
- La racha cuenta días consecutivos que alcanzan la meta, cerrando en hoy o ayer.
- Los minutos salen de `statEvents` de PlayerContext (`minutes` por evento), NO de
  position/elapsed (ver `listen-time-stats.md`).

**Comportamiento visual (confirmado por el usuario):**
- Fuego en reposo = atenuado (opacidad 0.2).
- El número NO se muestra normalmente; aparece SOLO con la animación.
- Animación: fuego se enciende (0.2→1 + pulso de escala) y el número del día aparece
  directo (sin progresión 1→N); fade-in y fade-out sincronizados (fuego+número en el
  mismo Animated.parallel), se mantiene ~2s y luego ambos quedan atenuados (0.2).
- Trazo de píldora blanco rodea fuego+número; comparte fireOpacity (se atenúa igual).
- La animación se dispara **una sola vez por día**, la primera vez que se abre el Inicio
  ya cumplida la meta del día. Gating: AsyncStorage `@resonance_streak_anim_date`
  (día) + un ref de sesión.

**Why:** el usuario quería celebrar el cumplimiento diario sin un badge siempre
visible; eligió meta por minutos (como otras apps) y disparo único al entrar.

**How to apply:** si se cambia la meta, ajustar `GOAL_MINUTES`. El disparo va por
`useFocusEffect` del tab Inicio (NotificationBell está montado ahí); cambios en stats
en vivo pueden adelantar el momento exacto del disparo, pero las guardas evitan
re-disparos el mismo día.
