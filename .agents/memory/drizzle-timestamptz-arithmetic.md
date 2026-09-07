---
name: Drizzle y aritmética timestamptz
description: Evita errores de tipo PostgreSQL al combinar fechas parametrizadas por Drizzle con intervalos.
---

Al usar fragmentos SQL de Drizzle para comparar una columna `timestamp with time zone` contra una fecha calculada, pasar un objeto `Date` interpolado puede generar una expresión que PostgreSQL termina resolviendo como `timestamp <= interval`.

**Why:** El typecheck no detecta este problema y la consulta falla recién al ejecutar la ruta. Convertir la fecha a ISO y añadir `::timestamptz` dentro del fragmento SQL hizo explícito el tipo correcto.

**How to apply:** En aritmética temporal escrita con `sql`, castear explícitamente el parámetro de fecha a `timestamptz` antes de sumar o restar intervalos y validar al menos una vez la rama SQL real, no solo la inserción inicial.