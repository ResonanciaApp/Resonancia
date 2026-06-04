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

**Modelo acordado (jun 2026):** ronda US$30.000 ($27M CLP, TC $900) = upfront pre-mes 1 ~$17M (contenido, equipos, marketing lanzamiento, legal, ASO) + runway operativo valle meses 1–3 ~$7,9M + colchón ~$2,1M. Equity ~3,0% (US$30K ÷ post-money US$1,005M; pre-money US$975K).

**Embudo de conversión (jun 2026, aprobado):** 1.000.000 seguidores → 20% instala (200.000 free) → 5% convierte (10.000 premium orgánico) → base M12 = 12.000 (10.000 orgánico + ~2.000 marketing). ARPU neto $3.300/mes (post IVA 19% + tienda 30%). Escenarios = **Base 12.000 / Optimista 15.000 / Agresivo 25.000** (NO hay columna "Conservador 10.000"; el 10K orgánico se muestra como composición del base). Ramp base: M1-0,M2-500,M3-1.500,M4-2.800,M5-4.300,M6-6.000,M7-7.500,M8-8.900,M9-10.000,M10-11.000,M11-11.600,M12-12.000. Ingreso anual base ~$251M CLP, neto +$168M; break-even mes 7.

**Fórmulas escenarios (Anexo valoración):** ARR neto = subs × $3.300 × 12 / 900 (US$); valoración = múltiplo × ARR; stake = 3% × valoración; retorno = stake / US$30K (= valoración en US$M). Múltiplos = elección de mercado (NO cálculo), ancla = "Calm valuó ~4–8× ARR en rondas tempranas". Múltiplos actuales **4×/5×/6×** (Base/Opt/Agr) → valoración US$2,1M/3,3M/6,6M, stake US$63K/99K/198K, retorno 2,1×/3,3×/6,6×. (Antes eran 6/7/8× → 3,2M/4,6M/8,8M; el usuario los bajó a un término medio.)

**Why:** los sueldos ($3,65M/mes, gerente $2M incl.) se pagan en EFECTIVO desde el mes 1 → US$25.000 no alcanzaba (uso real ~US$27.700). El deck tenía dos historias contradictorias del mismo dinero ("se gasta en crear/lanzar" vs "es runway que cubre pérdidas"); se reconcilió como upfront + runway + colchón.

**How to apply:** al tocar cualquier número financiero, grep el set legacy (monto viejo, equity viejo, montos de stake) en `pages/slides/*.tsx` antes de cerrar; correr typecheck + validate-slides; screenshot de inversión/valoración/valle.
