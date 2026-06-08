---
name: Card/module background standard color
description: El color estándar de fondo de cards y módulos en la app mobile
---

# Fondo estándar de cards y módulos

El color de fondo de TODA card/módulo en RESONANCIA es el tinte dorado translúcido `rgba(190,150,80,0.05)` (= `#BE9650` al 5%) sobre el bg oscuro `#0B0F14`. Visualmente = el fondo de la card "Nueva composición" del mockup Geometrix.

**Why:** El usuario lo definió explícitamente como "el color que siempre tiene que usar" para cards/módulos, reemplazando el navy sólido `#151A23` anterior. Es sutil y cálido, deja respirar el fondo.

**How to apply:**
- Token central en `artifacts/mobile/constants/colors.ts`: `card` y su alias `darkChocolate` ya apuntan a este valor. Consumir vía `useColors().card` siempre que se pueda.
- MUCHAS pantallas hardcodean el fondo de card sin usar el token (sobre todo `rgba(255,255,255,0.03)` ~78 sitios y `#151A23` ~12 sitios). NO migrar a ciegas: `rgba(255,255,255,0.03)` también se usa para separadores, overlays y pills inactivas (no son cards). Migrar caso por caso al tocar cada pantalla, solo donde es realmente fondo de card/módulo.
- Es translúcido a propósito (se ve bien sobre bg oscuro y sobre fondos de geometría).
