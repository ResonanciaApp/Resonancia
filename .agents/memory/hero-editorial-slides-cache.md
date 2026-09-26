---
name: Slides editoriales del hero
description: Comportamiento de los slides publicados de Inicio 3 cuando falla temporalmente la API.
---

Los slides 2–4 de Inicio 3 pertenecen a la configuración editorial publicada. Ante una caída temporal de la API, conservar la última configuración válida; no sustituirla por imágenes o textos incluidos en el bundle. Si nunca hubo una respuesta válida, mostrar solo el primer slide en lugar de inventar los otros.

**Why:** Cuando se detuvo la API, el fallback con slides de ejemplo hizo creer que el contenido publicado había sido cambiado. El primer slide también perdió su imagen remota temporalmente.

**How to apply:** Al cambiar la carga o el render del hero, distinguir fallo de red de respuesta publicada vacía o deshabilitada. Una respuesta exitosa, incluso vacía, reemplaza el caché; una falla conserva lo último válido. La imagen diaria debe poder caer a un asset local si falla su carga.