---
name: Selección diaria de Para este momento
description: Consumo del ciclo editorial, reservas de Admin y elecciones manuales del día chileno
---

La selección es editorial y global: Inicio y Descubrir deben compartir el mismo día de America/Santiago, no una elección personalizada por teléfono. Música está excluida deliberadamente por ahora, no por una limitación del reproductor.

La vista previa de Admin puede reservar una automática, pero no debe consumirla como si el público la hubiese recibido. Si se usa una manual durante todo ese día, la automática no expuesta vuelve al ciclo pendiente. Quitar la manual antes de terminar el día recupera esa misma reserva, no otro sorteo.

Una manual recibida públicamente cuenta como vista para su propio ID dentro del ciclo, nunca para las otras candidatas. Si era la última pendiente, el siguiente ciclo debe evitar repetirla inmediatamente, aunque no haya sido una selección automática.

**Why:** abrir Admin antes de elegir una manual genera una reserva automática invisible para los usuarios; consumirla perdería una sesión sin mostrarla. No contar la manual mostrada puede repetirla al día siguiente cuando queda sola en la cola.

**How to apply:** conservar la separación entre reserva, exposición pública y elección manual al cambiar la gestión editorial. Priorizar evitar la última sesión realmente mostrada; con dos candidatas, puede ser imposible evitar también la última automática anterior.

El selector de Admin debe mostrar el inventario editorial completo, no solo las sesiones aptas para destacar. Las categorías oficiales deben seguir visibles aunque estén vacías; las sesiones no aptas muestran su motivo y no se pueden elegir.

**Why:** ocultar borradores, placeholders y sesiones sin audio hizo que el usuario interpretara la lista de candidatas como un catálogo incompleto, especialmente en Historias y Reflexiones.

**How to apply:** separar la consulta del inventario privado del pool reproducible del ciclo. No ampliar la elegibilidad pública para resolver un problema de visibilidad ni fabricar contenido para llenar categorías vacías.