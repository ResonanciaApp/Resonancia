---
name: Biblioteca y navegación desde el menú
description: Biblioteca conserva su overlay y sus retornos internos, pero el menú estilo X se cierra al elegirla.
---

Biblioteca conserva su superficie de overlay, pero al seleccionarla desde el menú se prepara dentro de la pantalla frontal que vuelve a su sitio. El menú se cierra y no debe reaparecer al regresar de un detalle.

**Why:** El pedido del drawer estilo X sustituyó la regla anterior de mantener el menú abierto debajo de Biblioteca.

**How to apply:** No convertir Biblioteca en una ruta solo para este efecto. Las aperturas desde otros orígenes mantienen sus transiciones normales y la tab bar queda oculta bajo la superficie completa de Biblioteca.

Los detalles de playlists y carpetas deben conservar el origen y el tab de Biblioteca. En iPhone, Biblioteca debe permanecer quieta y montada al abrir esos detalles: solo se desplaza la nueva ventana desde la derecha. Las rutas heredadas que retiran Biblioteca deben montarla antes de volver. La edición de una mezcla se superpone a Biblioteca y, al regresar, cierra solo esa capa; no forzar el tab Mezclas.

**Why:** Retirar el detalle antes de restaurar Biblioteca produce una vista intermedia de la tab inferior; fijar un tab cambia la selección del usuario.

**How to apply:** Distinguir los detalles que reemplazan temporalmente Biblioteca de los que se superponen a ella y conservar la identidad compartida de sus contextos.

**Why:** Abrir una ruta nativa y cerrar simultáneamente el overlay de Biblioteca produce dos movimientos y un desvanecimiento superpuestos. Además, Biblioteca vive por encima del navegador raíz: conservarla sin cambiar la presentación del detalle puede ocultar la ruta nueva.

**How to apply:** En iOS usar una presentación nativa transparente sin transición propia y animar solo el panel interior; al volver no remontar Biblioteca. No extender esta solución directamente a web/Android sin comprobar el apilado del overlay raíz en esas plataformas.
