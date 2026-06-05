---
name: Slide decks
description: Los tres artifacts de slides del proyecto y para qué sirve cada uno
---

El proyecto tiene tres artifacts de tipo `slides`, con propósitos distintos:

- **resonancia-deck** — "RESONANCIA — Brochure": presentación del producto
  (qué es la app, su experiencia). Es el deck de referencia estética.
- **resonancia-pitch** — "RESONANCIA — Pitch Inversionistas": deck para
  levantar inversión (problema, mercado, competencia, modelo, inversión).
- **resonancia-plantilla** — "RESONANCIA — Invitación": deck corto (7 slides)
  de invitación a conversar con inversionistas (tono cálido, NO pitch de
  venta). Reusa el slug interno `resonancia-plantilla` (antes era una
  plantilla de modelo de negocios) porque se alcanzó el tope de 7 artifacts.
  Slide 7 tiene placeholders de contacto [tu correo]/[tu teléfono].

**Por qué:** son audiencias y mensajes diferentes; no fusionarlos ni reusar
uno como el otro. Si el usuario pide cambios a "las slides", preguntar a cuál
deck se refiere.

**Cómo aplicar:** todos comparten la paleta navy+dorado e imágenes de marca
(hero-atmosphere.png, mockups de la app) y la fuente Space Grotesk. Los slides
hardcodean los hex inline (no usan CSS vars). Las cifras propias confirmadas
por el usuario (NO inventar otras): +1.000.000 seguidores, 180 pistas,
$6.900/mes, ARPU neto ≈$3.300, +580M hispanohablantes. Las cifras de mercado
del pitch son reales y citadas (Grand View Research, OPS/Banco Mundial,
Business of Apps).
