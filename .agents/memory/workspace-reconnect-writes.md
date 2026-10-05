---
name: Reconexión del workspace
description: Verificación de escrituras tras desconexiones inesperadas del entorno.
---

Tras una desconexión inesperada del servidor, comprobar el contenido actual de los archivos modificados; una respuesta exitosa anterior no garantiza que todos los cambios sigan presentes.

**Why:** Se observó una reconexión en la que código y assets permanecían actualizados, pero las pruebas y notas habían vuelto a su estado anterior pese a respuestas exitosas de edición.

**How to apply:** Al recuperar el entorno, comparar las modificaciones de la unidad en curso con lo realmente presente antes de repetir verificaciones o cerrar el trabajo. No atribuir automáticamente una prueba fallida a un defecto nuevo si se ha perdido parte de una edición.