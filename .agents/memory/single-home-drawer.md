---
name: Drawer único de Inicio
description: Decisión sobre la única estructura válida del drawer y su estado de animación al reabrir.
---

El drawer global debe tener una sola estructura: la correspondiente a Inicio 3. No reintroducir modos, ramas visuales ni selectores exclusivos del Inicio antiguo.

**Why:** La coexistencia del modo legado dejaba comportamientos distintos según la ruta de origen. Además, el desplazamiento del gesto de cierre podía sobrevivir brevemente y provocar un salto al reabrir.

**How to apply:** Toda superficie debe abrir el drawer sin indicar variantes. Al comenzar una apertura, cancelar y restablecer cualquier desplazamiento residual del gesto antes de mostrar el panel.