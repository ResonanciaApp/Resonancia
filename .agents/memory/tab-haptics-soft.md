---
name: Háptica suave del tab bar
description: Preferencia táctil para la navegación inferior de la app móvil.
---

Los taps de navegación en el tab bar deben sentirse suaves y amortiguados, no como un golpe medio ni una secuencia de vibraciones.

**Why:** El usuario pidió una vibración más sutil y «difuminada». La API háptica del sistema ofrece un impacto Soft, pero no una envolvente de fade ajustable; encadenar pulsos puede hacerla más notoria en vez de más delicada.

**How to apply:** Al tocar la sensación del tab bar, conservar un solo pulso nativo suave. No sustituirlo por impactos más fuertes o varias llamadas para simular un fade sin una petición explícita.