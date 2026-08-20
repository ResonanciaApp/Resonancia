---
name: Authenticated capacity fixture safety
description: Guardrails for repeatable authenticated load tests that write favorites, library, activity, and private messages.
---

Las pruebas de capacidad autenticadas deben usar únicamente identidades efímeras con
un identificador de corrida, preparación secuencial y limpieza que pueda
redescubrirlas y verificar su ausencia después de fallos o señales.

**Why:** una preparación concurrente puede seguir creando datos después de que una
rama fallida inicie la limpieza, dejando cuentas o filas de prueba. Las cargas con
sincronización también escriben sobre colecciones completas, por lo que nunca deben
usar cuentas reales.

**How to apply:** exigir una marca de entorno exclusiva de Development, claves de
Clerk de prueba y host local antes de crear fixtures. Mantener las credenciales solo
en el entorno del proceso hijo, usar un segundo usuario efímero como contraparte de
DM y repetir la validación de cero residuos al terminar o interrumpir una corrida.