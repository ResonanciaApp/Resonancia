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
- Modelo actualizado (jul 2026): SIN plan Lifetime — blend 35/65 (mensual/anual), ARPU rec $2.506 lanzamiento / $3.238 normal, sin 'lifetime boost'. Año 1 base: ingreso ~$85M, neto +$9M, break-even operacional M6, caja acumulada positiva M11, valle máximo ≈ −$8,8M (M4–M5) con marketing escalonado (costos: M1-2 $4,3M, M3-6 $4,8M, M7-8 $7,2M, M9-10 $8,2M, M11-12 $8,4M; gasto fuerte de pauta desde M9; total año $75,4M sin cambio). Escenarios: Optimista +$30M, Agresivo +$66M, Churn15% −$20M (~$55M ingreso). CAC $3.600, payback 1,1 meses; LTV/CAC 6,0x (15%) y 4,5x (20%). Valoración: ARR base $140M → $560M (4×). Estas cifras viven en 9 slides (Precios, Proyección, Finanzas1-2, CAC, Retención, Conclusión, AnexoInversion, Tramos): mover en lockstep.
- Narrativa de uso de fondos (jul 2026): la ronda ($29,938M) se gasta casi toda ANTES del M1 en construir/lanzar la app; solo $2,5M quedan para marketing desde M1. Diapo 12 (Conclusión) reescrita: "la ronda construye y lanza; la operación se autofinancia vía prepagos anuales". Nueva diapo 13 SlideContingencia: caja real M1 ~$5,0M vs $4,3M costos; línea de socios ~$6,3M solo si mix anual <50% en M1–M3 (externa a la ronda). Ojo: hojas 1–2 siguen en vista conservadora (anual mes a mes, valle −$8,8M); no confundir ambas vistas al editar.
- Marketing de la ronda $3,5M = $1M pre-lanzamiento + $1M M1 + $1M M2 + $0,5M M3 (luego M4–M6 $0 orgánico; M7+ ramp propio). Aparece en Finanzas1 (columna Marketing "—" M1–M3 con footnote), Finanzas3 (ramp + phases + footnote), CAC (footnote), Conclusión y Contingencia — mover en lockstep. Hoja 1 divide Costos ($66M ops) + Marketing ($10M) = $76M.
- Dorados del pitch (resonancia-pitch) migrados al degradado del botón "Escuchar ahora" mobile: texto dorado = backgroundImage linear-gradient(180deg,#D6A45C,#F7CB6B) + WebkitBackgroundClip text; hex sólidos/condicionales = #D6A45C; rgba(190,150,80,x) = rgba(214,164,92,x). Ya NO queda #BE9650 en las slides activas del manifest — usar el degradado para dorados nuevos.
