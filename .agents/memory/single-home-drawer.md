---
name: Drawer único de Inicio
description: Decisión sobre la única estructura válida del drawer y su estado de animación al reabrir.
---

El drawer global debe tener una sola estructura: la correspondiente a Inicio 3. No reintroducir modos, ramas visuales ni selectores exclusivos del Inicio antiguo.

**Why:** La coexistencia del modo legado dejaba comportamientos distintos según la ruta de origen. Además, el desplazamiento del gesto de cierre podía sobrevivir brevemente y provocar un salto al reabrir.

**How to apply:** Toda superficie debe abrir el drawer sin indicar variantes. Al comenzar una apertura, cancelar y restablecer cualquier desplazamiento residual del gesto antes de mostrar el panel.

Mezclador y Respiración continúan directamente debajo de Notificaciones, sin título «Herramientas» ni separación de grupo. Registro de ánimo se retiró solo del menú.

**Why:** El usuario pidió eliminar ese título y aplicar la separación estándar; posteriormente pidió sacar Registro de ánimo del menú, no de la app.

**How to apply:** Conservar el orden y la separación regular entre filas; no reintroducir un encabezado ni reservar un hueco para la antigua sección.

Las escenas deben conservar su altura cuando crecen los menús o se agregan opciones encima; no desplazarlas por esos cambios salvo que el usuario lo pida.

**Why:** El usuario pidió mantenerlas y corrigió el desplazamiento causado por la nueva opción Perfil y el aumento de separación entre menús.

**How to apply:** Compensar primero el espacio vacío que separa el menú de las escenas, conservando el tamaño y las opciones de las escenas; no reducir la separación solicitada entre menús.