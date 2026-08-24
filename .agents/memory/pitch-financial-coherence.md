---
name: Pitch deck financial coherence
description: Las cifras del modelo financiero del pitch viven repartidas en muchas slides y deben moverse en lockstep
---

# Coherencia financiera del pitch (resonancia-pitch)

Las cifras del modelo financiero NO están centralizadas: están hardcodeadas inline (vw/vh, hex inline, sin CSS vars ni constantes compartidas) repartidas en varias slides. Un cambio en tamaño de ronda, equity, valoración o uso de fondos debe propagarse a TODAS o las slides se contradicen entre sí.

**Why:** el deck ya tuvo dos historias contradictorias del mismo dinero (el uso de fondos contado "se gasta en crear/lanzar" en una slide vs "es runway que cubre pérdidas" en otra). Se reconcilió como un único reparto: **upfront (pre-mes 1) + runway operativo (valle meses 1–3) + colchón**, que debe sumar el total de la ronda.

## Dónde viven los números (mover en lockstep)

- `Slide11Inversion.tsx` — monto de ronda + uso de fondos línea por línea (`% · US$`). Los % deben sumar 100% y los US$ el total de la ronda. El upfront aquí = suma de las líneas pre-lanzamiento (contenido + equipos + marketing + legal); runway y colchón deben coincidir exactamente con los de `SlideValleDeCaja`.
- `SlideAnexoInversion.tsx` — valoración pre/post-money, equity %, ticket, y 3 escenarios (Base/Optimista/Agresivo).
- `SlideValleDeCaja.tsx` — reparto de la ronda en 3 buckets (upfront + runway + colchón) + valle acumulado meses 1–3. **La pérdida acumulada del valle ES la cifra autoritativa del runway**; el colchón es el resto. Si el valle cambia, runway/colchón cambian en ambas slides.
- `SlideFinanzas1/2/3.tsx` — footnote/KPI "inversión inicial", desglose de costos fijos/contenido/marketing por fase.
- `SlideProyeccion.tsx` — escenarios + "recuperación de la inversión (mes N)".

## Fórmulas (no inventar, recalcular)

- **Equity:** `equity% = ronda / post-money`; `pre-money = post-money − ronda`. Bajar el post-money = dar más equity por el mismo ticket.
- **Retorno por escenario:** `stake_M12 = equity% × valoración_M12`; `múltiplo = stake_M12 / ronda`.
- **Valoración M12:** `ARR neto = subs_M12 × ARPU_neto × 12` (en US$ con TC); `valoración = múltiplo_ARR × ARR`. Los múltiplos ARR son **elección de mercado, no cálculo** (ancla: "Calm valuó ~4–8× ARR en rondas tempranas").
- **Trampa clave (la que motivó el último ajuste):** si el post-money es mayor que la valoración M12 del caso base, el retorno base cae por debajo de 1× (el inversor pierde en su propio caso conservador) → señal de ronda sobrevalorada. Fix = dar más equity (bajar post-money), no subir múltiplos.

## Otros invariantes

- Los sueldos del equipo se pagan en EFECTIVO desde el mes 1 (no hay equity-for-salary), así que el runway debe cubrir el valle completo hasta flujo positivo.
- ARPU neto = precio usuario − IVA 19% − comisión tienda 30%. IVA/ARPU/mezcla de planes son estables; no se tocan al ajustar escenarios.

## How to apply

Al tocar cualquier número financiero: (1) grep el set legacy (monto viejo, equity viejo, valores de stake/valoración) en `pages/slides/*.tsx` y en las `description` de `data/slides-manifest.json`; (2) recalcular con las fórmulas de arriba; (3) `pnpm --filter @workspace/resonancia-pitch run typecheck` + `run validate-slides`; (4) screenshot de las slides de inversión/valoración/valle para verificar visualmente.

- Nuevas slides derivadas (jul 2026): SlideCAC.tsx (CAC ≈$3.600 = marketing año 1 ≈$13M ÷ 3.600 subs; payback 1,2 meses con ARPU $3.116) y SlideRetencion.tsx (sensibilidad churn 0/5/8%, LTV=ARPU÷churn, LTV/CAC 17x/11x). Si cambian el ramp-up de marketing, los 300 subs/mes o el ARPU, estas dos slides quedan incoherentes: recalcular.
- SlideRetencion usa churn 15%/20% (subs M12 ≈1.720/≈1.400, LTV/CAC 5,8x/4,3x) y SlideFinanzas2 tiene fila 'Churn 15%' (~$69M ingreso, −$7M neto). Derivan de 300 subs/mes + ARPU $3.116 + costos $75,4M año: recalcular en lockstep si cambian.
- Modelo canónico (ago 2026): SIN Lifetime; ARPU rec $2.506 M1 / $3.238 M2+. Fijo post-lanzamiento $2,58M/mes según presupuesto confirmado; contenido estable $0,45M/mes; marketing operativo M7–12 = $1M/$1M/$1,8M/$1,8M/$2M/$2M. Año 1: ingresos $84,7M, costos no marketing $36,36M, marketing operativo $9,6M, neto +$38,8M; valle conservador −$3,5M M3, primer mes en equilibrio M4 y recuperación acumulada M6. Escenarios: Optimista +$60,0M, Agresivo +$95,0M, Churn15% +$9,0M. **Why:** el usuario reemplazó el presupuesto anterior con valores operacionales explícitos y fijó contenido en $450 mil mensuales. **How to apply:** derivar tablas y conclusiones del modelo compartido; no reintroducir totales mensuales manuales.
- Narrativa de fondos (ago 2026): ronda $29,938M; runway de equipo reducido pre-lanzamiento = 3 meses × $1,596M = $4,788M, distinto de la estructura completa post-lanzamiento de $2,58M/mes. $27,438M se despliegan hasta lanzar y $2,5M quedan reservados para marketing M1–M3. Caja real M1 ~$5,0M vs $3,03M de operación+contenido; contingencia de socios ~$1,0M si mix anual <50%. **Why:** mantener 4 meses hacía que el runway no multiplicara al total y el presupuesto excediera la ronda. **How to apply:** etiquetar siempre “equipo reducido pre-lanzamiento” versus “operación completa post-lanzamiento”.
- Marketing de la ronda $3,5M = $1M pre-lanzamiento + $1M M1 + $1M M2 + $0,5M M3; M1–M3 se marca “Ronda” y se excluye del P&L operativo. Marketing M7–M12 = $9,6M y sí entra al P&L. **Why:** mezclar ambas capas duplicaba marketing y volvía incoherentes los resultados. **How to apply:** CAC usa los $13,1M completos; flujo operativo usa solo $9,6M.
- Lámina de inversión acotada (ago 2026): la diapositiva visible de inversión usa el presupuesto entregado de $13,4M (contenido $3,5M, marketing $3M, runway rotulado 4 meses $1,95M, externos $1,2M, equipamiento $3,1M, otros $0,65M). **Why:** el usuario pidió actualizar solo esta lámina y retiró varios campos; no se debe inferir que sustituye los supuestos del P&L mensual. **How to apply:** conservar sus cifras literalmente en la lámina hasta que se solicite una reconciliación global.
- Tramos de inversión aprobados (ago 2026): $3M/2%, $6M/4,5%, $8M/6,5% y tramo lead $13,4M/12%. Caso base M12 ilustrativo ~$560M: stakes ~$11,2M/$25,2M/$36,4M/$67,2M y retornos 3,7x/4,2x/4,5x/5,0x. **Why:** el tramo máximo anterior de $10M no cerraba la ronda objetivo de $13,4M. **How to apply:** mostrar siempre los términos como estimativos y sujetos a acuerdo definitivo.
- Dorados del pitch (resonancia-pitch) migrados al degradado del botón "Escuchar ahora" mobile: texto dorado = backgroundImage linear-gradient(180deg,#D6A45C,#F7CB6B) + WebkitBackgroundClip text; hex sólidos/condicionales = #D6A45C; rgba(190,150,80,x) = rgba(214,164,92,x). Ya NO queda #BE9650 en las slides activas del manifest — usar el degradado para dorados nuevos.
