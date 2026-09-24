---
name: Desconexiones de PostgreSQL
description: Continuidad de la API cuando la base cierra una conexión inactiva del pool.
---

Manejar los eventos de error del pool de PostgreSQL por separado de los errores de consultas individuales; una terminación administrativa de una conexión inactiva no debería detener el proceso de la API.

**Why:** La base cerró una conexión inactiva durante el uso normal y el evento sin manejar detuvo toda la API; el Muro expansivo mostró un error de carga aunque las reflexiones persistían y las consultas anteriores respondían correctamente.

**How to apply:** Ante una caída similar, comprobar primero la disponibilidad de la API y los logs del pool antes de modificar la consulta de reflexiones. Evitar registrar el objeto entero de la conexión, que puede contener información sensible.