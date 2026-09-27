---
name: Reproducción Ambiental por superficie
description: Regla para decidir el flujo de temporizador y reproductor Ambiental cuando la categoría técnica de una sesión no coincide con su superficie editorial.
---

Las superficies editoriales marcadas explícitamente como Ambientales deben abrir primero el selector de duración y después el reproductor Ambiental, aunque una sesión conserve una categoría técnica como Sonidos Ancestrales o Música y Sonidos.

**Why:** Las colecciones de Sonidos reúnen sesiones de varias categorías técnicas bajo una experiencia Ambiental. Depender solo de `categoryId` omite el temporizador y abre el reproductor normal.

**How to apply:** Al crear o modificar una portada, colección, búsqueda o subcategoría Ambiental, transmitir explícitamente esa intención al flujo de reproducción. Fuera de esas superficies, conservar el comportamiento derivado de la categoría real.

Dentro del reproductor Ambiental, el contenido se oculta y reaparece únicamente al tocar el fondo, con fade en ambos sentidos. No debe auto-ocultarse por inactividad.

**Why:** El auto-ocultado retrasado hacía que un tap pareciera no responder y retiraba los controles sin una acción explícita.

**How to apply:** Mantener un toggle inmediato controlado por el usuario; los botones internos siguen ejecutando sus propias acciones y no deben activar el toggle del fondo.

El reproductor normal de sesiones entra automáticamente en el mismo modo inmersivo del tap después de 10 segundos con controles visibles; el reproductor Ambiental sigue siendo manual.

**Why:** El usuario pidió auto-inmersión solo para las sesiones no Ambientales, conservando en Ambientales la decisión previa de no auto-ocultar controles.

**How to apply:** Al modificar visibilidad del reproductor, distinguir los dos flujos. En sesiones normales, suspender la espera cuando el reproductor no esté en primer plano o haya un panel abierto.