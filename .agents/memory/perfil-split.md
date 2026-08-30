---
name: Perfil split
description: Perfil conserva progreso/social; /mi-perfil es el editor mínimo de Mi cuenta
---
La pestaña Perfil conserva la vista personal con identidad, progreso y contenido social. La fila de nombre/correo abre `/mi-perfil`, que es únicamente el editor “Mi cuenta”: avatar, correo, nombre, guardar y eliminar cuenta.

El acceso “Ver Perfil” del drawer debe seguir abriendo la pestaña Perfil, no el editor de cuenta.

**Why:** el usuario pidió separar la consulta del perfil de la edición de los datos básicos y evitar duplicar todo el contenido del perfil dentro del editor.

**How to apply:** contenido social/progreso pertenece a Perfil; cambios de avatar, correo/nombre y eliminación de cuenta pertenecen a “Mi cuenta”.
