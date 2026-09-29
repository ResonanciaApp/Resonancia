---
name: Assets nuevos y Metro
description: Orden de generación de imágenes locales y recuperación de Metro ante un require prematuro.
---

Generar y guardar un asset local antes de añadir su `require()` estático al código Expo. Si Metro intenta resolverlo cuando aún no existe, puede seguir mostrando el error de módulo ausente incluso después de generarlo; reiniciar el workflow una vez con el archivo presente.

**Why:** Al añadir una ilustración generada de forma asíncrona, Metro observó la nueva referencia antes de que terminara la generación y registró un error de resolución; al reiniciar con el PNG presente, los bundles web e iOS volvieron a compilar.

**How to apply:** En futuras incorporaciones de imágenes generadas, esperar el archivo final antes de editar las referencias estáticas. Si ya hubo un fallo de resolución, confirmar que la ruta existe y reiniciar el workflow móvil una vez.