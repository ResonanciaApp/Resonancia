---
name: Celebración de día de racha
description: Flujo 2 pantallas al completar el día; disparo confiable vía evento local
---

Regla: cualquier feature que reaccione a "acaba de pasar X en la actividad" NO debe inferirlo comparando snapshots de `statEvents` (la hidratación de storage y el merge con la nube producen transiciones falsas, p. ej. relanzar la app justo tras escuchar). PlayerContext expone `lastLocalStat` ({event, seq}) que SOLO setea recordStat — disparar desde ahí y calcular el "antes" filtrando esa referencia exacta del array.

**Cómo funciona el flujo:** una vez por día (clave persistida), al completar el día (meta 3 min o sesión completada) se abre StreakCelebrationFlow (Modal raíz full-screen, 2 páginas). Mientras está abierto, `setCelebrationHold(true)` en MilestonesContext oculta hitos sin vaciar la cola (se muestran al cerrar). La pantalla de sesión suprime su popup de estrellas vía `shouldSuppressRating(sessionId)` (flujo abierto o ventana de 60 s). Los botones Mañana/Tarde/Noche solo persisten la preferencia (`@resonance_reminder_slot`) — comportamiento final pendiente de definir por el usuario.
