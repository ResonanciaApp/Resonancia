---
name: Edición de imágenes en el runtime
description: Disponibilidad real de herramientas de procesamiento de PNG en este workspace.
---

Pillow puede informar una versión instalada al importar `PIL`, pero `from PIL import Image` falla aquí con `ImportError: cannot import name '_imaging'`. Para procesar imágenes binarias, ImageMagick funciona sin instalar paquetes.

**Why:** El paquete Python está incompleto en el entorno actual; comprobar solo su número de versión da un falso positivo.

**How to apply:** Si hay que transformar PNGs, preferir `magick` o verificar primero `from PIL import Image` antes de basarse en Pillow. Revisar los canales y el alfa del resultado con `identify` o muestras de píxeles.

La eliminación de fondos de muchas imágenes debe usar concurrencia limitada, no lanzar todo el lote a la vez.

**Why:** Un lote concurrente de 17 recortes devolvió 429 para parte de las imágenes; completar solo las fallidas secuencialmente funcionó.

**How to apply:** Separar la edición de imágenes del recorte de fondo, recoger todos los resultados y reintentar únicamente las fallidas con menor concurrencia. Verificar el alfa real: una instrucción de transparencia en la edición no garantiza un PNG transparente.