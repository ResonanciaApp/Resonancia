---
name: Recientes / Nuevas Sesiones ordering
description: Cómo deben ordenarse y refrescarse las listas "más recientes / nuevas" para que una sesión nueva de DB salga primera
---

# Listas "más recientes / nuevas" en mobile

Regla: las superficies que muestran "lo más nuevo" (inicio "Las más recientes",
carrusel "Escuchados recientemente", pantalla `/nuevas-sesiones`) deben:

1. Ordenar por `parseInt(id)` **descendente** (id mayor = más nueva), NO por
   orden del array ni `.reverse()`.
2. Recalcular con dependencia en `version` de `useCatalog()`.

**Why:** las sesiones subidas por admin viven en la DB y se insertan en runtime
con `SESSIONS.push(...)` (al final) durante `applyCatalogSnapshot`. Una lista
calculada con deps `[]`, o un `const` a nivel de módulo (calculado al importar,
antes de la hidratación), no las incluye ni las pone primeras. `.reverse()`
depende del orden del array, que es frágil.

**How to apply:** al tocar cualquier lista de "recientes/nuevas", usar
`React.useMemo(() => [...SESSIONS].sort((a,b)=>parseInt(b.id)-parseInt(a.id))..., [version])`
con `const { version } = useCatalog()`. Cuidado: una sección titulada "Las más
recientes" llegó a renderizar por error un shuffle aleatorio (`recommended`).
