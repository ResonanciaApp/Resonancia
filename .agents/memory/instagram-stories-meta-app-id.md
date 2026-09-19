---
name: Instagram Stories requiere Meta App ID
description: Requisitos externos y nativos para compartir imágenes directamente al compositor de Instagram Stories.
---

La integración directa con Instagram Stories debe usar como `source_application` el Meta/Facebook App ID numérico y público de la aplicación. El bundle ID o package name no sustituye ese identificador.

**Why:** Instagram puede rechazar o ignorar silenciosamente un identificador de origen incorrecto. Además, iOS necesita consultar `instagram-stories` y Android 11+ necesita visibilidad explícita de `com.instagram.android`.

**How to apply:** Antes de dar por terminada una integración de Stories, configurar el Meta App ID público en el build, conservar las declaraciones nativas mediante configuración reproducible y validar el compositor en dispositivos físicos iOS y Android.