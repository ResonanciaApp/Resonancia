---
name: Reproducción protegida de Bunny
description: Restricción de entrega para los videos de Bunny Stream y ruta de reproducción compatible con Mobile.
---

La biblioteca de Bunny protege las URLs HLS directas del CDN: `playlist.m3u8` y sus segmentos responden 403 sin firma. Mobile debe reproducir la URL oficial de embed entregada por el API, no construir una URL HLS desde el hostname y el GUID.

**Why:** El reproductor nativo mostraba controles sin duración ni avance porque nunca lograba cargar el manifiesto. El reproductor oficial de Bunny sí resuelve la protección del CDN y expone tiempo, progreso, volumen y pantalla completa.

**How to apply:** Para cards se puede seguir usando metadata editorial del API. Para reproducción, mantener `playbackUrl` como dato server-owned y usar el embed oficial; reservar la URL nativa para archivos legacy fuera de Bunny.