---
name: Object Storage — URLs absolutas en React Native
description: Distinguir rutas remotas de Object Storage de fotos locales y mantener una identidad nueva por selección de avatar.
---

## Regla

En React Native, las rutas relativas de Object Storage necesitan una URL absoluta del API. Las URI del dispositivo o navegador (file, content, ph, assets-library, blob y data) no son rutas del servidor y deben conservarse.

**Why:** RN no tiene dominio base como un browser. En sentido contrario, añadir el dominio a una foto local rompe su carga; esto puede afectar solo a Inicio y al drawer mientras Perfil muestra correctamente la foto por usarla directamente.

**How to apply:** Antes de resolver una imagen o audio, distinguir URI absoluta de ruta remota relativa. No cambiar la prioridad local del avatar para ocultar una ruta inválida: la foto debe mostrarse sin esperar la subida.

Cada selección de una foto de avatar debe tener una identidad de archivo nueva, incluso si reemplaza otra imagen con la misma extensión.

**Why:** Sobrescribir el mismo archivo conserva su URI; esto puede mantener píxeles viejos en la caché y hacer que la sincronización considere la foto ya enviada. El problema no se limita a un refresco visual.

**How to apply:** Mantener identidad nueva por selección al cambiar el almacenamiento de fotos; no volver a un destino fijo ni resolverlo únicamente desactivando la caché.
