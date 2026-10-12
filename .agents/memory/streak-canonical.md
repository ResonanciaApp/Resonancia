---
name: Racha canónica en utils/stats
description: Fuente única del cálculo de racha/semana y regla de dependencia useDayRollover
---

Los textos de Sistema de rachas son editoriales, pero cada card conserva su identidad de racha: actual, acumulada, más larga y completadas. Editar sus títulos o explicaciones no redefine el cálculo.

**Why:** El usuario quiere administrar las explicaciones desde Admin y verlas en la app, no cambiar las reglas de actividad mediante texto libre.

**How to apply:** Conservar IDs e iconos al editar, no identificar métricas por el título visible y mantener el último contenido publicado ante una caída de red.
Regla: TODO cálculo de racha/semana importa de `mobile/utils/stats.ts` (GOAL_MINUTES=3; día activo = ≥3 min sumados por día local O ≥1 sesión con completed:true; racha actual con fallback a ayer si hoy no cumple; maxStreak encadena claves de calendario local — nunca diferencias de timestamps, que se rompen con DST).

**Why:** había 7+ implementaciones divergentes (presencia-de-evento vs umbral de 5 min) y el número de racha cambiaba según la pantalla; unificado a la meta diaria (desde ago 2026: 3 min o sesión completada) que coincide con la meta del fuego.

Notas relacionadas:
- [Reconciliación servidor/local y hook único de UI](usestreak-unified.md).
- [Autoridad del servidor y compatibilidad de generación Orval/Zod](server-streak-endpoint.md).

**How to apply:** cualquier useMemo que use estos helpers debe depender de `[statEvents, todayKey]` con `todayKey = useDayRollover()` (hooks/useDayRollover.ts) — sin eso, una pantalla montada pasa medianoche mostrando la racha de ayer. `computeActiveDays` sigue siendo presencia-de-evento (estadística de uso, no racha). Legacy sin migrar: WeeklyStreakStrip4.tsx (sin referencias).
