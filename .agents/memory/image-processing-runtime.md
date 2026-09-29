---
name: Edición de imágenes en el runtime
description: Disponibilidad real de herramientas de procesamiento de PNG en este workspace.
---

Pillow puede informar una versión instalada al importar `PIL`, pero `from PIL import Image` falla aquí con `ImportError: cannot import name '_imaging'`. Para procesar imágenes binarias, ImageMagick funciona sin instalar paquetes.

**Why:** El paquete Python está incompleto en el entorno actual; comprobar solo su número de versión da un falso positivo.

**How to apply:** Si hay que transformar PNGs, preferir `magick` o verificar primero `from PIL import Image` antes de basarse en Pillow. Revisar los canales y el alfa del resultado con `identify` o muestras de píxeles.