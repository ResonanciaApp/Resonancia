---
name: Expo HMR y tema visual
description: Error de contexto observado al recargar en caliente cambios de la paleta visual móvil.
---

Al cambiar únicamente los tonos del tema visual, Fast Refresh de Expo ha mostrado de forma repetida `useSceneTheme must be inside SceneThemeProvider` en iOS, aunque el provider sí rodea al consumidor en el árbol. No asumir que los nuevos valores de color dañaron el contexto.

**Why:** El error apareció varias veces tras editar solo los colores; la comprobación de tipos y la compilación del bundle pasaron. El inicio limpio del servidor no mostró el error de inmediato, pero eso no demuestra por sí solo que la sesión cliente haya quedado corregida.

**How to apply:** Ante ese error durante una recarga en caliente, realizar una carga completa y comprobar el cliente otra vez antes de modificar los providers. Si también aparece tras una carga limpia, investigarlo como fallo real y no ocultar la excepción.