---
name: Transacciones de recordatorios locales
description: Regla de consistencia entre preferencias persistidas y alarmas nativas de práctica
---

Al activar, reprogramar o desactivar un recordatorio desde una acción del usuario, la operación nativa debe propagar errores y restaurar tanto la preferencia persistida como la alarma anterior si falla.

**Why:** Una cancelación tolerante puede guardar `enabled=false` aunque la notificación siga programada, dejando la interfaz y el sistema operativo en estados distintos.

**How to apply:** Usa operaciones estrictas en flujos de configuración. Reserva las variantes que absorben errores para reconciliación al iniciar, borrado de cuenta y otras limpiezas best-effort.