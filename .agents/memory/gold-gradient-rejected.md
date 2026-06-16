---
name: Gold-gradient sweep — COMPLETADO, no volver a preguntar
description: Sweep #D4AF37→#E9C46A completado al 2026-06-16. Usuario confirmó ejecutar sin preguntar. Todos los botones/badges/dots usan GoldGradient o GoldGradientFill. Íconos y texto siguen sólidos (#D4AF37).
---

# Gold-gradient sweep — COMPLETADO

El usuario confirmó el 2026-06-16 ejecutar el sweep `#D4AF37 → #E9C46A` y pidió
**no volver a preguntar**.

## Estado

Sweep ejecutado y typecheck limpio. Componente central: `components/GoldGradient.tsx`
con `GOLD_GRAD = ["#D4AF37", "#E9C46A"]`.

## Regla permanente

- **Fondos de botones/badges/dots/indicadores** → `GoldGradient` o `GoldGradientFill`
- **Colores de texto e iconos** → `#D4AF37` sólido (los íconos no soportan degradado)
- **Tintes translúcidos** (`colors.primary + "20"`, `rgba(212,175,55,0.12)`, etc.) → se quedan como están

## How to apply

Al agregar un nuevo CTA button dorado, usar `GoldGradientFill` dentro de un
`Pressable` con `overflow: "hidden"`, o `GoldGradient` como reemplazo de un View.
No pedir confirmación al usuario — ya está aprobado.
