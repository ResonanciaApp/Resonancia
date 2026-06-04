---
name: Pitch deck financial coherence
description: Las cifras del modelo financiero del pitch viven repartidas en muchas slides y deben moverse en lockstep
---

# Coherencia financiera del pitch (resonancia-pitch)

Las cifras del modelo financiero NO están centralizadas: viven hardcodeadas inline (vw/vh, hex inline, sin CSS vars) repartidas en varias slides. Un cambio en el tamaño de ronda, equity o uso de fondos debe propagarse a TODAS o las slides se contradicen entre sí.

Slides que comparten números del modelo:
- `Slide11Inversion.tsx` — monto de ronda + uso de fondos (% · US$ por línea, deben sumar 100% y el total de la ronda)
- `SlideAnexoInversion.tsx` — valoración pre/post-money, equity %, ticket, y 3 escenarios (stake = equity% × valoración M12; retorno = valoración/post-money)
- `SlideValleDeCaja.tsx` — reparto de la ronda: upfront + runway operativo + colchón (debe sumar el total)
- `SlideFinanzas1.tsx` / `SlideFinanzas2.tsx` — footnote/KPI "inversión inicial"
- `SlideFinanzas3.tsx` — marketing ramp M1–2 "cubierto por..." referencia el monto upfront
- `SlideProyeccion.tsx` — "recuperación de inversión inicial (US$...)"

**Modelo acordado (jun 2026):** ronda US$30.000 ($27M CLP, TC $900) = upfront pre-mes 1 ~$17M (contenido, equipos, marketing lanzamiento, legal, ASO) + runway operativo valle meses 1–3 ~$7,9M + colchón ~$2,1M. Equity ~3,0% (US$30K ÷ post-money US$1,005M; pre-money US$975K). Retornos por escenario = valoración M12 / post-money.

**Why:** los sueldos ($3,65M/mes, gerente $2M incl.) se pagan en EFECTIVO desde el mes 1 → US$25.000 no alcanzaba (uso real ~US$27.700). El deck tenía dos historias contradictorias del mismo dinero ("se gasta en crear/lanzar" vs "es runway que cubre pérdidas"); se reconcilió como upfront + runway + colchón.

**How to apply:** al tocar cualquier número financiero, grep el set legacy (monto viejo, equity viejo, montos de stake) en `pages/slides/*.tsx` antes de cerrar; correr typecheck + validate-slides; screenshot de inversión/valoración/valle.
