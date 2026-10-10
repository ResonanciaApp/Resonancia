---
name: Conectividad de la app en desarrollo
description: Distinguir la disponibilidad de la API de la del servidor de Expo al diagnosticar fallos de conexión del teléfono.
---

No considerar recuperada la conexión del teléfono solo porque la API responde o el workflow de Expo aparece activo.

**Why:** Se observó un servidor de Expo marcado como activo que no respondía a peticiones HTTP, mientras la API y su comprobación de base de datos funcionaban. El estado del proceso no acreditaba disponibilidad.

**How to apply:** Comprobar por separado la API y el servidor de Expo, tanto localmente como a través del dominio usado por la app. Identificar qué servicio falla antes de reiniciar servicios o cambiar configuración; distinguir disponibilidad HTTP de compilación terminada y de una prueba real en el teléfono.
