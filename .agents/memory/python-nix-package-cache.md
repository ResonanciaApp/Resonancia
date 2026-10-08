---
name: Paquetes Python y prefijos Nix
description: Una instalación fallida en el prefijo inmutable puede haber descargado ya el módulo utilizable para generar assets.
---

Un error de instalación Python en un prefijo de Nix de solo lectura no significa que la descarga del paquete haya fallado.

**Why:** Al generar un peso exacto de Manrope, el instalador administrado descargó fontTools pero no pudo copiarlo al prefijo inmutable. El módulo descargado seguía disponible en la caché UV del workspace.

**How to apply:** Comprobar primero la caché local de la instalación administrada. Si el módulo ya existe, puede utilizarse con una ruta limitada al proceso de generación de assets. Verificar su existencia cada vez; no guardar una ruta con ID de caché, modificar Nix ni crear un entorno virtual.
