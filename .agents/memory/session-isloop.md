---
name: Session-level isLoop
description: Loop infinito a nivel sesión (DB) y cómo se combina con el Set hardcodeado LOOP_SESSIONS
---

La columna `is_loop` de `catalog_sessions` marca loop infinito a nivel sesión (distinta del isLoop por audio).

**Regla:** en mobile, loop = `session.isLoop === true || LOOP_SESSIONS.has(id)`. En `applyCatalogSnapshot` fase 1 (bundles) solo se asigna si el remoto viene `true` — no clobbear a false las sesiones que loopean por el Set (20/21/22/27).

**Why:** las filas DB de sesiones bundleadas nacieron con default false; si el snapshot pisara con false, las sesiones loop existentes dejarían de loopear.

**How to apply:** cualquier UI/endpoint nuevo que edite sesiones debe exponer isLoop (PATCH /catalog/submissions/:id lo acepta); el admin puede crear como `draft` pasando `status:"draft"` en POST /catalog/submissions (solo rol admin).
