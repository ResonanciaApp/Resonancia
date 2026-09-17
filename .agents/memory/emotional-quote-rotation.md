---
name: Rotación de frases emocionales
description: Reglas de durabilidad, fallback y concurrencia para la rotación editorial del cierre emocional.
---

La rotación es independiente por emoción, usa la primera emoción seleccionada y avanza solo después de guardar correctamente el registro. El registro exitoso debe incluir el slot consumido; al iniciar, el estado se reconcilia desde el registro más reciente de cada emoción.

**Why:** El contador de rotación se guarda por separado para acceso rápido, pero su escritura puede fallar después de que el historial ya quedó persistido. Sin el slot dentro del historial, la app repetiría una frase después de reiniciar.

**How to apply:** Cualquier cambio al cierre emocional debe tratar el historial como fuente de recuperación, mantener bloqueo single-flight durante el guardado y descartar continuaciones visuales de aperturas antiguas. Si Admin no publica siete frases completas, se conserva la frase local existente con su autor y fondo.