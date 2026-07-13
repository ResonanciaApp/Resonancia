---
name: SceneAnimationInline focus gate
description: SceneAnimationInline usa withRepeat por cada capa activa de la escena; sin gating de foco las animaciones corren en background incluso en otras tabs.
---

## Regla

`SceneAnimationInline` debe recibir `paused={!tabFocused}` desde cualquier tab que la monte.

**Why:** Las tabs de Expo Router quedan montadas permanentemente. Si el usuario tiene una escena asignada (`bgScene != null`), cada capa activa (rot, pulse, fade) tiene un `withRepeat(-1)` corriendo a 60fps en el hilo UI. Sin el gate de foco, esto ocurre aunque el usuario esté en Geometrix u otra tab → lag acumulativo ("empeora con el tiempo").

**How to apply:**
1. En el componente padre (tab), añadir:
   ```ts
   const [tabFocused, setTabFocused] = useState(false);
   useFocusEffect(useCallback(() => {
     setTabFocused(true);
     return () => setTabFocused(false);
   }, []));
   ```
2. Pasar `paused={!tabFocused}` a cada `<SceneAnimationInline>`.
3. La prop `paused` en `SceneAnimationInline` override el `motion` del JSON: `const motion = !paused && (master.motion !== false)`.
4. Los `useEffect` de `AnimatedLayer` ya tienen `cancelAnimation` en cleanup — al cambiar `motion` de true→false, el effect se re-ejecuta y cancela los loops.

## Patrón aplicado en

- `artifacts/mobile/app/(tabs)/inicio8.tsx` — dos instancias de `SceneAnimationInline` (header inline + modo inmersivo)
