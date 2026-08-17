---
name: Racha canónica en utils/stats
description: Fuente única del cálculo de racha/semana y regla de dependencia useDayRollover
---
Regla: TODO cálculo de racha/semana importa de `mobile/utils/stats.ts` (GOAL_MINUTES=3; día activo = ≥3 min sumados por día local O ≥1 sesión con completed:true; racha actual con fallback a ayer si hoy no cumple; maxStreak encadena claves de calendario local — nunca diferencias de timestamps, que se rompen con DST).

**Why:** había 7+ implementaciones divergentes (presencia-de-evento vs umbral de 5 min) y el número de racha cambiaba según la pantalla; unificado a la meta diaria (desde ago 2026: 3 min o sesión completada) que coincide con la meta del fuego.

**How to apply:** cualquier useMemo que use estos helpers debe depender de `[statEvents, todayKey]` con `todayKey = useDayRollover()` (hooks/useDayRollover.ts) — sin eso, una pantalla montada pasa medianoche mostrando la racha de ayer. `computeActiveDays` sigue siendo presencia-de-evento (estadística de uso, no racha). Legacy sin migrar: WeeklyStreakStrip4.tsx (sin referencias).
