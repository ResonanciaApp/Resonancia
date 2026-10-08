---
name: Descripción de Mi cuenta en Perfil
description: Sustitución de la píldora bajo el usuario por una descripción editable desde Mi cuenta.
---

La descripción opcional se guarda desde Editar detalles y desaparece al borrar el texto; su vista previa en Perfil conserva un máximo de dos líneas. La píldora de etapa añadida después sobre el lema es independiente.

**Why:** El usuario pidió explícitamente reemplazar la píldora por una descripción propia editable en Mi cuenta, que solo se refleje en Perfil después de guardar.

**How to apply:** Mantener separado el borrador del texto guardado y permitir guardar cambios de descripción aunque el nombre no cambie. No mostrar un texto ficticio cuando la descripción esté vacía. El correo fue retirado del formulario por petición expresa del usuario; no recuperarlo por expectativas antiguas.

«Lema de vida» pertenece al bloque de identidad de Perfil, debajo del nombre y antes de la descripción, no debajo del título del formulario de edición.

**Why:** El usuario confirmó esta ubicación al aclarar a qué «título» se refería. También reemplazó el límite de dos líneas del editor por un máximo de 300 caracteres.

**How to apply:** Guardar el lema con los otros cambios del formulario, conservarlo al reabrir y ocultarlo al vaciarlo. Distinguir el límite de caracteres del editor de la vista previa de la descripción en Perfil.

Guardar en el editor cierra la ventana como la X, pero solo después de confirmar la escritura local. Un fallo conserva el borrador y permite reintentar.

**Why:** El usuario pidió cerrar «cuando se guarda», no al iniciar una actualización optimista. Esperar una animación o un tiempo estimado no confirma que los datos estén persistidos.

**How to apply:** Usar confirmación de almacenamiento para el guardado explícito, sin cambiar por defecto las actualizaciones optimistas de otros controles. Compartir el cierre con la X y evitar una segunda navegación si el usuario ya cerró mientras se guardaba.

Todos los cambios de Editar detalles, incluidos avatar editorial y foto personal, son borradores hasta Guardar. La X pide confirmación si hay cambios; continuar editando los conserva y descartar sale sin aplicar el borrador.

**Why:** El usuario señaló que elegir un avatar también debe activar Guardar y poder descartarse, igual que editar un campo. Persistir o sincronizar una elección desde el selector haría imposible respetar ese descarte.

**How to apply:** Separar la vista previa del perfil guardado y no actualizar la nube al elegir una imagen. Validar la disponibilidad editorial al guardar y mantener sin cambios el perfil confirmado si esa validación falla.