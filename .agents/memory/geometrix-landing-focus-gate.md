---
name: Geometrix landing focus gate
description: El landing de Geometrix queda montado al salir de la pestaña; toda animación infinita ahí debe gatearse por tabFocused y cancelarse al desmontar.
---

**Regla:** cualquier componente con loops infinitos de Reanimated (`withRepeat -1`) que se renderice dentro del landing de Geometrix (overlay `showLanding`) debe (1) montarse solo con `tabFocused` y (2) tener `cancelAnimation` en el cleanup de su useEffect.

**Why:** las tabs de Expo Router quedan montadas al navegar; `showLanding` se mantiene true al desenfocar (se re-activa en focus). LandingBgGeo corría 12 loops infinitos en el hilo UI que nunca morían → lag en toda la app tras visitar Geometrix. Los loops de Reanimated sobre shared values no mueren de forma confiable con el componente si no se cancelan explícitamente.

**How to apply:** al agregar decoración animada al landing, seguir el patrón `{tabFocused && <Componente />}` + cleanup con `cancelAnimation`. Las capas del canvas ya están cubiertas vía `motion={master.motion && tabFocused}`. Nota: `ParticleField`/`Particle` en geometrix.tsx es código muerto (definido, nunca renderizado) — candidato a borrar. Posible sospechoso futuro de lag fuera de Geometrix: `SceneAnimationInline` de Inicio (withRepeat sin gate de foco).
