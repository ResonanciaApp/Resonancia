---
name: Private object reference grants
description: Regla de autorización para convertir rutas privadas de Object Storage en contenido compartido o público.
---

Una referencia de base de datos a `/objects/...` nunca debe convertirse por sí
sola en un permiso de lectura. Antes de guardar, compartir o publicar esa ruta,
el servidor debe comprobar que el upload pertenece al actor, que ya es público,
o que el actor tiene un rol editorial autorizado. En lectura, las relaciones
también deben unir la referencia con el propietario real del upload.

**Why:** Si avatar, chat o contenido publicado conceden acceso sólo por guardar
una cadena, un usuario puede copiar la ruta privada ajena y crear su propio
permiso o hacer público el archivo.

**How to apply:** Cualquier nueva función que acepte una ruta privada debe
validarla al escribir y volver a validar propiedad al cruzar una transición a
contenido público. Las rutas antiguas sin dueño verificable fallan cerradas;
una ACL explícita válida puede conservar compatibilidad.