---
name: Geometrix landing focus gate
description: El landing de Geometrix queda montado al salir de la pestaña; toda animación infinita ahí debe gatearse por tabFocused y cancelarse al desmontar.
---

**Regla:** cualquier loop infinito de Reanimated (withRepeat) o frame callback (useFrameCallback) dentro de GeometrixCarousel o componentes del landing debe gatearse por `tabFocused` y cancelarse/detenerse al perder foco.

**Why:** las tabs de Expo Router quedan montadas al navegar. Dos fuentes de lag confirmadas:
1. `LandingBgGeo` corría 12 loops infinitos withRepeat (ya eliminado el componente).
2. `useFrameCallback` en `GeometrixCarousel` (auto-scroll de borde al arrastrar) corría 60fps en el hilo UI sin parar → lag persistente en toda la app. Fix: `const cb = useFrameCallback(...)` + `useEffect(() => { cb.setActive(tabFocused); }, [tabFocused])`. `tabFocused` se pasa como prop al carousel.

**How to apply:** al agregar animaciones o frame callbacks en cualquier componente que viva montado en una tab de Expo Router, gatear con tabFocused. Los loops de Reanimated sobre shared values no mueren al desmontar si no se cancelan explícitamente. `useFrameCallback` arranca activo por defecto; hay que llamar `setActive(false)` explícitamente. Nota: `ParticleField`/`Particle` en geometrix.tsx es código muerto — candidato a borrar. Posible sospechoso futuro: `SceneAnimationInline` de Inicio (withRepeat sin gate de foco).
